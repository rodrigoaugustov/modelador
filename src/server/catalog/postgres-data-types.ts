export const postgresDataTypes = [
  { code: 'uuid', label: 'UUID', supportsSize: false },
  { code: 'varchar', label: 'VARCHAR', supportsSize: true },
  { code: 'numeric', label: 'NUMERIC', supportsSize: true },
  { code: 'text', label: 'TEXT', supportsSize: false },
  { code: 'integer', label: 'INTEGER', supportsSize: false },
  { code: 'bigint', label: 'BIGINT', supportsSize: false },
  { code: 'boolean', label: 'BOOLEAN', supportsSize: false },
] as const

export function findPostgresDataType(code: string | null | undefined) {
  if (!code) {
    return null
  }

  return postgresDataTypes.find((dataType) => dataType.code === code.toLowerCase()) ?? null
}

export function isSupportedPostgresDataType(code: string | null | undefined) {
  return findPostgresDataType(code) !== null
}

export function formatPostgresDataType(input: { code: string | null | undefined; size: string | null | undefined }) {
  const resolvedType = findPostgresDataType(input.code)

  if (!resolvedType) {
    return (input.code ?? 'text').toLowerCase()
  }

  if (resolvedType.supportsSize && input.size) {
    return `${resolvedType.code}(${input.size})`
  }

  return resolvedType.code
}
