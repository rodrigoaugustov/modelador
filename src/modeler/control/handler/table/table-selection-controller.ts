export type SelectionState = {
  selectedTableId: string | null
  selectedRelationshipId: string | null
}

export class TableSelectionController {
  selectTable(state: SelectionState, tableId: string): SelectionState {
    return {
      ...state,
      selectedTableId: tableId,
      selectedRelationshipId: null,
    }
  }
}
