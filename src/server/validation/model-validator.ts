import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'
import { isSupportedPostgresDataType } from '@/server/catalog/postgres-data-types'

type ValidationResult = {
  isValid: boolean
  errors: string[]
}

type ValidationSnapshot = Pick<EditorProjectSnapshot, 'model'>

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
    if (!tableIds.has(relationship.primaryTableId) || !tableIds.has(relationship.secondaryTableId)) {
      errors.push(`Relationship ${relationship.id} references an unknown table`)
      continue
    }

    const primaryAttributes = attributeIdsByTable.get(relationship.primaryTableId)
    const secondaryAttributes = attributeIdsByTable.get(relationship.secondaryTableId)

    if (!primaryAttributes?.has(relationship.primaryAttributeId)) {
      errors.push(`Relationship ${relationship.id} references an unknown primary attribute`)
    }

    if (!secondaryAttributes?.has(relationship.secondaryAttributeId)) {
      errors.push(`Relationship ${relationship.id} references an unknown secondary attribute`)
    }

    if (!relationship.enforceConstraint) {
      continue
    }

    const primaryAttribute = attributesByTable.get(relationship.primaryTableId)?.get(relationship.primaryAttributeId)
    const primaryTable = tablesById.get(relationship.primaryTableId)

    if (
      primaryTable &&
      primaryAttribute &&
      relationship.relationshipType !== 'many-to-many' &&
      !primaryAttribute.isPrimaryKey
    ) {
      errors.push(`Relationship ${relationship.id} must reference a primary key or unique parent column`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
