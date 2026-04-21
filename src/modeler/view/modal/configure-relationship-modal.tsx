'use client'

import { useEffect } from 'react'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'
import { relationshipLineStyleOptions } from '@/modeler/enum/relationship-line-style'
import type { EditorRelationshipSnapshot, EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

const relationshipTypeOptions: Array<EditorRelationshipSnapshot['relationshipType']> = [
  'one-to-one',
  'one-to-many',
  'many-to-many',
]

const actionOptions: Array<EditorRelationshipSnapshot['onDelete']> = ['cascade', 'restrict', 'no action', 'set null']

function getOrderedAttributes(table: EditorTableSnapshot | undefined) {
  if (!table) {
    return []
  }

  return [...table.attributes].sort((left, right) => left.displayOrder - right.displayOrder)
}

function getAttributeOptions(table: EditorTableSnapshot | undefined) {
  return getOrderedAttributes(table).map((attribute) => ({
    value: attribute.id,
    label: `${table?.logicalName}.${attribute.logicalName}`,
  }))
}

function getPrimaryAttributeOptions(
  table: EditorTableSnapshot | undefined,
  relationship: Pick<EditorRelationshipSnapshot, 'enforceConstraint' | 'relationshipType'>,
) {
  const orderedAttributes = getOrderedAttributes(table)
  const candidateAttributes =
    relationship.enforceConstraint && relationship.relationshipType !== 'many-to-many'
      ? orderedAttributes.filter((attribute) => attribute.isPrimaryKey)
      : orderedAttributes

  return candidateAttributes.map((attribute) => ({
    value: attribute.id,
    label: `${table?.logicalName}.${attribute.logicalName}`,
  }))
}

function areMappingsEqual(left: EditorRelationshipSnapshot, right: EditorRelationshipSnapshot) {
  if (left.attributeMappings.length !== right.attributeMappings.length) {
    return false
  }

  return left.attributeMappings.every((mapping, index) => {
    const other = right.attributeMappings[index]
    return (
      mapping.id === other?.id &&
      mapping.primaryAttributeId === other?.primaryAttributeId &&
      mapping.secondaryAttributeId === other?.secondaryAttributeId
    )
  })
}

export function ConfigureRelationshipModal({
  draft,
  tables,
  title = 'Configure Relationship',
  submitLabel = 'Create Relationship',
  onClose,
  onChange,
  onSubmit,
}: {
  draft: EditorRelationshipSnapshot
  tables: EditorTableSnapshot[]
  title?: string
  submitLabel?: string
  onClose: () => void
  onChange: (draft: EditorRelationshipSnapshot) => void
  onSubmit: () => void
}) {
  const configureRelationshipFormHandler = new ConfigureRelationshipFormHandler()
  const normalizedDraft = configureRelationshipFormHandler.normalizeDraft(draft, tables)
  const primaryTable = tables.find((table) => table.id === normalizedDraft.primaryTableId)
  const secondaryTable = tables.find((table) => table.id === normalizedDraft.secondaryTableId)
  const primaryAttributeOptions = getPrimaryAttributeOptions(primaryTable, normalizedDraft)
  const secondaryAttributeOptions = getAttributeOptions(secondaryTable)
  const requiresKeyedParent = normalizedDraft.enforceConstraint && normalizedDraft.relationshipType !== 'many-to-many'
  const hasRelationshipTargetOptions = primaryAttributeOptions.length > 0 && secondaryAttributeOptions.length > 0

  useEffect(() => {
    if (!areMappingsEqual(draft, normalizedDraft)) {
      onChange(normalizedDraft)
    }
  }, [draft, normalizedDraft, onChange])

  return (
    <div className="dialog-scrim">
      <section className="dialog-card" aria-label="Configure relationship dialog">
        <h2>{title}</h2>
        <p className="modeler-panel__copy">
          Select the parent table and the child columns that will store the foreign key reference.
        </p>
        {requiresKeyedParent && !primaryAttributeOptions.length ? (
          <p className="modeler-panel__copy" role="alert">
            Add a primary key to the parent table before enforcing a relationship constraint.
          </p>
        ) : null}

        <div className="property-form">
          <label htmlFor="relationship-primary-table">Primary table (parent)</label>
          <select
            id="relationship-primary-table"
            aria-label="Primary table"
            value={normalizedDraft.primaryTableId}
            onChange={(event) => {
              const nextDraft = configureRelationshipFormHandler.normalizeDraft(
                {
                  ...normalizedDraft,
                  primaryTableId: event.target.value,
                },
                tables,
              )
              onChange(nextDraft)
            }}
          >
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.logicalName}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-secondary-table">Secondary table (child)</label>
          <select
            id="relationship-secondary-table"
            aria-label="Secondary table"
            value={normalizedDraft.secondaryTableId}
            onChange={(event) => {
              const nextDraft = configureRelationshipFormHandler.normalizeDraft(
                {
                  ...normalizedDraft,
                  secondaryTableId: event.target.value,
                },
                tables,
              )
              onChange(nextDraft)
            }}
          >
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.logicalName}
              </option>
            ))}
          </select>

          {normalizedDraft.attributeMappings.map((mapping, index) => (
            <div key={mapping.id} className="table-modal-row">
              <label htmlFor={`relationship-primary-attribute-${mapping.id}`}>
                Primary attribute {requiresKeyedParent ? '(PK)' : ''} #{index + 1}
              </label>
              <select
                id={`relationship-primary-attribute-${mapping.id}`}
                aria-label={`Primary attribute ${index + 1}`}
                value={mapping.primaryAttributeId}
                onChange={(event) =>
                  onChange(
                    configureRelationshipFormHandler.updateAttributeMapping(normalizedDraft, mapping.id, {
                      primaryAttributeId: event.target.value,
                    }),
                  )
                }
              >
                {primaryAttributeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label htmlFor={`relationship-secondary-attribute-${mapping.id}`}>Secondary attribute #{index + 1}</label>
              <select
                id={`relationship-secondary-attribute-${mapping.id}`}
                aria-label={`Secondary attribute ${index + 1}`}
                value={mapping.secondaryAttributeId}
                onChange={(event) =>
                  onChange(
                    configureRelationshipFormHandler.updateAttributeMapping(normalizedDraft, mapping.id, {
                      secondaryAttributeId: event.target.value,
                    }),
                  )
                }
              >
                {secondaryAttributeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                className="modeler-toolbar__button modeler-toolbar__button--ghost"
                type="button"
                onClick={() =>
                  onChange(configureRelationshipFormHandler.removeAttributeMapping(normalizedDraft, mapping.id))
                }
                disabled={normalizedDraft.attributeMappings.length <= 1}
              >
                Remove mapping
              </button>
            </div>
          ))}

          <button
            className="modeler-toolbar__button modeler-toolbar__button--ghost"
            type="button"
            onClick={() =>
              onChange(configureRelationshipFormHandler.addAttributeMapping(normalizedDraft, tables))
            }
            disabled={!hasRelationshipTargetOptions}
          >
            Add attribute mapping
          </button>

          <label htmlFor="relationship-type">Relationship type</label>
          <select
            id="relationship-type"
            aria-label="Relationship type"
            value={normalizedDraft.relationshipType}
            onChange={(event) =>
              onChange(
                configureRelationshipFormHandler.normalizeDraft(
                  {
                    ...normalizedDraft,
                    relationshipType: event.target.value as EditorRelationshipSnapshot['relationshipType'],
                  },
                  tables,
                ),
              )
            }
          >
            {relationshipTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-on-delete">On delete</label>
          <select
            id="relationship-on-delete"
            aria-label="On delete"
            value={normalizedDraft.onDelete}
            onChange={(event) =>
              onChange({
                ...normalizedDraft,
                onDelete: event.target.value as EditorRelationshipSnapshot['onDelete'],
              })
            }
          >
            {actionOptions.map((option) => (
              <option key={`delete-${option}`} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-on-update">On update</label>
          <select
            id="relationship-on-update"
            aria-label="On update"
            value={normalizedDraft.onUpdate}
            onChange={(event) =>
              onChange({
                ...normalizedDraft,
                onUpdate: event.target.value as EditorRelationshipSnapshot['onUpdate'],
              })
            }
          >
            {actionOptions.map((option) => (
              <option key={`update-${option}`} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-line-style">Line style</label>
          <select
            id="relationship-line-style"
            aria-label="Line style"
            value={normalizedDraft.lineStyle ?? 'orthogonal'}
            onChange={(event) =>
              onChange({
                ...normalizedDraft,
                lineStyle: event.target.value as EditorRelationshipSnapshot['lineStyle'],
              })
            }
          >
            {relationshipLineStyleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <label className="property-form__checkbox" htmlFor="relationship-enforce-constraint">
            <input
              id="relationship-enforce-constraint"
              aria-label="Enforce constraint"
              type="checkbox"
              checked={normalizedDraft.enforceConstraint}
              onChange={(event) =>
                onChange(
                  configureRelationshipFormHandler.normalizeDraft(
                    {
                      ...normalizedDraft,
                      enforceConstraint: event.target.checked,
                    },
                    tables,
                  ),
                )
              }
            />
            Enforce constraint
          </label>
        </div>

        <div className="modeler-toolbar">
          <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="modeler-toolbar__button"
            type="button"
            onClick={onSubmit}
            disabled={!hasRelationshipTargetOptions || normalizedDraft.attributeMappings.length === 0}
          >
            {submitLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
