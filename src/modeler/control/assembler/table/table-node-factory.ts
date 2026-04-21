import type { Node } from '@antv/x6'
import type { TableModel } from '@/modeler/model/table/table-model'

export function createTableNodeDefinition(table: TableModel): Node.Metadata {
  const attributes = [
    ...Array.from(table.tablePrimaryKeyList.values()),
    ...Array.from(table.tableAttributeList.values()),
  ]
  const lines = attributes.map((attribute) => {
    const attributeName = attribute.logicalName ?? 'unnamed'
    const dataType = attribute.dataType?.toUpperCase() ?? 'TEXT'
    const tokens = [
      attribute.isPrimaryKey ? '[PK]' : null,
      attribute.isForeignKey ? '[FK]' : null,
      attribute.isNull === false ? '[NN]' : null,
    ].filter(Boolean)

    return `${attributeName} ${dataType}${tokens.length > 0 ? ` ${tokens.join(' ')}` : ''}`
  })

  return {
    id: table.identification,
    shape: 'rect',
    x: table.coordinate.x,
    y: table.coordinate.y,
    width: 320,
    height: Math.max(140, 84 + lines.length * 24),
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: 'rgba(169, 180, 185, 0.15)',
        strokeWidth: 1,
        rx: 18,
        ry: 18,
      },
      label: {
        text: [table.tableName.logicalName, ...lines].join('\n'),
        fill: '#2a3439',
        fontSize: 14,
        fontWeight: 600,
        textAnchor: 'start',
        refX: 20,
        refY: 28,
      },
    },
  }
}
