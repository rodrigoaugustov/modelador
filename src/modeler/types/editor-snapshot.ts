import type { RelationshipLineStyle } from '@/modeler/enum/relationship-line-style'

export type EditorAttributeSnapshot = {
  id: string
  logicalName: string
  physicalName: string | null
  dataType: string | null
  size: string | null
  displayOrder: number
  isNull: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  definition: string | null
  example: string | null
  domain: string | null
}

export type EditorTableSnapshot = {
  id: string
  logicalName: string
  physicalName: string | null
  schema: string
  coordinate: { x: number; y: number }
  attributes: EditorAttributeSnapshot[]
}

export type EditorRelationshipAttributeMapping = {
  id: string
  primaryAttributeId: string
  secondaryAttributeId: string
}

export type EditorRelationshipSnapshot = {
  id: string
  primaryTableId: string
  secondaryTableId: string
  attributeMappings: EditorRelationshipAttributeMapping[]
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many'
  onDelete: 'no action' | 'restrict' | 'cascade' | 'set null'
  onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null'
  enforceConstraint: boolean
  lineStyle?: RelationshipLineStyle
  vertices?: Array<{ x: number; y: number }>
  primaryAttributeId?: string
  secondaryAttributeId?: string
}

export type EditorProjectSnapshot = {
  project: {
    id: string
    name: string
    description: string
  }
  model: {
    tables: EditorTableSnapshot[]
    relationships: EditorRelationshipSnapshot[]
  }
  diagram: {
    viewport: {
      x: number
      y: number
      zoom: number
    }
  }
  metadata: {
    viewMode: 'logical' | 'physical'
    postgresVersion: string
  }
}

export function buildEmptyProjectSnapshot(input: {
  id: string
  name: string
  description: string
}): EditorProjectSnapshot {
  return {
    project: {
      id: input.id,
      name: input.name,
      description: input.description,
    },
    model: {
      tables: [],
      relationships: [],
    },
    diagram: {
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    },
    metadata: {
      viewMode: 'logical',
      postgresVersion: 'default',
    },
  }
}
