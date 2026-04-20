type ValidationResult = {
  isValid: boolean
  errors: string[]
}

export function validateProjectModel(snapshot: any): ValidationResult {
  const errors: string[] = []

  for (const table of snapshot.model.tables) {
    const tableName = table.physicalName ?? table.logicalName

    if (!tableName || !tableName.trim()) {
      errors.push(`Table name is required for ${table.id}`)
    }

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

  return {
    isValid: errors.length === 0,
    errors,
  }
}
