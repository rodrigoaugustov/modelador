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

  it('stores relationship segments derived from the connected tables', () => {
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
      onUpdate: 'cascade',
      enforceConstraint: true,
    })

    expect(relationship.segmentList.length).toBeGreaterThan(0)
    expect(relationship.segmentList[0]?.label).toBe('1:N')
  })

  it('stores line style and manual vertices for later edge routing', () => {
    const source = TableModel.create({ id: 'table_users', name: 'users', x: 0, y: 0 })
    const target = TableModel.create({ id: 'table_orders', name: 'orders', x: 200, y: 0 })

    const relationship = RelationshipModel.create({
      id: 'rel_users_orders',
      primaryTable: source,
      secondaryTable: target,
      lineStyle: 'curved',
      vertices: [
        { x: 96, y: 32 },
        { x: 156, y: 96 },
      ],
    })

    expect(relationship.lineStyle).toBe('curved')
    expect(relationship.vertices).toEqual([
      { x: 96, y: 32 },
      { x: 156, y: 96 },
    ])
  })
})
