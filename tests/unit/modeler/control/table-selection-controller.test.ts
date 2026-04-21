import { describe, expect, it } from 'vitest'
import { TableSelectionController } from '@/modeler/control/handler/table/table-selection-controller'

describe('TableSelectionController', () => {
  it('stores the selected table id and clears relationship selection', () => {
    const controller = new TableSelectionController()

    const next = controller.selectTable(
      {
        selectedTableId: null,
        selectedRelationshipId: 'rel_users_orders',
      },
      'table_users',
    )

    expect(next.selectedTableId).toBe('table_users')
    expect(next.selectedRelationshipId).toBeNull()
  })
})
