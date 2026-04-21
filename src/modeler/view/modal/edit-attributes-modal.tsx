'use client'

import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'
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
  const editAttributesFormHandler = new EditAttributesFormHandler()

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
                  attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                    logicalName: event.target.value,
                    physicalName: event.target.value || null,
                  }),
                })
              }
            />

            <label htmlFor={`attribute-physical-name-${index}`}>Physical name</label>
            <input
              id={`attribute-physical-name-${index}`}
              aria-label="Physical name"
              value={attribute.physicalName ?? ''}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                    physicalName: event.target.value || null,
                  }),
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
                  attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                    dataType: event.target.value,
                  }),
                })
              }
            />

            <label htmlFor={`attribute-size-${index}`}>Size</label>
            <input
              id={`attribute-size-${index}`}
              aria-label="Size"
              value={attribute.size ?? ''}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                    size: event.target.value || null,
                  }),
                })
              }
            />

            <label htmlFor={`attribute-definition-${index}`}>Definition</label>
            <input
              id={`attribute-definition-${index}`}
              aria-label="Definition"
              value={attribute.definition ?? ''}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                    definition: event.target.value || null,
                  }),
                })
              }
            />

            <label htmlFor={`attribute-example-${index}`}>Example</label>
            <input
              id={`attribute-example-${index}`}
              aria-label="Example"
              value={attribute.example ?? ''}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                    example: event.target.value || null,
                  }),
                })
              }
            />

            <label htmlFor={`attribute-domain-${index}`}>Domain</label>
            <input
              id={`attribute-domain-${index}`}
              aria-label="Domain"
              value={attribute.domain ?? ''}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                    domain: event.target.value || null,
                  }),
                })
              }
            />

            <label>
              <input
                aria-label="Not null"
                type="checkbox"
                checked={!attribute.isNull}
                onChange={(event) =>
                  onChange({
                    ...table,
                    attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
                      isNull: !event.target.checked,
                    }),
                  })
                }
              />
              Not null
            </label>

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
