import { describe, expect, it } from 'vitest'
import { WorkspaceController } from '@/modeler/control/handler/workspace/workspace-controller'
import { TableModel } from '@/modeler/model/table/table-model'

describe('WorkspaceController', () => {
  it('updates the table coordinate when a node moves', () => {
    const table = TableModel.create({ id: 'table_users', name: 'users', x: 0, y: 0 })
    const controller = new WorkspaceController()

    controller.applyNodeMoved(table, { x: 180, y: 220 })

    expect(table.coordinate.x).toBe(180)
    expect(table.coordinate.y).toBe(220)
  })
})
