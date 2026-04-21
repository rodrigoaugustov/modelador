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
})
