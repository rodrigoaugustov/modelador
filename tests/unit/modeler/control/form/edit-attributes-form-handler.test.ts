import { describe, expect, it } from 'vitest'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'

describe('EditAttributesFormHandler', () => {
  it('adds a nullable non-key attribute row by default', () => {
    const handler = new EditAttributesFormHandler()
    const attributes = handler.addAttribute([])

    expect(attributes).toHaveLength(1)
    expect(attributes[0].isPrimaryKey).toBe(false)
    expect(attributes[0].isNull).toBe(true)
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
})
