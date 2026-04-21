import { ProjectModel } from '@/modeler/model/project-model'
import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'
import { buildEmptyProjectSnapshot } from '@/modeler/types/editor-snapshot'

export function serializeProjectModel(project: ProjectModel): EditorProjectSnapshot {
  const snapshot = buildEmptyProjectSnapshot({
    id: project.id,
    name: project.name,
    description: project.description,
  })

  snapshot.model.tables = Array.from(project.tables.values()).map((table) => ({
    id: table.identification,
    coordinate: {
      x: table.coordinate.x,
      y: table.coordinate.y,
    },
    logicalName: table.tableName.logicalName,
    physicalName: table.tableName.physicalName,
    schema: 'public',
    attributes: [
      ...Array.from(table.tablePrimaryKeyList.values()),
      ...Array.from(table.tableAttributeList.values()),
    ].map((attribute) => ({
      id: attribute.identification,
      logicalName: attribute.logicalName ?? '',
      physicalName: attribute.physicalName,
      dataType: attribute.dataType,
      size: attribute.size,
      isNull: attribute.isNull ?? true,
      isPrimaryKey: attribute.isPrimaryKey ?? false,
      isForeignKey: attribute.isForeignKey ?? false,
      definition: attribute.definition,
      example: attribute.example,
      domain: attribute.domain,
    })),
  }))

  snapshot.model.relationships = Array.from(project.relationships.values()).map((relationship) => ({
    id: relationship.identification,
    primaryTableId: relationship.primaryTable.identification,
    secondaryTableId: relationship.secondaryTable.identification,
    primaryAttributeId: relationship.primaryAttributeId,
    secondaryAttributeId: relationship.secondaryAttributeId,
    relationshipType: relationship.relationshipType,
    onDelete: relationship.onDelete,
    onUpdate: relationship.onUpdate,
    enforceConstraint: relationship.enforceConstraint,
  }))

  return snapshot
}
