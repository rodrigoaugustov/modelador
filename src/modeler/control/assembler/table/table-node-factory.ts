import type { NodeMetadata } from '@antv/x6/lib/model/node'
import type { ViewMode } from '@/modeler/enum/view-mode'
import type { TableModel } from '@/modeler/model/table/table-model'
import type { TableAttributeText } from '@/modeler/model/table/text/table-attribute-text'

const TABLE_NODE_WIDTH = 320
const TABLE_NODE_HEADER_HEIGHT = 52
const TABLE_NODE_BODY_PADDING_Y = 50
const TABLE_NODE_SECTION_PADDING_Y = 22
const TABLE_NODE_SECTION_TITLE_BLOCK = 19
const TABLE_NODE_ROW_HEIGHT = 20
const TABLE_NODE_ROW_GAP = 3
const TABLE_NODE_SECTION_GAP = 12
const TABLE_NODE_EMPTY_BODY_HEIGHT = 32
export const TABLE_NODE_SHAPE = 'modeler-table-card'

export type TableRowDefinition = {
  id: string
  name: string
  typeLabel: string
}

export type TableNodeData = {
  tableName: string
  isSelected: boolean
  primaryKeyRows: TableRowDefinition[]
  attributeRows: TableRowDefinition[]
}

type HTMLShapeRegistrar = {
  register: (config: {
    shape: string
    html: (cell: { getData: () => unknown }) => HTMLElement
    effect?: string[]
    inherit?: string
  }) => void
}

let tableNodeShapeRegistered = false

function resolveName(
  logicalName: string | null | undefined,
  physicalName: string | null | undefined,
  viewMode: ViewMode,
) {
  return viewMode === 'physical'
    ? physicalName ?? logicalName ?? 'unnamed'
    : logicalName ?? physicalName ?? 'unnamed'
}

function formatAttributeTokens(attribute: Pick<TableAttributeText, 'isForeignKey' | 'isNull'>) {
  return [attribute.isForeignKey ? '[FK]' : null, attribute.isNull === false ? '[NN]' : null].filter(Boolean).join(' ')
}

function formatAttributeRow(attribute: TableAttributeText, viewMode: ViewMode): TableRowDefinition {
  const attributeName = resolveName(attribute.logicalName, attribute.physicalName, viewMode)
  const tokenSuffix = formatAttributeTokens(attribute)
  const dataType = attribute.dataType?.toUpperCase() ?? 'TEXT'
  const sizeSuffix = attribute.size ? `(${attribute.size})` : ''

  return {
    id: attribute.identification,
    name: tokenSuffix ? `${attributeName} ${tokenSuffix}` : attributeName,
    typeLabel: `${dataType}${sizeSuffix}`,
  }
}

function getTableSections(table: TableModel, viewMode: ViewMode) {
  return {
    primaryKeyRows: Array.from(table.tablePrimaryKeyList.values()).map((attribute) => formatAttributeRow(attribute, viewMode)),
    attributeRows: Array.from(table.tableAttributeList.values()).map((attribute) => formatAttributeRow(attribute, viewMode)),
  }
}

function computeSectionHeight(rowCount: number) {
  if (rowCount <= 0) {
    return 0
  }

  const rowsBlock = rowCount * TABLE_NODE_ROW_HEIGHT + Math.max(rowCount - 1, 0) * TABLE_NODE_ROW_GAP

  return TABLE_NODE_SECTION_PADDING_Y + TABLE_NODE_SECTION_TITLE_BLOCK + rowsBlock
}

