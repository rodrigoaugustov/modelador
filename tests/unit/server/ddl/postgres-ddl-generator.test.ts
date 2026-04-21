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
            schema: 'public',
            coordinate: { x: 0, y: 0 },
            attributes: [
              {
                id: 'attr_users_id',
                logicalName: 'id',
                physicalName: null,
                dataType: 'uuid',
                size: null,
                displayOrder: 0,
                isPrimaryKey: true,
                isForeignKey: false,
                isNull: false,
                definition: null,
                example: null,
                domain: null,
              },
            ],
          },
        ],
        relationships: [],
      },
    })

    expect(ddl).toContain('create table public.users')
    expect(ddl).toContain('id uuid not null')
    expect(ddl).toContain('primary key (id)')
  })

  it('uses physical names and size-aware PostgreSQL types when available', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'tb_users',
            schema: 'identity',
            coordinate: { x: 72, y: 72 },
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
        ],
        relationships: [],
      },
    })

    expect(ddl).toContain('create table identity.tb_users')
    expect(ddl).toContain('email_address varchar(255) not null')
  })

  it('emits foreign key constraints for enforced one-to-many relationships', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'users',
            schema: 'public',
            coordinate: { x: 0, y: 0 },
            attributes: [
              {
                id: 'attr_users_id',
                logicalName: 'id',
                physicalName: 'id',
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
            ],
          },
          {
            id: 'table_orders',
            logicalName: 'orders',
            physicalName: 'orders',
            schema: 'public',
            coordinate: { x: 200, y: 0 },
            attributes: [
              {
                id: 'attr_orders_id',
                logicalName: 'id',
                physicalName: 'id',
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
                id: 'attr_orders_user_id',
                logicalName: 'user_id',
                physicalName: 'user_id',
                dataType: 'uuid',
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
        ],
        relationships: [
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
        ],
      },
    })

    expect(ddl).toContain('foreign key (user_id) references public.users (id)')
    expect(ddl).toContain('on delete cascade')
    expect(ddl).toContain('on update cascade')
  })

  it('normalizes postgres aliases and falls back to the public schema for legacy tables', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_products',
            logicalName: 'products',
            physicalName: null,
            schema: '' as never,
            coordinate: { x: 0, y: 0 },
            attributes: [
              {
                id: 'attr_products_id',
                logicalName: 'id',
                physicalName: null,
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
                id: 'attr_products_qty',
                logicalName: 'qty',
                physicalName: null,
                dataType: 'int',
                size: null,
                displayOrder: 1,
                isNull: false,
                isPrimaryKey: false,
                isForeignKey: false,
                definition: null,
                example: null,
                domain: null,
              },
            ],
          },
        ],
        relationships: [],
      },
    })

    expect(ddl).toContain('create table public.products')
    expect(ddl).toContain('qty integer not null')
  })

  it('emits composite foreign key constraints when a relationship maps multiple columns', () => {
    const ddl = generatePostgresDDL({
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
              {
                id: 'map_orders_items_number',
                primaryAttributeId: 'attr_orders_number',
                secondaryAttributeId: 'attr_items_order_number',
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

    expect(ddl).toContain(
      'foreign key (store_id, order_number) references public.orders (store_id, number) on delete cascade on update cascade',
    )
  })
})
