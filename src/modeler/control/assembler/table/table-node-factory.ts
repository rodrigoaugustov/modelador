import type { Node } from '@antv/x6'
import type { TableModel } from '@/modeler/model/table/table-model'

export function createTableNodeDefinition(table: TableModel): Node.Metadata {
  return {
    id: table.identification,
    shape: 'rect',
    x: table.coordinate.x,
    y: table.coordinate.y,
    width: 260,
    height: 140,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: 'rgba(169, 180, 185, 0.15)',
        strokeWidth: 1,
        rx: 18,
        ry: 18,
      },
      label: {
        text: table.tableName.logicalName,
        fill: '#2a3439',
        fontSize: 14,
        fontWeight: 600,
      },
    },
  }
}
