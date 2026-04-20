import { describe, expect, it } from 'vitest'
import { RelationshipModel } from '@/modeler/model/relationship/relationship-model'
import { TableModel } from '@/modeler/model/table/table-model'

describe('RelationshipModel', () => {
  it('links two tables with a relationship', () => {
    const source = TableModel.create({ id: 'table_users', name: 'users', x: 0, y: 0 })
    const target = TableModel.create({ id: 'table_orders', name: 'orders', x: 200, y: 0 })

    const relationship = RelationshipModel.create({
      id: 'rel_users_orders',
      primaryTable: source,
      secondaryTable: target,
    })

    expect(relationship.primaryTable.identification).toBe('table_users')
    expect(relationship.secondaryTable.identification).toBe('table_orders')
  })
})
