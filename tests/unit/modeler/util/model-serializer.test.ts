import { describe, expect, it } from 'vitest'
import { ProjectModel } from '@/modeler/model/project-model'
import { RelationshipModel } from '@/modeler/model/relationship/relationship-model'
import { TableModel } from '@/modeler/model/table/table-model'
import { TableAttributeText } from '@/modeler/model/table/text/table-attribute-text'
import { serializeProjectModel } from '@/modeler/util/model-serializer'

describe('serializeProjectModel', () => {
  it('serializes a project into canonical JSON', () => {
    const project = ProjectModel.create({ id: 'proj_1', name: 'Sales Model' })
    const serialized = serializeProjectModel(project)

    expect(serialized.project.id).toBe('proj_1')
    expect(serialized.model.tables).toEqual([])
    expect(serialized.model.relationships).toEqual([])
  })

  it('persists attribute order as displayOrder based on the current table layout', () => {
    const project = ProjectModel.create({ id: 'proj_1', name: 'Sales Model' })
    const table = TableModel.create({ id: 'table_orders', name: 'orders', x: 80, y: 96 })

    const idAttribute = new TableAttributeText(table.primaryKeyArea, 'table-attribute-text', 'attr_orders_id')
    idAttribute.logicalName = 'id'
    idAttribute.physicalName = 'id'
    idAttribute.dataType = 'uuid'
    idAttribute.isPrimaryKey = true
    idAttribute.isNull = false

    const numberAttribute = new TableAttributeText(
      table.attributeArea,
      'table-attribute-text',
      'attr_orders_number',
    )
    numberAttribute.logicalName = 'number'
    numberAttribute.physicalName = 'number'
    numberAttribute.dataType = 'text'
    numberAttribute.isPrimaryKey = false
    numberAttribute.isNull = true

    table.tablePrimaryKeyList.set(idAttribute.identification, idAttribute)
    table.tableAttributeList.set(numberAttribute.identification, numberAttribute)
    project.tables.set(table.identification, table)

    const serialized = serializeProjectModel(project)

    expect(serialized.model.tables[0].attributes.map((attribute) => attribute.id)).toEqual([
      'table_orders_attr_orders_id',
      'table_orders_attr_orders_number',
    ])
    expect(serialized.model.tables[0].attributes.map((attribute) => attribute.displayOrder)).toEqual([0, 1])
  })

  it('serializes relationship routing metadata for line style and manual vertices', () => {
    const project = ProjectModel.create({ id: 'proj_1', name: 'Sales Model' })
    const source = TableModel.create({ id: 'table_users', name: 'users', x: 80, y: 96 })
    const target = TableModel.create({ id: 'table_orders', name: 'orders', x: 400, y: 96 })

    project.tables.set(source.identification, source)
    project.tables.set(target.identification, target)
    project.relationships.set(
      'rel_users_orders',
      RelationshipModel.create({
        id: 'rel_users_orders',
        primaryTable: source,
        secondaryTable: target,
        lineStyle: 'curved',
        vertices: [{ x: 224, y: 144 }],
      }),
    )

    const serialized = serializeProjectModel(project)

    expect(serialized.model.relationships[0]).toEqual(
      expect.objectContaining({
        lineStyle: 'curved',
        vertices: [{ x: 224, y: 144 }],
      }),
    )
  })
})
