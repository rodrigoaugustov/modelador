import { SVGModel } from '@/modeler/model/svg-model'
import type { TableModel } from '@/modeler/model/table/table-model'
import { Vertex } from '@/modeler/model/vertex'

type CreateRelationshipArgs = {
  id: string
  primaryTable: TableModel
  secondaryTable: TableModel
  primaryAttributeId?: string
  secondaryAttributeId?: string
  relationshipType?: 'one-to-one' | 'one-to-many' | 'many-to-many'
  onDelete?: 'no action' | 'restrict' | 'cascade' | 'set null'
  onUpdate?: 'no action' | 'restrict' | 'cascade' | 'set null'
  enforceConstraint?: boolean
}

export class RelationshipModel extends SVGModel {
  static create(args: CreateRelationshipArgs) {
    return new RelationshipModel(args.id, args.primaryTable, args.secondaryTable)
  }

  isSelected = false
  primaryAttributeId = ''
  secondaryAttributeId = ''
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many' = 'one-to-many'
  onDelete: 'no action' | 'restrict' | 'cascade' | 'set null' = 'cascade'
  onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null' = 'cascade'
  enforceConstraint = true

  private constructor(
    id: string,
    public readonly primaryTable: TableModel,
    public readonly secondaryTable: TableModel,
  ) {
    super(id, new Vertex(primaryTable.coordinate.x, primaryTable.coordinate.y), 'relationship-edge')
  }
}
