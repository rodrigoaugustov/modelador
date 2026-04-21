import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'

type ValidationResult = {
  isValid: boolean
  errors: string[]
}

type ValidationSnapshot = Pick<EditorProjectSnapshot, 'model'>

export function validateProjectModel(snapshot: ValidationSnapshot): ValidationResult {
  const errors: string[] = []
  const seenTableNames = new Set<string>()
  const tableIds = new Set(snapshot.model.tables.map((table) => table.id))
  const attributeIdsByTable = new Map(
    snapshot.model.tables.map((table) => [table.id, new Set((table.attributes ?? []).map((attribute) => attribute.id))]),
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
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
