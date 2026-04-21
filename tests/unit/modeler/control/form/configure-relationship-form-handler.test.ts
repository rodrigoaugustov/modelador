import { describe, expect, it } from 'vitest'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'

describe('ConfigureRelationshipFormHandler', () => {
  it('creates a one-to-many relationship draft with enforced constraint', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const draft = handler.createDraft('table_users', 'table_orders', 'attr_users_id', 'attr_orders_user_id')

    expect(draft.relationshipType).toBe('one-to-many')
    expect(draft.enforceConstraint).toBe(true)
    expect(draft.onDelete).toBe('cascade')
  })
})
