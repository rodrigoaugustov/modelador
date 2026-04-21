import { describe, expect, it } from 'vitest'
import { CreateTableFormHandler } from '@/modeler/control/handler/form/table/create-table-form-handler'

describe('CreateTableFormHandler', () => {
  it('creates a new table draft with a required primary key row', () => {
    const handler = new CreateTableFormHandler()
    const draft = handler.createDraft()

    expect(draft.attributes[0].logicalName).toBe('id')
    expect(draft.attributes[0].isPrimaryKey).toBe(true)
    expect(draft.attributes[0].isNull).toBe(false)
  })
})
