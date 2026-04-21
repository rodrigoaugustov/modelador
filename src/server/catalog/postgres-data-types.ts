export const postgresDataTypes = [
  { code: 'uuid', label: 'UUID', supportsSize: false, aliases: [] },
  { code: 'varchar', label: 'VARCHAR', supportsSize: true, aliases: ['character varying'] },
  { code: 'numeric', label: 'NUMERIC', supportsSize: true, aliases: ['decimal', 'dec'] },
  { code: 'text', label: 'TEXT', supportsSize: false, aliases: [] },
  { code: 'integer', label: 'INTEGER', supportsSize: false, aliases: ['int', 'int4'] },
  { code: 'bigint', label: 'BIGINT', supportsSize: false, aliases: ['int8'] },
  { code: 'boolean', label: 'BOOLEAN', supportsSize: false, aliases: ['bool'] },
] as const

export function findPostgresDataType(code: string | null | undefined) {
  if (!code) {
    return null
  }

  const normalizedCode = code.toLowerCase()

  return (
    postgresDataTypes.find(
      (dataType) => dataType.code === normalizedCode || dataType.aliases.includes(normalizedCode),
    ) ?? null
  )
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
