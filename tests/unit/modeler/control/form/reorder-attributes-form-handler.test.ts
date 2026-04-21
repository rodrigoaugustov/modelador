import { describe, expect, it } from 'vitest'
import { ReorderAttributesFormHandler } from '@/modeler/control/handler/form/table/reorder-attributes-form-handler'

describe('ReorderAttributesFormHandler', () => {
  it('moves an attribute up and rewrites display order to match the new sequence', () => {
    const handler = new ReorderAttributesFormHandler()
    const next = handler.moveUp(
      [
        {
          id: 'attr_orders_id',
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
        {
          id: 'attr_orders_store_id',
          logicalName: 'store_id',
          physicalName: 'store_id',
          dataType: 'uuid',
          size: null,
          isNull: false,
          isPrimaryKey: true,
          isForeignKey: false,
          displayOrder: 1,
          definition: null,
          example: null,
          domain: null,
        },
        {
          id: 'attr_orders_number',
          logicalName: 'number',
          physicalName: 'number',
          dataType: 'text',
          size: null,
          isNull: true,
          isPrimaryKey: false,
          isForeignKey: false,
          displayOrder: 2,
          definition: null,
          example: null,
          domain: null,
        },
      ],
      'attr_orders_number',
    )

    expect(next.map((attribute) => attribute.id)).toEqual([
      'attr_orders_id',
      'attr_orders_number',
      'attr_orders_store_id',
    ])
    expect(next.map((attribute) => attribute.displayOrder)).toEqual([0, 1, 2])
  })

  it('keeps the first attribute in place when moving up past the start', () => {
    const handler = new ReorderAttributesFormHandler()
    const next = handler.moveUp(
      [
        {
          id: 'attr_orders_id',
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
      'attr_orders_id',
    )

    expect(next.map((attribute) => attribute.id)).toEqual(['attr_orders_id'])
    expect(next[0].displayOrder).toBe(0)
  })
})
