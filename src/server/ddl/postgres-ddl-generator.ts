import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'
import { mapProjectToPostgresTables } from '@/server/ddl/postgres-ddl-mapper'
import { validateProjectModel } from '@/server/validation/model-validator'

type ValidationSnapshot = Pick<EditorProjectSnapshot, 'model'>

export function generatePostgresDDL(snapshot: ValidationSnapshot) {
  const validation = validateProjectModel(snapshot)

  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'))
  }

  return mapProjectToPostgresTables(snapshot)
    .map((table) => {
      const columns = table.columns.map((column) => {
        const notNullClause = column.isNullable ? '' : ' not null'
        return `  ${column.name} ${column.dataType}${notNullClause}`
      })

      if (table.primaryKeys.length > 0) {
        columns.push(`  primary key (${table.primaryKeys.join(', ')})`)
      }

      for (const foreignKey of table.foreignKeys) {
        columns.push(
          `  foreign key (${foreignKey.column}) references ${foreignKey.referencesTable} (${foreignKey.referencesColumn}) on delete ${foreignKey.onDelete} on update ${foreignKey.onUpdate}`,
        )
      }

      return `create table ${table.tableName} (\n${columns.join(',\n')}\n);`
    })
    .join('\n\n')
}
