import type { EditorRelationshipSnapshot, EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export class ConfigureRelationshipFormHandler {
  createDraft(
    primaryTableId: string,
    secondaryTableId: string,
    primaryAttributeId: string,
    secondaryAttributeId: string,
  ): EditorRelationshipSnapshot {
    return {
      id: `rel_${crypto.randomUUID()}`,
      primaryTableId,
      secondaryTableId,
      primaryAttributeId,
      secondaryAttributeId,
      relationshipType: 'one-to-many',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      enforceConstraint: true,
    }
  }

  createDraftFromTables(tables: EditorTableSnapshot[]) {
    const [primaryTable, secondaryTable = primaryTable] = tables
    const primaryAttributeId = primaryTable?.attributes[0]?.id ?? ''
    const secondaryAttributeId = secondaryTable?.attributes[0]?.id ?? ''

    return this.createDraft(
      primaryTable?.id ?? '',
      secondaryTable?.id ?? '',
      primaryAttributeId,
      secondaryAttributeId,
    )
  }

  applyPatch(
    relationship: EditorRelationshipSnapshot,
    patch: Partial<EditorRelationshipSnapshot>,
  ): EditorRelationshipSnapshot {
    return {
      ...relationship,
      ...patch,
    }
  }
}
