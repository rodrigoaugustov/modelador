import { describe, expect, it } from 'vitest'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'

describe('ConfigureRelationshipFormHandler', () => {
  it('creates a one-to-many relationship draft with enforced constraint', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const draft = handler.createDraft('table_users', 'table_orders', 'attr_users_id', 'attr_orders_user_id')

    expect(draft.relationshipType).toBe('one-to-many')
    expect(draft.enforceConstraint).toBe(true)
    expect(draft.onDelete).toBe('cascade')
    expect(draft.attributeMappings).toEqual([
      expect.objectContaining({
        primaryAttributeId: 'attr_users_id',
        secondaryAttributeId: 'attr_orders_user_id',
      }),
    ])
  })

  it('updates delete and update actions for an existing relationship', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const next = handler.applyPatch(
      {
        id: 'rel_users_orders',
        primaryTableId: 'table_users',
        secondaryTableId: 'table_orders',
        attributeMappings: [
          {
            id: 'map_users_orders_user_id',
            primaryAttributeId: 'attr_users_id',
            secondaryAttributeId: 'attr_orders_user_id',
          },
        ],
        relationshipType: 'one-to-many',
        onDelete: 'cascade',
        onUpdate: 'cascade',
        enforceConstraint: true,
      },
      {
        onDelete: 'restrict',
        onUpdate: 'no action',
        enforceConstraint: false,
      },
    )

    expect(next.onDelete).toBe('restrict')
    expect(next.onUpdate).toBe('no action')
    expect(next.enforceConstraint).toBe(false)
  })

  it('prefers the first primary key when building a draft from tables', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const draft = handler.createDraftFromTables([
      {
        id: 'table_products',
        logicalName: 'products',
        physicalName: 'products',
        schema: 'public',
        coordinate: { x: 0, y: 0 },
        attributes: [
          {
            id: 'attr_products_code',
            logicalName: 'code',
            physicalName: 'code',
            dataType: 'integer',
            size: null,
            displayOrder: 0,
            isNull: false,
            isPrimaryKey: false,
            isForeignKey: false,
            definition: null,
            example: null,
            domain: null,
          },
          {
            id: 'attr_products_id',
            logicalName: 'id',
            physicalName: 'id',
            dataType: 'uuid',
            size: null,
            displayOrder: 1,
            isNull: false,
            isPrimaryKey: true,
            isForeignKey: false,
            definition: null,
            example: null,
            domain: null,
          },
        ],
      },
      {
        id: 'table_orders',
        logicalName: 'orders',
        physicalName: 'orders',
        schema: 'public',
        coordinate: { x: 240, y: 0 },
        attributes: [
          {
            id: 'attr_orders_product_id',
            logicalName: 'product_id',
            physicalName: 'product_id',
            dataType: 'uuid',
            size: null,
            displayOrder: 0,
            isNull: false,
            isPrimaryKey: false,
            isForeignKey: true,
            definition: null,
            example: null,
            domain: null,
          },
        ],
      },
    ])

    expect(draft.attributeMappings[0]?.primaryAttributeId).toBe('attr_products_id')
    expect(draft.attributeMappings[0]?.secondaryAttributeId).toBe('attr_orders_product_id')
  })

  it('adds another attribute mapping for composite keys using the next available columns', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const relationship = handler.createDraft('table_orders', 'table_order_items', 'attr_orders_store_id', 'attr_items_store_id')

    const next = handler.addAttributeMapping(relationship, [
      {
        id: 'table_orders',
        logicalName: 'orders',
        physicalName: 'orders',
        schema: 'public',
        coordinate: { x: 0, y: 0 },
        attributes: [
          {
            id: 'attr_orders_store_id',
            logicalName: 'store_id',
            physicalName: 'store_id',
            dataType: 'uuid',
            size: null,
            displayOrder: 0,
            isNull: false,
            isPrimaryKey: true,
            isForeignKey: false,
            definition: null,
            example: null,
            domain: null,
          },
          {
            id: 'attr_orders_number',
            logicalName: 'number',
            physicalName: 'number',
            dataType: 'integer',
            size: null,
            displayOrder: 1,
            isNull: false,
            isPrimaryKey: true,
            isForeignKey: false,
            definition: null,
            example: null,
            domain: null,
          },
        ],
      },
      {
        id: 'table_order_items',
        logicalName: 'order_items',
        physicalName: 'order_items',
        schema: 'public',
        coordinate: { x: 320, y: 0 },
        attributes: [
          {
            id: 'attr_items_store_id',
            logicalName: 'store_id',
            physicalName: 'store_id',
            dataType: 'uuid',
            size: null,
            displayOrder: 0,
            isNull: false,
            isPrimaryKey: false,
            isForeignKey: true,
            definition: null,
            example: null,
            domain: null,
          },
          {
            id: 'attr_items_order_number',
            logicalName: 'order_number',
            physicalName: 'order_number',
            dataType: 'integer',
            size: null,
            displayOrder: 1,
            isNull: false,
            isPrimaryKey: false,
            isForeignKey: true,
            definition: null,
            example: null,
            domain: null,
          },
        ],
      },
    ])

    expect(next.attributeMappings).toHaveLength(2)
    expect(next.attributeMappings[1]).toEqual(
      expect.objectContaining({
        primaryAttributeId: 'attr_orders_number',
        secondaryAttributeId: 'attr_items_order_number',
      }),
    )
  })
})
