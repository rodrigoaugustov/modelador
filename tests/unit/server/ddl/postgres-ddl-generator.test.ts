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

  it('emits foreign key constraints for enforced one-to-many relationships', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'users',
            attributes: [
              {
                id: 'attr_users_id',
                logicalName: 'id',
                physicalName: 'id',
                dataType: 'uuid',
                isNull: false,
                isPrimaryKey: true,
                isForeignKey: false,
              },
            ],
          },
          {
            id: 'table_orders',
            logicalName: 'orders',
            physicalName: 'orders',
            attributes: [
              {
                id: 'attr_orders_id',
                logicalName: 'id',
                physicalName: 'id',
                dataType: 'uuid',
                isNull: false,
                isPrimaryKey: true,
                isForeignKey: false,
              },
              {
                id: 'attr_orders_user_id',
                logicalName: 'user_id',
                physicalName: 'user_id',
                dataType: 'uuid',
                isNull: false,
                isPrimaryKey: false,
                isForeignKey: true,
              },
            ],
          },
        ],
        relationships: [
          {
            id: 'rel_users_orders',
            primaryTableId: 'table_users',
            secondaryTableId: 'table_orders',
            primaryAttributeId: 'attr_users_id',
            secondaryAttributeId: 'attr_orders_user_id',
            relationshipType: 'one-to-many',
            onDelete: 'cascade',
            onUpdate: 'cascade',
            enforceConstraint: true,
          },
        ],
      },
    })

    expect(ddl).toContain('foreign key (user_id) references users (id)')
    expect(ddl).toContain('on delete cascade')
    expect(ddl).toContain('on update cascade')
  })
})
