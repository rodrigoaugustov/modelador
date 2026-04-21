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
            primaryAttributeId: 'attr_users_email',
            secondaryAttributeId: 'attr_orders_user_email',
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
      'Relationship rel_users_orders must reference a primary key or unique parent column',
    )
  })
})
