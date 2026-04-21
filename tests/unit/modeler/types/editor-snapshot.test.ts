import { describe, expect, it } from 'vitest'
import { buildEmptyProjectSnapshot, type EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'

describe('EditorProjectSnapshot', () => {
  it('supports tables with attributes and relationships with referential metadata', () => {
    const snapshot: EditorProjectSnapshot = {
      project: { id: 'proj_1', name: 'Sales', description: '' },
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'users',
            schema: 'public',
            coordinate: { x: 64, y: 64 },
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
              displayOrder: 0,
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
            lineStyle: 'orthogonal',
            vertices: [{ x: 144, y: 96 }],
          },
        ],
      },
      diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
      metadata: { viewMode: 'logical', postgresVersion: 'default' },
    }

    expect(snapshot.model.tables[0].attributes[0].isPrimaryKey).toBe(true)
    expect(snapshot.model.tables[0].attributes[0].displayOrder).toBe(0)
    expect(snapshot.model.relationships[0].attributeMappings).toHaveLength(1)
    expect(snapshot.model.relationships[0].relationshipType).toBe('one-to-many')
    expect(snapshot.model.relationships[0].lineStyle).toBe('orthogonal')
    expect(snapshot.model.relationships[0].vertices).toEqual([{ x: 144, y: 96 }])
  })

  it('builds an empty project snapshot with a logical view mode default', () => {
    const snapshot = buildEmptyProjectSnapshot({ id: 'proj_1', name: 'Sales', description: '' })

    expect(snapshot.project.id).toBe('proj_1')
    expect(snapshot.model.tables).toEqual([])
    expect(snapshot.metadata.viewMode).toBe('logical')
  })
})
