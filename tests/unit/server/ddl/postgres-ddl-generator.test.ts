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

    expect(ddl).toContain('foreign key (user_id) references public.users (id)')
    expect(ddl).toContain('on delete cascade')
    expect(ddl).toContain('on update cascade')
  })
})
