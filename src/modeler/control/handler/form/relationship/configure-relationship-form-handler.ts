import type { RelationshipLineStyle } from '@/modeler/enum/relationship-line-style'
import type {
  EditorRelationshipAttributeMapping,
  EditorRelationshipSnapshot,
  EditorTableSnapshot,
} from '@/modeler/types/editor-snapshot'

export class ConfigureRelationshipFormHandler {
  private createAttributeMapping(
    primaryAttributeId: string,
    secondaryAttributeId: string,
  ): EditorRelationshipAttributeMapping {
    return {
      id: `map_${crypto.randomUUID()}`,
      primaryAttributeId,
      secondaryAttributeId,
    }
  }

  private resolvePrimaryAttributeOptions(
    table: EditorTableSnapshot | undefined,
    relationship: Pick<EditorRelationshipSnapshot, 'enforceConstraint' | 'relationshipType'>,
  ) {
    if (!table) {
      return []
    }

    const orderedAttributes = [...table.attributes].sort((left, right) => left.displayOrder - right.displayOrder)

    if (relationship.enforceConstraint && relationship.relationshipType !== 'many-to-many') {
      const primaryKeys = orderedAttributes.filter((attribute) => attribute.isPrimaryKey)
      return primaryKeys.length > 0 ? primaryKeys : orderedAttributes
    }

    return orderedAttributes
  }

  private resolveSecondaryAttributeOptions(table: EditorTableSnapshot | undefined) {
    if (!table) {
      return []
    }

    return [...table.attributes].sort((left, right) => left.displayOrder - right.displayOrder)
  }

  private ensureMappings(
    relationship: EditorRelationshipSnapshot,
    tables: EditorTableSnapshot[],
  ): EditorRelationshipAttributeMapping[] {
    const primaryTable = tables.find((table) => table.id === relationship.primaryTableId)
    const secondaryTable = tables.find((table) => table.id === relationship.secondaryTableId)
    const primaryOptions = this.resolvePrimaryAttributeOptions(primaryTable, relationship)
    const secondaryOptions = this.resolveSecondaryAttributeOptions(secondaryTable)
    const baseMappings =
      relationship.attributeMappings.length > 0
        ? relationship.attributeMappings
        : relationship.primaryAttributeId && relationship.secondaryAttributeId
          ? [
              this.createAttributeMapping(
                relationship.primaryAttributeId,
                relationship.secondaryAttributeId,
              ),
            ]
          : primaryOptions[0] && secondaryOptions[0]
            ? [this.createAttributeMapping(primaryOptions[0].id, secondaryOptions[0].id)]
            : []

    return baseMappings
      .map((mapping, index) => {
        const fallbackPrimary = primaryOptions[index] ?? primaryOptions[0]
        const fallbackSecondary = secondaryOptions[index] ?? secondaryOptions[0]
        const nextPrimary =
          primaryOptions.find((attribute) => attribute.id === mapping.primaryAttributeId)?.id ??
          fallbackPrimary?.id ??
          ''
        const nextSecondary =
          secondaryOptions.find((attribute) => attribute.id === mapping.secondaryAttributeId)?.id ??
          fallbackSecondary?.id ??
          ''

        return {
          id: mapping.id || `map_${crypto.randomUUID()}`,
          primaryAttributeId: nextPrimary,
          secondaryAttributeId: nextSecondary,
        }
      })
      .filter((mapping) => mapping.primaryAttributeId && mapping.secondaryAttributeId)
  }

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
      attributeMappings: [this.createAttributeMapping(primaryAttributeId, secondaryAttributeId)],
      relationshipType: 'one-to-many',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      enforceConstraint: true,
      lineStyle: 'orthogonal',
      vertices: [],
    }
  }

  createDraftFromTables(tables: EditorTableSnapshot[]) {
    const [primaryTable, secondaryTable = primaryTable] = tables
    const primaryAttributeId =
      this.resolvePrimaryAttributeOptions(primaryTable, {
        enforceConstraint: true,
        relationshipType: 'one-to-many',
      })[0]?.id ?? ''
    const secondaryAttributeId = this.resolveSecondaryAttributeOptions(secondaryTable)[0]?.id ?? ''

    return this.createDraft(
      primaryTable?.id ?? '',
      secondaryTable?.id ?? '',
      primaryAttributeId,
      secondaryAttributeId,
    )
  }

  normalizeDraft(relationship: EditorRelationshipSnapshot, tables: EditorTableSnapshot[]) {
    const attributeMappings = this.ensureMappings(relationship, tables)

    return {
      ...relationship,
      attributeMappings,
      lineStyle: relationship.lineStyle ?? 'orthogonal',
      vertices: relationship.vertices ?? [],
    }
  }

  addAttributeMapping(relationship: EditorRelationshipSnapshot, tables: EditorTableSnapshot[]) {
    const normalized = this.normalizeDraft(relationship, tables)
    const primaryTable = tables.find((table) => table.id === normalized.primaryTableId)
    const secondaryTable = tables.find((table) => table.id === normalized.secondaryTableId)
    const primaryOptions = this.resolvePrimaryAttributeOptions(primaryTable, normalized)
    const secondaryOptions = this.resolveSecondaryAttributeOptions(secondaryTable)
    const usedPrimaryIds = new Set(normalized.attributeMappings.map((mapping) => mapping.primaryAttributeId))
    const usedSecondaryIds = new Set(normalized.attributeMappings.map((mapping) => mapping.secondaryAttributeId))
    const nextPrimary =
      primaryOptions.find((attribute) => !usedPrimaryIds.has(attribute.id)) ?? primaryOptions[0]
    const nextSecondary =
      secondaryOptions.find((attribute) => !usedSecondaryIds.has(attribute.id)) ?? secondaryOptions[0]

    if (!nextPrimary || !nextSecondary) {
      return normalized
    }

    return {
      ...normalized,
      attributeMappings: [
        ...normalized.attributeMappings,
        this.createAttributeMapping(nextPrimary.id, nextSecondary.id),
      ],
    }
  }

  updateAttributeMapping(
    relationship: EditorRelationshipSnapshot,
    mappingId: string,
    patch: Partial<EditorRelationshipAttributeMapping>,
  ) {
    return {
      ...relationship,
      attributeMappings: relationship.attributeMappings.map((mapping) =>
        mapping.id === mappingId
          ? {
              ...mapping,
              ...patch,
            }
          : mapping,
      ),
    }
  }

  removeAttributeMapping(relationship: EditorRelationshipSnapshot, mappingId: string) {
    if (relationship.attributeMappings.length <= 1) {
      return relationship
    }

    return {
      ...relationship,
      attributeMappings: relationship.attributeMappings.filter((mapping) => mapping.id !== mappingId),
    }
  }

  applyPatch(
    relationship: EditorRelationshipSnapshot,
    patch: Partial<EditorRelationshipSnapshot>,
  ): EditorRelationshipSnapshot {
    return {
      ...relationship,
      ...patch,
      attributeMappings: patch.attributeMappings ?? relationship.attributeMappings,
      lineStyle: (patch.lineStyle ?? relationship.lineStyle ?? 'orthogonal') as RelationshipLineStyle,
      vertices: patch.vertices ?? relationship.vertices ?? [],
    }
  }
}
