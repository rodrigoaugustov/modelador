import type { Edge } from '@antv/x6'
import type { RelationshipModel } from '@/modeler/model/relationship/relationship-model'

export function createRelationshipEdgeDefinition(relationship: RelationshipModel): Edge.Metadata {
  return {
    id: relationship.identification,
    source: relationship.primaryTable.identification,
    target: relationship.secondaryTable.identification,
    connector: { name: 'rounded' },
    attrs: {
      line: {
        stroke: '#0053db',
        strokeWidth: 2,
        targetMarker: 'classic',
      },
    },
  }
}
