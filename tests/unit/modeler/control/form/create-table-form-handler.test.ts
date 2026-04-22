import { describe, expect, it } from 'vitest'
import { CreateTableFormHandler } from '@/modeler/control/handler/form/table/create-table-form-handler'

describe('CreateTableFormHandler', () => {
  it('creates a new table draft without prefilled attributes', () => {
    const handler = new CreateTableFormHandler()
    const draft = handler.createDraft()

    expect(draft.attributes).toEqual([])
    expect(draft.schema).toBe('public')
  })
})
