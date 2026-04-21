import { describe, expect, it } from 'vitest'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'

describe('EditAttributesFormHandler', () => {
  it('adds a nullable non-key attribute row by default', () => {
    const handler = new EditAttributesFormHandler()
    const attributes = handler.addAttribute([])

    expect(attributes).toHaveLength(1)
    expect(attributes[0].isPrimaryKey).toBe(false)
    expect(attributes[0].isNull).toBe(true)
    expect(attributes[0].displayOrder).toBe(0)
  })

  it('updates nullable, size, names, and text metadata for an attribute', () => {
    const handler = new EditAttributesFormHandler()
    const [next] = handler.updateAttribute(
      [
        {
          id: 'attr_users_email',
          logicalName: 'email',
          physicalName: 'email',
          dataType: 'varchar',
          size: null,
          isNull: true,
          isPrimaryKey: false,
          isForeignKey: false,
          displayOrder: 0,
          definition: null,
          example: null,
          domain: null,
        },
      ],
      'attr_users_email',
      {
        physicalName: 'email_address',
        size: '255',
        isNull: false,
        definition: 'Main user contact address',
        example: 'person@example.com',
        domain: 'valid email',
      },
    )

    expect(next.physicalName).toBe('email_address')
    expect(next.size).toBe('255')
    expect(next.isNull).toBe(false)
    expect(next.definition).toContain('contact')
  })

  it('allows marking more than one attribute as primary key and forces them to not null', () => {
    const handler = new EditAttributesFormHandler()
    const attributes = [
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
        isNull: true,
        isPrimaryKey: false,
        isForeignKey: false,
        displayOrder: 1,
        definition: null,
        example: null,
        domain: null,
      },
    ]

    const next = handler.updateAttribute(attributes, 'attr_orders_store_id', {
      isPrimaryKey: true,
      isNull: true,
    })

    expect(next.filter((attribute) => attribute.isPrimaryKey)).toHaveLength(2)
    expect(next[1].isPrimaryKey).toBe(true)
    expect(next[1].isNull).toBe(false)
  })

  it('reindexes attribute order after deletion', () => {
    const handler = new EditAttributesFormHandler()
    const next = handler.removeAttribute(
      [
        {
          id: 'attr_a',
          logicalName: 'a',
          physicalName: 'a',
          dataType: 'text',
          size: null,
          isNull: true,
          isPrimaryKey: false,
          isForeignKey: false,
          displayOrder: 0,
          definition: null,
          example: null,
          domain: null,
        },
        {
          id: 'attr_b',
          logicalName: 'b',
          physicalName: 'b',
          dataType: 'text',
          size: null,
          isNull: true,
          isPrimaryKey: false,
          isForeignKey: false,
          displayOrder: 1,
          definition: null,
          example: null,
          domain: null,
        },
      ],
      'attr_a',
    )

    expect(next).toHaveLength(1)
    expect(next[0].displayOrder).toBe(0)
  })
})
