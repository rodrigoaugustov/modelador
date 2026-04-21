import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'
import { isSupportedPostgresDataType } from '@/server/catalog/postgres-data-types'

type ValidationResult = {
  isValid: boolean
  errors: string[]
}

type ValidationSnapshot = Pick<EditorProjectSnapshot, 'model'>

function resolveTableName(table: ValidationSnapshot['model']['tables'][number] | undefined) {
  return table?.physicalName ?? table?.logicalName ?? table?.id ?? 'unknown table'
}

function resolveQualifiedTableName(table: ValidationSnapshot['model']['tables'][number] | undefined) {
  const tableName = resolveTableName(table)
  const schema = table?.schema?.trim() ? table.schema : 'public'
  return `${schema}.${tableName}`
}

function resolveAttributeName(
  attribute:
    | ValidationSnapshot['model']['tables'][number]['attributes'][number]
    | undefined,
) {
  return attribute?.physicalName ?? attribute?.logicalName ?? attribute?.id ?? 'unknown column'
}

export function validateProjectModel(snapshot: ValidationSnapshot): ValidationResult {
  const errors: string[] = []
  const seenTableNames = new Set<string>()
  const tableIds = new Set(snapshot.model.tables.map((table) => table.id))
  const tablesById = new Map(snapshot.model.tables.map((table) => [table.id, table]))
  const attributeIdsByTable = new Map(
    snapshot.model.tables.map((table) => [table.id, new Set((table.attributes ?? []).map((attribute) => attribute.id))]),
  )
  const attributesByTable = new Map(
    snapshot.model.tables.map((table) => [table.id, new Map((table.attributes ?? []).map((attribute) => [attribute.id, attribute]))]),
  )

  for (const table of snapshot.model.tables) {
    const tableName = table.physicalName ?? table.logicalName

    if (!tableName || !tableName.trim()) {
      errors.push(`Table name is required for ${table.id}`)
      continue
    }

    if (seenTableNames.has(tableName)) {
      errors.push(`Duplicate table name ${tableName}`)
    }

    seenTableNames.add(tableName)

    const seen = new Set<string>()

    for (const attribute of table.attributes ?? []) {
      const attributeName = attribute.physicalName ?? attribute.logicalName

      if (!attributeName || !attributeName.trim()) {
        errors.push(`Attribute name is required for table ${table.id}`)
        continue
      }

      if (seen.has(attributeName)) {
        errors.push(`Duplicate attribute name ${attributeName} in table ${table.id}`)
      }

      seen.add(attributeName)

      if (attribute.dataType && !isSupportedPostgresDataType(attribute.dataType)) {
        errors.push(`Unsupported PostgreSQL data type ${attribute.dataType} in table ${table.id}`)
      }
    }
  }

  for (const relationship of snapshot.model.relationships) {
    const primaryTable = tablesById.get(relationship.primaryTableId)
    const secondaryTable = tablesById.get(relationship.secondaryTableId)

    if (!tableIds.has(relationship.primaryTableId) || !tableIds.has(relationship.secondaryTableId)) {
      errors.push(`Relationship ${relationship.id} references an unknown table`)
      continue
    }

    const primaryAttributes = attributeIdsByTable.get(relationship.primaryTableId)
    const secondaryAttributes = attributeIdsByTable.get(relationship.secondaryTableId)
    const primaryPkIds = new Set(
      (primaryTable?.attributes ?? []).filter((attribute) => attribute.isPrimaryKey).map((attribute) => attribute.id),
    )
    const mappedPrimaryIds = new Set<string>()

    if (!relationship.attributeMappings?.length) {
      errors.push(`Relationship ${relationship.id} must define at least one attribute mapping`)
      continue
    }

    for (const mapping of relationship.attributeMappings) {
      const primaryAttribute = attributesByTable.get(relationship.primaryTableId)?.get(mapping.primaryAttributeId)
      const secondaryAttribute = attributesByTable.get(relationship.secondaryTableId)?.get(mapping.secondaryAttributeId)
      const relationshipLabel = `${resolveTableName(primaryTable)}.${resolveAttributeName(primaryAttribute)} -> ${resolveTableName(secondaryTable)}.${resolveAttributeName(secondaryAttribute)}`

      if (!primaryAttributes?.has(mapping.primaryAttributeId)) {
        errors.push(`Relationship ${relationshipLabel} references an unknown primary attribute`)
        continue
      }

      if (!secondaryAttributes?.has(mapping.secondaryAttributeId)) {
        errors.push(`Relationship ${relationshipLabel} references an unknown secondary attribute`)
        continue
      }

      mappedPrimaryIds.add(mapping.primaryAttributeId)

      if (
        relationship.enforceConstraint &&
        relationship.relationshipType !== 'many-to-many' &&
        primaryAttribute &&
        !primaryAttribute.isPrimaryKey
      ) {
        errors.push(`Relationship ${relationshipLabel} must reference a primary key parent column`)
      }
    }

    if (
      relationship.enforceConstraint &&
      relationship.relationshipType !== 'many-to-many' &&
      primaryPkIds.size > 1 &&
      mappedPrimaryIds.size !== primaryPkIds.size
    ) {
      errors.push(
        `Relationship ${resolveQualifiedTableName(primaryTable)} must map all parent primary key columns when enforcing a composite key constraint`,
      )
      continue
    }

    if (
      relationship.enforceConstraint &&
      relationship.relationshipType !== 'many-to-many' &&
      primaryPkIds.size > 1 &&
      Array.from(primaryPkIds).some((primaryKeyId) => !mappedPrimaryIds.has(primaryKeyId))
    ) {
      errors.push(
        `Relationship ${resolveQualifiedTableName(primaryTable)} must map all parent primary key columns when enforcing a composite key constraint`,
      )
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
