'use client'

import type { EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export function EditTableDetailsModal({
  table,
  onClose,
  onChange,
  onApply,
}: {
  table: EditorTableSnapshot
  onClose: () => void
  onChange: (table: EditorTableSnapshot) => void
  onApply: () => void
}) {
  return (
    <div className="dialog-scrim">
      <section className="dialog-card" aria-label="Edit table details dialog">
        <h2>Edit Table Details: {table.logicalName}</h2>
        <p className="modeler-panel__copy">Update logical identity, physical naming, and schema placement.</p>

        <div className="property-form">
          <label htmlFor="table-logical-name">Logical table name</label>
          <input
            id="table-logical-name"
            aria-label="Logical table name"
            value={table.logicalName}
            onChange={(event) =>
              onChange({
                ...table,
                logicalName: event.target.value,
              })
            }
          />

          <label htmlFor="table-physical-name">Physical table name</label>
          <input
            id="table-physical-name"
            aria-label="Physical table name"
            value={table.physicalName ?? ''}
            onChange={(event) =>
              onChange({
                ...table,
                physicalName: event.target.value || null,
              })
            }
          />

          <label htmlFor="table-details-schema">Schema</label>
          <input
            id="table-details-schema"
            aria-label="Schema"
            value={table.schema}
            onChange={(event) =>
              onChange({
                ...table,
                schema: event.target.value,
              })
            }
          />
        </div>

        <div className="modeler-toolbar">
          <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={onClose}>
            Discard
          </button>
          <button className="modeler-toolbar__button" type="button" onClick={onApply}>
            Apply Table Details
          </button>
        </div>
      </section>
    </div>
  )
}
