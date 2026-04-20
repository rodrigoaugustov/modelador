import { describe, expect, it } from 'vitest'
import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'

describe('generatePostgresDDL', () => {
  it('generates create table ddl for a valid project', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: null,
            attributes: [
              { logicalName: 'id', physicalName: null, dataType: 'uuid', isPrimaryKey: true, isNull: false },
            ],
          },
        ],
        relationships: [],
      },
    })

    expect(ddl).toContain('create table users')
    expect(ddl).toContain('id uuid not null')
    expect(ddl).toContain('primary key (id)')
  })
})
