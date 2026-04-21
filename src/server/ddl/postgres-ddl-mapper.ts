import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'

type PostgresColumn = {
  id: string
  name: string
  dataType: string
  isNullable: boolean
  isPrimaryKey: boolean
}

type PostgresForeignKey = {
  column: string
  referencesTable: string
  referencesColumn: string
  onDelete: string
  onUpdate: string
}

type ValidationSnapshot = Pick<EditorProjectSnapshot, 'model'>

export function mapProjectToPostgresTables(snapshot: ValidationSnapshot) {
  const tablesById = new Map(snapshot.model.tables.map((table) => [table.id, table]))

  return snapshot.model.tables.map((table) => {
    const columns: PostgresColumn[] = (table.attributes ?? []).map((attribute) => ({
      id: attribute.id,
      name: attribute.physicalName ?? attribute.logicalName,
      dataType: attribute.dataType ?? 'text',
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
        const referencedColumn = tablesById
          .get(relationship.primaryTableId)
          ?.attributes.find((attribute) => attribute.id === relationship.primaryAttributeId)
        const currentColumn = columns.find((column) => column.id === relationship.secondaryAttributeId)

        if (!referencedTable || !referencedColumn || !currentColumn) {
          return []
        }

        return [
          {
            column: currentColumn.name,
            referencesTable: referencedTable.physicalName ?? referencedTable.logicalName,
            referencesColumn: referencedColumn.physicalName ?? referencedColumn.logicalName,
            onDelete: relationship.onDelete,
            onUpdate: relationship.onUpdate,
          },
        ]
      })

    return {
      tableName: table.physicalName ?? table.logicalName,
      columns,
      primaryKeys: columns.filter((column) => column.isPrimaryKey).map((column) => column.name),
      foreignKeys,
    }
  })
}
