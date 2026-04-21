import { describe, expect, it } from 'vitest'
import { validateProjectModel } from '@/server/validation/model-validator'

describe('validateProjectModel', () => {
  it('reports a missing table name', () => {
    const result = validateProjectModel({
      model: {
        tables: [{ id: 'table_1', logicalName: '', physicalName: null, schema: 'public', coordinate: { x: 0, y: 0 }, attributes: [] }],
        relationships: [],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Table name is required')
  })

  it('rejects duplicate table names', () => {
    const result = validateProjectModel({
      model: {
        tables: [
          { id: 'table_users_1', logicalName: 'users', physicalName: 'users', schema: 'public', coordinate: { x: 0, y: 0 }, attributes: [] },
          { id: 'table_users_2', logicalName: 'users', physicalName: 'users', schema: 'public', coordinate: { x: 160, y: 0 }, attributes: [] },
        ],
        relationships: [],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Duplicate table name users')
  })

  it('rejects a relationship that points to a non-key primary attribute in one-to-many mode', () => {
    const result = validateProjectModel({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'tb_users',
            schema: 'identity',
            coordinate: { x: 0, y: 0 },
            attributes: [
              {
                id: 'attr_users_email',
                logicalName: 'email',
                physicalName: 'email_address',
                dataType: 'varchar',
                size: '255',
                displayOrder: 0,
                isNull: false,
                isPrimaryKey: false,
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
            physicalName: 'tb_orders',
            schema: 'identity',
            coordinate: { x: 280, y: 0 },
            attributes: [
              {
                id: 'attr_orders_user_email',
                logicalName: 'user_email',
                physicalName: 'user_email',
                dataType: 'varchar',
                size: '255',
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
        ],
        relationships: [
          {
            id: 'rel_users_orders',
            primaryTableId: 'table_users',
            secondaryTableId: 'table_orders',
            attributeMappings: [
              {
                id: 'map_users_orders_user_email',
                primaryAttributeId: 'attr_users_email',
                secondaryAttributeId: 'attr_orders_user_email',
              },
            ],
            relationshipType: 'one-to-many',
            onDelete: 'restrict',
            onUpdate: 'no action',
            enforceConstraint: true,
          },
        ],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'Relationship tb_users.email_address -> tb_orders.user_email must reference a primary key parent column',
    )
  })

  it('rejects a constrained composite relationship when not all parent primary key columns are mapped', () => {
    const result = validateProjectModel({
      model: {
        tables: [
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
            coordinate: { x: 280, y: 0 },
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
            ],
          },
        ],
        relationships: [
          {
            id: 'rel_orders_items',
            primaryTableId: 'table_orders',
            secondaryTableId: 'table_order_items',
            attributeMappings: [
              {
                id: 'map_orders_items_store_id',
                primaryAttributeId: 'attr_orders_store_id',
                secondaryAttributeId: 'attr_items_store_id',
              },
            ],
            relationshipType: 'one-to-many',
            onDelete: 'cascade',
            onUpdate: 'cascade',
            enforceConstraint: true,
          },
        ],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      'Relationship public.orders must map all parent primary key columns when enforcing a composite key constraint',
    )
  })
})
