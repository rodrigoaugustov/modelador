'use client'

import type { EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export function EditAttributesModal({
  table,
  onClose,
  onChange,
  onAddColumn,
  onRemoveAttribute,
  onApply,
}: {
  table: EditorTableSnapshot
  onClose: () => void
  onChange: (table: EditorTableSnapshot) => void
  onAddColumn: () => void
  onRemoveAttribute: (attributeId: string) => void
  onApply: () => void
}) {
  return (
    <div className="dialog-scrim">
      <section className="dialog-card" aria-label="Edit attributes dialog">
        <h2>Edit Attributes: {table.logicalName}</h2>
        <p className="modeler-panel__copy">Configure schema properties, constraints, and attribute metadata.</p>

        <div className="modeler-toolbar">
          <button className="modeler-toolbar__button" type="button" onClick={onAddColumn}>
            Add Column
          </button>
        </div>

        {table.attributes.map((attribute, index) => (
          <div key={attribute.id} className="table-modal-row">
            <label htmlFor={`attribute-name-${index}`}>Column name</label>
            <input
              id={`attribute-name-${index}`}
              aria-label="Column name"
              value={attribute.logicalName}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: table.attributes.map((currentAttribute) =>
                    currentAttribute.id === attribute.id
                      ? {
                          ...currentAttribute,
                          logicalName: event.target.value,
                          physicalName: event.target.value || null,
                        }
                      : currentAttribute,
                  ),
                })
              }
            />

            <label htmlFor={`attribute-type-${index}`}>Data type</label>
            <input
              id={`attribute-type-${index}`}
              aria-label="Data type"
              value={attribute.dataType ?? ''}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: table.attributes.map((currentAttribute) =>
                    currentAttribute.id === attribute.id
                      ? {
                          ...currentAttribute,
                          dataType: event.target.value,
                        }
                      : currentAttribute,
                  ),
                })
              }
            />

            <button
              className="modeler-toolbar__button modeler-toolbar__button--ghost"
              type="button"
              onClick={() => onRemoveAttribute(attribute.id)}
            >
              Delete Attribute
            </button>
          </div>
        ))}

        <div className="modeler-toolbar">
          <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={onClose}>
            Discard
          </button>
          <button className="modeler-toolbar__button" type="button" onClick={onApply}>
            Apply Schema Changes
          </button>
        </div>
      </section>
    </div>
  )
}
