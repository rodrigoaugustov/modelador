import type { EdgeMetadata } from '@antv/x6/lib/model/edge'
import { RelationshipRoutingController } from '@/modeler/control/handler/relationship/relationship-routing-controller'
import { RelationshipModel } from '@/modeler/model/relationship/relationship-model'

export function createRelationshipEdgeDefinition(relationship: RelationshipModel): EdgeMetadata {
  const routingController = new RelationshipRoutingController()
  const geometry = routingController.resolveEdgeGeometry(
    relationship.lineStyle,
    relationship.vertices,
  )
  const label = relationship.segmentList[0]?.label ?? RelationshipModel.resolveTypeLabel(relationship.relationshipType)

  return {
    id: relationship.identification,
    source: relationship.primaryTable.identification,
    target: relationship.secondaryTable.identification,
    router: geometry.router,
    connector: geometry.connector,
    vertices: relationship.vertices,
    tools: [{ name: 'vertices', args: { addable: false, removable: true, snapRadius: 0 } }],
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
