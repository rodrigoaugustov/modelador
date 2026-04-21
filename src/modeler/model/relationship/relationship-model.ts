import { SVGModel } from '@/modeler/model/svg-model'
import { RelationshipSegment } from '@/modeler/model/relationship/segment/relationship-segment'
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
    return new RelationshipModel(args)
  }

  static resolveTypeLabel(type: CreateRelationshipArgs['relationshipType']) {
    if (type === 'one-to-one') {
      return '1:1'
    }

    if (type === 'many-to-many') {
      return 'N:N'
    }

    return '1:N'
  }

  isSelected = false
  primaryAttributeId = ''
  secondaryAttributeId = ''
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many' = 'one-to-many'
  onDelete: 'no action' | 'restrict' | 'cascade' | 'set null' = 'cascade'
  onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null' = 'cascade'
  enforceConstraint = true

  readonly primaryTable: TableModel
  readonly secondaryTable: TableModel
  readonly segmentList: RelationshipSegment[]

  private constructor(args: CreateRelationshipArgs) {
    super(
      args.id,
      new Vertex(args.primaryTable.coordinate.x, args.primaryTable.coordinate.y),
      'relationship-edge',
    )
    this.primaryTable = args.primaryTable
    this.secondaryTable = args.secondaryTable
    this.primaryAttributeId = args.primaryAttributeId ?? ''
    this.secondaryAttributeId = args.secondaryAttributeId ?? ''
    this.relationshipType = args.relationshipType ?? 'one-to-many'
    this.onDelete = args.onDelete ?? 'cascade'
    this.onUpdate = args.onUpdate ?? 'cascade'
    this.enforceConstraint = args.enforceConstraint ?? true
    this.segmentList = [
      new RelationshipSegment(
        new Vertex(args.primaryTable.coordinate.x, args.primaryTable.coordinate.y),
        new Vertex(args.secondaryTable.coordinate.x, args.secondaryTable.coordinate.y),
        RelationshipModel.resolveTypeLabel(this.relationshipType),
      ),
    ]
  }
}
