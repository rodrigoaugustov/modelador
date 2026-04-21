import { describe, expect, it } from 'vitest'
import { EditTableDetailsFormHandler } from '@/modeler/control/handler/form/table/edit-table-details-form-handler'

describe('EditTableDetailsFormHandler', () => {
  it('updates logical and physical names without dropping schema', () => {
    const handler = new EditTableDetailsFormHandler()
    const next = handler.apply(
      {
        id: 'table_users',
        logicalName: 'users',
        physicalName: null,
        schema: 'public',
        coordinate: { x: 72, y: 72 },
        attributes: [],
      },
      {
        logicalName: 'users_account',
        physicalName: 'tb_users_account',
        schema: 'identity',
      },
    )

    expect(next.logicalName).toBe('users_account')
    expect(next.physicalName).toBe('tb_users_account')
    expect(next.schema).toBe('identity')
  })
})
