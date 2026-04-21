import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'
import { formatPostgresDataType } from '@/server/catalog/postgres-data-types'

type PostgresColumn = {
  id: string
  name: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
}

type PostgresForeignKey = {
  columns: string[]
  referencesTable: string
  referencesColumns: string[]
  onDelete: string
  onUpdate: string
}

type ValidationSnapshot = Pick<EditorProjectSnapshot, 'model'>

function resolveTableSchema(schema: string | null | undefined) {
  return schema?.trim() ? schema : 'public'
}

export function mapProjectToPostgresTables(snapshot: ValidationSnapshot) {
  const tablesById = new Map(snapshot.model.tables.map((table) => [table.id, table]))

  return snapshot.model.tables.map((table) => {
    const columns: PostgresColumn[] = [...(table.attributes ?? [])]
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((attribute) => ({
        id: attribute.id,
        name: attribute.physicalName ?? attribute.logicalName,
        dataType: formatPostgresDataType({
          code: attribute.dataType,
          size: attribute.size,
        }),
        isNullable: attribute.isNull,
        isPrimaryKey: attribute.isPrimaryKey,
      }))

    const foreignKeys: PostgresForeignKey[] = snapshot.model.relationships
      .filter(
        (relationship) =>
          relationship.enforceConstraint &&
          relationship.secondaryTableId === table.id &&
          relationship.primaryTableId !== relationship.secondaryTableId,
      )
      .flatMap((relationship) => {
        const referencedTable = tablesById.get(relationship.primaryTableId)

        if (!referencedTable || relationship.attributeMappings.length === 0) {
          return []
        }

        const referencedColumns = relationship.attributeMappings.map((mapping) =>
          tablesById
            .get(relationship.primaryTableId)
            ?.attributes.find((attribute) => attribute.id === mapping.primaryAttributeId),
        )
        const currentColumns = relationship.attributeMappings.map((mapping) =>
          columns.find((column) => column.id === mapping.secondaryAttributeId),
        )

        if (referencedColumns.some((column) => !column) || currentColumns.some((column) => !column)) {
          return []
        }

        return [
          {
            columns: currentColumns.map((column) => column!.name),
            referencesTable: `${resolveTableSchema(referencedTable.schema)}.${referencedTable.physicalName ?? referencedTable.logicalName}`,
            referencesColumns: referencedColumns.map(
              (column) => column!.physicalName ?? column!.logicalName,
            ),
            onDelete: relationship.onDelete,
            onUpdate: relationship.onUpdate,
          },
        ]
      })

    return {
      tableName: `${resolveTableSchema(table.schema)}.${table.physicalName ?? table.logicalName}`,
      columns,
      primaryKeys: columns.filter((column) => column.isPrimaryKey).map((column) => column.name),
      foreignKeys,
    }
  })
}
