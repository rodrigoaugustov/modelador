import type { Node } from '@antv/x6'
import type { ViewMode } from '@/modeler/enum/view-mode'
import type { TableModel } from '@/modeler/model/table/table-model'

function resolveName(
  logicalName: string | null | undefined,
  physicalName: string | null | undefined,
  viewMode: ViewMode,
) {
  return viewMode === 'physical'
    ? physicalName ?? logicalName ?? 'unnamed'
    : logicalName ?? physicalName ?? 'unnamed'
}

export function createTableNodeDefinition(table: TableModel, viewMode: ViewMode): Node.Metadata {
  const attributes = [
    ...Array.from(table.tablePrimaryKeyList.values()),
    ...Array.from(table.tableAttributeList.values()),
  ]
  const lines = attributes.map((attribute) => {
    const attributeName = resolveName(attribute.logicalName, attribute.physicalName, viewMode)
    const dataType = attribute.dataType?.toUpperCase() ?? 'TEXT'
    const sizeSuffix = attribute.size ? `(${attribute.size})` : ''
    const tokens = [
      attribute.isPrimaryKey ? '[PK]' : null,
      attribute.isForeignKey ? '[FK]' : null,
      attribute.isNull === false ? '[NN]' : null,
    ].filter(Boolean)

    return `${attributeName} ${dataType}${sizeSuffix}${tokens.length > 0 ? ` ${tokens.join(' ')}` : ''}`
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
        stroke: table.isSelected ? '#0053db' : 'rgba(169, 180, 185, 0.15)',
        strokeWidth: table.isSelected ? 2 : 1,
        rx: 18,
        ry: 18,
      },
      label: {
        text: [resolveName(table.tableName.logicalName, table.tableName.physicalName, viewMode), ...lines].join('\n'),
        fill: table.isSelected ? '#0f4bb8' : '#2a3439',
        fontSize: 14,
        fontWeight: 600,
        textAnchor: 'start',
        refX: 20,
        refY: 28,
      },
    },
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: {
            circle: {
              r: 7,
              magnet: true,
              fill: '#ffffff',
              stroke: '#0053db',
              strokeWidth: 2,
            },
          },
        },
        out: {
          position: 'right',
          attrs: {
            circle: {
              r: 7,
              magnet: true,
              fill: '#ffffff',
              stroke: '#0053db',
              strokeWidth: 2,
            },
          },
        },
      },
      items: [
        { id: `${table.identification}__in`, group: 'in' },
        { id: `${table.identification}__out`, group: 'out' },
      ],
    },
  }
}
