import { describe, expect, it } from 'vitest'
import { TableModel } from '@/modeler/model/table/table-model'

describe('TableModel', () => {
  it('creates a table with name and empty collections', () => {
    const table = TableModel.create({ id: 'table_users', name: 'users', x: 100, y: 120 })

    expect(table.identification).toBe('table_users')
    expect(table.tableAttributeList.size).toBe(0)
    expect(table.tablePrimaryKeyList.size).toBe(0)
  })
})
