import { SVGModel } from '@/modeler/model/svg-model'
import { TableTextAreaModel } from '@/modeler/model/table/table-text-area-model'
import { TableAttributeText } from '@/modeler/model/table/text/table-attribute-text'
import { TableNameText } from '@/modeler/model/table/text/table-name-text'
import { Vertex } from '@/modeler/model/vertex'

type CreateTableArgs = {
  id: string
  name: string
  x: number
  y: number
}

export class TableModel extends SVGModel {
  static create(args: CreateTableArgs) {
    return new TableModel(args.id, new Vertex(args.x, args.y), args.name)
  }

  readonly tableMask = new TableTextAreaModel(this, null, 'table-mask', 'mask')
  readonly nameArea = new TableTextAreaModel(this, this.tableMask, 'table-name-area', 'name-area')
  readonly primaryKeyArea = new TableTextAreaModel(this, this.nameArea, 'table-attribute-area', 'primary-key-area')
  readonly attributeArea = new TableTextAreaModel(this, this.primaryKeyArea, 'table-attribute-area', 'attribute-area')
  readonly tableName: TableNameText
  readonly tablePrimaryKeyList = new Map<string, TableAttributeText>()
  readonly tableAttributeList = new Map<string, TableAttributeText>()
  readonly relationshipAsPrimaryTableList = new Map<string, string>()
  readonly relationshipAsSecondaryTableList = new Map<string, string>()
  isDraggable = true
  isSelected = false

  private constructor(id: string, coordinate: Vertex, name: string) {
    super(id, coordinate, 'table-node')
    this.tableName = new TableNameText(this.nameArea, name, 'table-name-text', 'table-name-text')
  }
}
