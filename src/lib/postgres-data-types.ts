export type PostgresDataTypeDefinition = {
  code: string
  label: string
  supportsSize: boolean
  aliases: string[]
}

export const postgresDataTypes: PostgresDataTypeDefinition[] = [
  { code: 'smallint', label: 'SMALLINT', supportsSize: false, aliases: ['int2'] },
  { code: 'integer', label: 'INTEGER', supportsSize: false, aliases: ['int', 'int4'] },
  { code: 'bigint', label: 'BIGINT', supportsSize: false, aliases: ['int8'] },
  { code: 'decimal', label: 'DECIMAL', supportsSize: true, aliases: ['numeric', 'dec'] },
  { code: 'real', label: 'REAL', supportsSize: false, aliases: ['float4'] },
  { code: 'double precision', label: 'DOUBLE PRECISION', supportsSize: false, aliases: ['float8'] },
  { code: 'serial', label: 'SERIAL', supportsSize: false, aliases: ['serial4'] },
  { code: 'bigserial', label: 'BIGSERIAL', supportsSize: false, aliases: ['serial8'] },
  { code: 'money', label: 'MONEY', supportsSize: false, aliases: [] },
  { code: 'char', label: 'CHAR', supportsSize: true, aliases: ['character', 'bpchar'] },
  { code: 'varchar', label: 'VARCHAR', supportsSize: true, aliases: ['character varying'] },
  { code: 'text', label: 'TEXT', supportsSize: false, aliases: [] },
  { code: 'boolean', label: 'BOOLEAN', supportsSize: false, aliases: ['bool'] },
  { code: 'uuid', label: 'UUID', supportsSize: false, aliases: [] },
  { code: 'date', label: 'DATE', supportsSize: false, aliases: [] },
  { code: 'time', label: 'TIME', supportsSize: true, aliases: ['time without time zone'] },
  { code: 'timetz', label: 'TIMETZ', supportsSize: true, aliases: ['time with time zone'] },
  {
    code: 'timestamp',
    label: 'TIMESTAMP',
    supportsSize: true,
    aliases: ['timestamp without time zone'],
  },
  {
    code: 'timestamptz',
    label: 'TIMESTAMPTZ',
    supportsSize: true,
    aliases: ['timestamp with time zone'],
  },
  { code: 'interval', label: 'INTERVAL', supportsSize: false, aliases: [] },
  { code: 'json', label: 'JSON', supportsSize: false, aliases: [] },
  { code: 'jsonb', label: 'JSONB', supportsSize: false, aliases: [] },
  { code: 'xml', label: 'XML', supportsSize: false, aliases: [] },
  { code: 'bytea', label: 'BYTEA', supportsSize: false, aliases: [] },
  { code: 'inet', label: 'INET', supportsSize: false, aliases: [] },
  { code: 'cidr', label: 'CIDR', supportsSize: false, aliases: [] },
  { code: 'macaddr', label: 'MACADDR', supportsSize: false, aliases: [] },
  { code: 'macaddr8', label: 'MACADDR8', supportsSize: false, aliases: [] },
  { code: 'point', label: 'POINT', supportsSize: false, aliases: [] },
  { code: 'line', label: 'LINE', supportsSize: false, aliases: [] },
  { code: 'lseg', label: 'LSEG', supportsSize: false, aliases: [] },
  { code: 'box', label: 'BOX', supportsSize: false, aliases: [] },
  { code: 'path', label: 'PATH', supportsSize: false, aliases: [] },
  { code: 'polygon', label: 'POLYGON', supportsSize: false, aliases: [] },
  { code: 'circle', label: 'CIRCLE', supportsSize: false, aliases: [] },
  { code: 'tsvector', label: 'TSVECTOR', supportsSize: false, aliases: [] },
  { code: 'tsquery', label: 'TSQUERY', supportsSize: false, aliases: [] },
  { code: 'int4range', label: 'INT4RANGE', supportsSize: false, aliases: [] },
  { code: 'int8range', label: 'INT8RANGE', supportsSize: false, aliases: [] },
  { code: 'numrange', label: 'NUMRANGE', supportsSize: false, aliases: [] },
  { code: 'tsrange', label: 'TSRANGE', supportsSize: false, aliases: [] },
  { code: 'tstzrange', label: 'TSTZRANGE', supportsSize: false, aliases: [] },
  { code: 'daterange', label: 'DATERANGE', supportsSize: false, aliases: [] },
]

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
