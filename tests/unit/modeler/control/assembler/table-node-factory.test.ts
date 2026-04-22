import { describe, expect, it } from 'vitest'
import { createTableNodeDefinition, TABLE_NODE_SHAPE } from '@/modeler/control/assembler/table/table-node-factory'
import { ViewMode } from '@/modeler/enum/view-mode'
import { TableModel } from '@/modeler/model/table/table-model'
import { TableAttributeText } from '@/modeler/model/table/text/table-attribute-text'

describe('createTableNodeDefinition', () => {
  it('builds an html node payload with separate primary key and attribute sections', () => {
    const table = TableModel.create({ id: 'table_orders', name: 'orders', x: 80, y: 96 })

    const idAttribute = new TableAttributeText(table.primaryKeyArea, 'table-attribute-text', 'attr_orders_id')
    idAttribute.logicalName = 'id'
    idAttribute.physicalName = 'id'
    idAttribute.dataType = 'uuid'
    idAttribute.isPrimaryKey = true
    idAttribute.isNull = false

    const numberAttribute = new TableAttributeText(table.attributeArea, 'table-attribute-text', 'attr_orders_number')
    numberAttribute.logicalName = 'number'
    numberAttribute.physicalName = 'number'
    numberAttribute.dataType = 'text'
    numberAttribute.isPrimaryKey = false
    numberAttribute.isNull = true

    table.tablePrimaryKeyList.set(idAttribute.identification, idAttribute)
    table.tableAttributeList.set(numberAttribute.identification, numberAttribute)

    const node = createTableNodeDefinition(table, ViewMode.Logical)
    const tableData = node.data as {
      tableName: string
      isSelected: boolean
      primaryKeyRows: Array<{ id: string; name: string; typeLabel: string }>
      attributeRows: Array<{ id: string; name: string; typeLabel: string }>
    }

    expect(node.shape).toBe(TABLE_NODE_SHAPE)
    expect(node.width).toBe(320)
    expect(tableData.tableName).toBe('orders')
    expect(tableData.isSelected).toBe(false)
    expect(tableData.primaryKeyRows).toEqual([
      expect.objectContaining({
        name: 'id [NN]',
        typeLabel: 'UUID',
      }),
    ])
    expect(tableData.attributeRows).toEqual([
      expect.objectContaining({
        name: 'number',
        typeLabel: 'TEXT',
      }),
    ])
    expect(node.ports?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'table_orders__in', group: 'in' }),
        expect.objectContaining({ id: 'table_orders__out', group: 'out' }),
      ]),
    )
  })
})
