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

  it('stores referential metadata for the relationship', () => {
    const source = TableModel.create({ id: 'table_users', name: 'users', x: 0, y: 0 })
    const target = TableModel.create({ id: 'table_orders', name: 'orders', x: 200, y: 0 })

    const relationship = RelationshipModel.create({
      id: 'rel_users_orders',
      primaryTable: source,
      secondaryTable: target,
      primaryAttributeId: 'attr_users_id',
      secondaryAttributeId: 'attr_orders_user_id',
      relationshipType: 'one-to-many',
      onDelete: 'cascade',
      onUpdate: 'restrict',
      enforceConstraint: true,
    })

    expect(relationship.primaryAttributeId).toBe('attr_users_id')
    expect(relationship.secondaryAttributeId).toBe('attr_orders_user_id')
    expect(relationship.relationshipType).toBe('one-to-many')
    expect(relationship.onDelete).toBe('cascade')
    expect(relationship.onUpdate).toBe('restrict')
    expect(relationship.enforceConstraint).toBe(true)
  })
})
