'use client'

import type { EditorRelationshipSnapshot, EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

const relationshipTypeOptions: Array<EditorRelationshipSnapshot['relationshipType']> = [
  'one-to-one',
  'one-to-many',
  'many-to-many',
]

const actionOptions: Array<EditorRelationshipSnapshot['onDelete']> = ['cascade', 'restrict', 'no action', 'set null']

function getAttributeOptions(table: EditorTableSnapshot | undefined) {
  if (!table) {
    return []
  }

  return table.attributes.map((attribute) => ({
    value: attribute.id,
    label: `${table.logicalName}.${attribute.logicalName}`,
  }))
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
  const primaryTable = tables.find((table) => table.id === draft.primaryTableId)
  const secondaryTable = tables.find((table) => table.id === draft.secondaryTableId)
  const primaryAttributeOptions = getAttributeOptions(primaryTable)
  const secondaryAttributeOptions = getAttributeOptions(secondaryTable)

  return (
    <div className="dialog-scrim">
      <section className="dialog-card" aria-label="Configure relationship dialog">
        <h2>{title}</h2>
        <p className="modeler-panel__copy">Select source and target columns to create the referential link.</p>

        <div className="property-form">
          <label htmlFor="relationship-primary-table">Primary table</label>
          <select
            id="relationship-primary-table"
            aria-label="Primary table"
            value={draft.primaryTableId}
            onChange={(event) => {
              const nextPrimaryTable = tables.find((table) => table.id === event.target.value)
              onChange({
                ...draft,
                primaryTableId: event.target.value,
                primaryAttributeId: nextPrimaryTable?.attributes[0]?.id ?? '',
              })
            }}
          >
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.logicalName}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-secondary-table">Secondary table</label>
          <select
            id="relationship-secondary-table"
            aria-label="Secondary table"
            value={draft.secondaryTableId}
            onChange={(event) => {
              const nextSecondaryTable = tables.find((table) => table.id === event.target.value)
              onChange({
                ...draft,
                secondaryTableId: event.target.value,
                secondaryAttributeId: nextSecondaryTable?.attributes[0]?.id ?? '',
              })
            }}
          >
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.logicalName}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-primary-attribute">Primary attribute</label>
          <select
            id="relationship-primary-attribute"
            aria-label="Primary attribute"
            value={draft.primaryAttributeId}
            onChange={(event) =>
              onChange({
                ...draft,
                primaryAttributeId: event.target.value,
              })
            }
          >
            {primaryAttributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-secondary-attribute">Secondary attribute</label>
          <select
            id="relationship-secondary-attribute"
            aria-label="Secondary attribute"
            value={draft.secondaryAttributeId}
            onChange={(event) =>
              onChange({
                ...draft,
                secondaryAttributeId: event.target.value,
              })
            }
          >
            {secondaryAttributeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label htmlFor="relationship-type">Relationship type</label>
          <select
            id="relationship-type"
            aria-label="Relationship type"
            value={draft.relationshipType}
            onChange={(event) =>
              onChange({
                ...draft,
                relationshipType: event.target.value as EditorRelationshipSnapshot['relationshipType'],
              })
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
            value={draft.onDelete}
            onChange={(event) =>
              onChange({
                ...draft,
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
            value={draft.onUpdate}
            onChange={(event) =>
              onChange({
                ...draft,
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

          <label className="property-form__checkbox" htmlFor="relationship-enforce-constraint">
            <input
              id="relationship-enforce-constraint"
              aria-label="Enforce constraint"
              type="checkbox"
              checked={draft.enforceConstraint}
              onChange={(event) =>
                onChange({
                  ...draft,
                  enforceConstraint: event.target.checked,
                })
              }
            />
            Enforce constraint
          </label>
        </div>

        <div className="modeler-toolbar">
          <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="modeler-toolbar__button" type="button" onClick={onSubmit}>
            {submitLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
