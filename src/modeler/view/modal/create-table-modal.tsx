'use client'

import type { EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

type CreateTableDraft = Omit<EditorTableSnapshot, 'id' | 'coordinate'>

export function CreateTableModal({
  draft,
  onClose,
  onChange,
  onSubmit,
}: {
  draft: CreateTableDraft
  onClose: () => void
  onChange: (draft: CreateTableDraft) => void
  onSubmit: () => void
}) {
  return (
    <div className="dialog-scrim">
      <section className="dialog-card" aria-label="Create table dialog">
        <h2>Create New Table</h2>
        <p className="modeler-panel__copy">Define the initial structure and identity for the new table.</p>

        <div className="property-form">
          <label htmlFor="table-name">Table Name</label>
          <input
            id="table-name"
            value={draft.logicalName}
            onChange={(event) =>
              onChange({
                ...draft,
                logicalName: event.target.value,
              })
            }
          />

          <label htmlFor="table-schema">Schema</label>
          <input
            id="table-schema"
            value={draft.schema}
            onChange={(event) =>
              onChange({
                ...draft,
                schema: event.target.value,
              })
            }
          />
        </div>

        <div className="property-card">
          <p className="modeler-panel__eyebrow">Attributes & Columns</p>
          {draft.attributes.length > 0 ? (
            draft.attributes.map((attribute) => (
              <div key={attribute.id} className="table-modal-row">
                <input aria-label="Column name" value={attribute.logicalName} readOnly />
                <input aria-label="Data type" value={attribute.dataType?.toUpperCase() ?? 'TEXT'} readOnly />
                <input aria-label="Primary key" value={attribute.isPrimaryKey ? 'PK' : ''} readOnly />
                <input aria-label="Not null" value={attribute.isNull ? '' : 'Not Null'} readOnly />
              </div>
            ))
          ) : (
            <p className="modeler-panel__copy">
              This table starts without columns. Add attributes after the table is created.
            </p>
          )}
        </div>

        <div className="modeler-toolbar">
          <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="modeler-toolbar__button" type="button" onClick={onSubmit}>
            Create Table
          </button>
        </div>
      </section>
    </div>
  )
}
