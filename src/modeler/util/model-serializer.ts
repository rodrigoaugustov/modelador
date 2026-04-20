import { ViewMode } from '@/modeler/enum/view-mode'
import { ProjectModel } from '@/modeler/model/project-model'

export function serializeProjectModel(project: ProjectModel) {
  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
    },
    model: {
      tables: Array.from(project.tables.values()).map((table) => ({
        id: table.identification,
        coordinate: table.coordinate,
        logicalName: table.tableName.logicalName,
        physicalName: table.tableName.physicalName,
      })),
      relationships: Array.from(project.relationships.values()).map((relationship) => ({
        id: relationship.identification,
        primaryTableId: relationship.primaryTable.identification,
        secondaryTableId: relationship.secondaryTable.identification,
      })),
    },
    diagram: {
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    },
    metadata: {
      viewMode: ViewMode.Logical,
    },
  }
}