export function getTableNodeMetrics(input: { primaryKeyCount: number; attributeCount: number }) {
  const primarySectionHeight = computeSectionHeight(input.primaryKeyCount)
  const attributeSectionHeight = computeSectionHeight(input.attributeCount)
  const dividerGap = input.primaryKeyCount > 0 && input.attributeCount > 0 ? TABLE_NODE_SECTION_GAP : 0
  const hasContent = input.primaryKeyCount > 0 || input.attributeCount > 0
  const bodyInner = hasContent
    ? primarySectionHeight + dividerGap + attributeSectionHeight
    : TABLE_NODE_EMPTY_BODY_HEIGHT
  const bodyHeight = TABLE_NODE_BODY_PADDING_Y + bodyInner

  return {
    width: TABLE_NODE_WIDTH,
    height: TABLE_NODE_HEADER_HEIGHT + bodyHeight,
    bodyHeight,
  }
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    className?: string
    text?: string
    attributes?: Record<string, string>
  } = {},
) {
  const element = document.createElement(tagName)

  if (options.className) {
    element.className = options.className
  }

  if (options.text) {
    element.textContent = options.text
  }

  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, value)
    }
  }

  return element
}

function buildSection(title: string, rows: TableRowDefinition[], sectionClassName: string) {
  const section = createElement('section', {
    className: `table-node-card__section ${sectionClassName}`,
  })
  const sectionTitle = createElement('div', {
    className: 'table-node-card__section-title',
    text: title,
  })
  const rowsWrap = createElement('div', {
    className: 'table-node-card__rows',
  })

  for (const row of rows) {
    const rowWrap = createElement('div', {
      className: 'table-node-card__row',
    })
    const rowName = createElement('span', {
      className: 'table-node-card__row-name',
      text: row.name,
    })
    const rowType = createElement('span', {
      className: 'table-node-card__row-type',
      text: row.typeLabel,
    })

    rowWrap.append(rowName, rowType)
    rowsWrap.append(rowWrap)
  }

  section.append(sectionTitle, rowsWrap)

  return section
}

export function renderTableNodeContent(data: TableNodeData) {
  const wrap = createElement('div', {
    className: 'table-node-card',
    attributes: {
      'data-selected': data.isSelected ? 'true' : 'false',
    },
  })
  const header = createElement('div', {
    className: 'table-node-card__header',
    text: data.tableName,
  })
  const body = createElement('div', {
    className: 'table-node-card__body',
  })

  if (data.primaryKeyRows.length > 0) {
    body.append(buildSection('Primary keys', data.primaryKeyRows, 'table-node-card__section--keys'))
  }

  if (data.attributeRows.length > 0) {
    body.append(buildSection('Attributes', data.attributeRows, 'table-node-card__section--columns'))
  }

  if (data.primaryKeyRows.length === 0 && data.attributeRows.length === 0) {
    body.append(
      createElement('div', {
        className: 'table-node-card__empty',
        text: 'No columns yet',
      }),
    )
  }

  wrap.append(header, body)

  return wrap
}

export function createTableNodeData(table: TableModel, viewMode: ViewMode): TableNodeData {
  const { primaryKeyRows, attributeRows } = getTableSections(table, viewMode)

  return {
    tableName: resolveName(table.tableName.logicalName, table.tableName.physicalName, viewMode),
    isSelected: table.isSelected,
    primaryKeyRows,
    attributeRows,
  }
}

export function registerTableNodeShape(htmlShape: HTMLShapeRegistrar) {
  if (tableNodeShapeRegistered) {
    return
  }

  htmlShape.register({
    shape: TABLE_NODE_SHAPE,
    inherit: 'html',
    effect: ['data'],
    html(cell) {
      return renderTableNodeContent(cell.getData() as TableNodeData)
    },
  })

  tableNodeShapeRegistered = true
}

export function createTableNodeDefinition(table: TableModel, viewMode: ViewMode): NodeMetadata {
  const data = createTableNodeData(table, viewMode)
  const { width, height } = getTableNodeMetrics({
    primaryKeyCount: data.primaryKeyRows.length,
    attributeCount: data.attributeRows.length,
  })

  return {
    id: table.identification,
    shape: TABLE_NODE_SHAPE,
    x: table.coordinate.x,
    y: table.coordinate.y,
    width,
    height,
    data,
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
  } as NodeMetadata
}
