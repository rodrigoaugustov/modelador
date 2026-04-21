import type { Edge } from '@antv/x6'
import type { RelationshipModel } from '@/modeler/model/relationship/relationship-model'

export function createRelationshipEdgeDefinition(relationship: RelationshipModel): Edge.Metadata {
  const label = relationship.segmentList[0]?.label ?? RelationshipModel.resolveTypeLabel(relationship.relationshipType)

  return {
    id: relationship.identification,
    source: relationship.primaryTable.identification,
    target: relationship.secondaryTable.identification,
    connector: { name: 'rounded' },
    labels: [
      {
        attrs: {
          label: {
            text: label,
            fill: '#435368',
            fontSize: 12,
            fontWeight: 600,
          },
        },
      },
    ],
    attrs: {
      line: {
        stroke: '#0053db',
        strokeWidth: 2,
        targetMarker: 'classic',
      },
    },
  }
}
