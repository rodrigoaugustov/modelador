import { SVGModel } from '@/modeler/model/svg-model'
import type { RelationshipLineStyle } from '@/modeler/enum/relationship-line-style'
import { RelationshipSegment } from '@/modeler/model/relationship/segment/relationship-segment'
import type { TableModel } from '@/modeler/model/table/table-model'
import { Vertex } from '@/modeler/model/vertex'

type RelationshipAttributeMapping = {
  id: string
  primaryAttributeId: string
  secondaryAttributeId: string
}

type CreateRelationshipArgs = {
  id: string
  primaryTable: TableModel
  secondaryTable: TableModel
  primaryAttributeId?: string
  secondaryAttributeId?: string
  attributeMappings?: RelationshipAttributeMapping[]
  relationshipType?: 'one-to-one' | 'one-to-many' | 'many-to-many'
  onDelete?: 'no action' | 'restrict' | 'cascade' | 'set null'
  onUpdate?: 'no action' | 'restrict' | 'cascade' | 'set null'
  enforceConstraint?: boolean
  lineStyle?: RelationshipLineStyle
  vertices?: Array<{ x: number; y: number }>
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
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many' = 'one-to-many'
  onDelete: 'no action' | 'restrict' | 'cascade' | 'set null' = 'cascade'
  onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null' = 'cascade'
  enforceConstraint = true
  lineStyle: RelationshipLineStyle = 'orthogonal'
  vertices: Array<{ x: number; y: number }> = []

  readonly primaryTable: TableModel
  readonly secondaryTable: TableModel
  readonly segmentList: RelationshipSegment[]
  readonly attributeMappings: RelationshipAttributeMapping[]

  get primaryAttributeId() {
    return this.attributeMappings[0]?.primaryAttributeId ?? ''
  }

  get secondaryAttributeId() {
    return this.attributeMappings[0]?.secondaryAttributeId ?? ''
  }

  private constructor(args: CreateRelationshipArgs) {
    super(
      args.id,
      new Vertex(args.primaryTable.coordinate.x, args.primaryTable.coordinate.y),
      'relationship-edge',
    )
    this.primaryTable = args.primaryTable
    this.secondaryTable = args.secondaryTable
    this.attributeMappings =
      args.attributeMappings && args.attributeMappings.length > 0
        ? args.attributeMappings
        : args.primaryAttributeId && args.secondaryAttributeId
          ? [
              {
                id: `map_${args.id}`,
                primaryAttributeId: args.primaryAttributeId,
                secondaryAttributeId: args.secondaryAttributeId,
              },
            ]
          : []
    this.relationshipType = args.relationshipType ?? 'one-to-many'
    this.onDelete = args.onDelete ?? 'cascade'
    this.onUpdate = args.onUpdate ?? 'cascade'
    this.enforceConstraint = args.enforceConstraint ?? true
    this.lineStyle = args.lineStyle ?? 'orthogonal'
    this.vertices = [...(args.vertices ?? [])]
    this.segmentList = [
      new RelationshipSegment(
        new Vertex(args.primaryTable.coordinate.x, args.primaryTable.coordinate.y),
        new Vertex(args.secondaryTable.coordinate.x, args.secondaryTable.coordinate.y),
        RelationshipModel.resolveTypeLabel(this.relationshipType),
      ),
    ]
  }
}
