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

  it('updates delete and update actions for an existing relationship', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const next = handler.applyPatch(
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
      {
        onDelete: 'restrict',
        onUpdate: 'no action',
        enforceConstraint: false,
      },
    )

    expect(next.onDelete).toBe('restrict')
    expect(next.onUpdate).toBe('no action')
    expect(next.enforceConstraint).toBe(false)
  })
})
