import { mapProjectToPostgresTables } from '@/server/ddl/postgres-ddl-mapper'
import { validateProjectModel } from '@/server/validation/model-validator'

export function generatePostgresDDL(snapshot: any) {
  const validation = validateProjectModel(snapshot)

  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'))
  }

  return mapProjectToPostgresTables(snapshot)
    .map((table: any) => {
      const columns = table.columns.map((column: any) => {
        const notNullClause = column.isNullable ? '' : ' not null'
        return `  ${column.name} ${column.dataType}${notNullClause}`
      })

      const primaryKeys = table.columns
        .filter((column: any) => column.isPrimaryKey)
        .map((column: any) => column.name)

      if (primaryKeys.length > 0) {
        columns.push(`  primary key (${primaryKeys.join(', ')})`)
      }

      return `create table ${table.tableName} (\n${columns.join(',\n')}\n);`
    })
    .join('\n\n')
}
