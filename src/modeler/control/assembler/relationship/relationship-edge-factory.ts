import type { Edge } from '@antv/x6'
import { RelationshipRoutingController } from '@/modeler/control/handler/relationship/relationship-routing-controller'
import type { RelationshipModel } from '@/modeler/model/relationship/relationship-model'

export function createRelationshipEdgeDefinition(relationship: RelationshipModel): Edge.Metadata {
  const routingController = new RelationshipRoutingController()
  const geometry = routingController.resolveEdgeGeometry(relationship.lineStyle)
  const label = relationship.segmentList[0]?.label ?? RelationshipModel.resolveTypeLabel(relationship.relationshipType)

  return {
    id: relationship.identification,
    source: relationship.primaryTable.identification,
    target: relationship.secondaryTable.identification,
    router: geometry.router,
    connector: geometry.connector,
    vertices: relationship.vertices,
    tools: ['vertices'],
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
        stroke: relationship.isSelected ? '#0f4bb8' : '#0053db',
        strokeWidth: relationship.isSelected ? 3 : 2,
        targetMarker: 'classic',
      },
    },
  }
}
