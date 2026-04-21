import { TableModel } from '@/modeler/model/table/table-model'
import { Vertex } from '@/modeler/model/vertex'

export class WorkspaceController {
  applyNodeMoved(table: TableModel, position: { x: number; y: number }) {
    table.coordinate = new Vertex(position.x, position.y)
  }
}
