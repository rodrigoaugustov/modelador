import { SVGModel } from '@/modeler/model/svg-model'
import type { TableModel } from '@/modeler/model/table/table-model'
import { Vertex } from '@/modeler/model/vertex'

type CreateRelationshipArgs = {
  id: string
  primaryTable: TableModel
  secondaryTable: TableModel
}

export class RelationshipModel extends SVGModel {
  static create(args: CreateRelationshipArgs) {
    return new RelationshipModel(args.id, args.primaryTable, args.secondaryTable)
  }

  isSelected = false

  private constructor(
    id: string,
    public readonly primaryTable: TableModel,
    public readonly secondaryTable: TableModel,
  ) {
    super(id, new Vertex(primaryTable.coordinate.x, primaryTable.coordinate.y), 'relationship-edge')
  }
}
