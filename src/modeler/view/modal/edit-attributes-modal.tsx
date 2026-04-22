'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'
import { ReorderAttributesFormHandler } from '@/modeler/control/handler/form/table/reorder-attributes-form-handler'
import type { EditorAttributeSnapshot, EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

function normalizeFilterValue(value: string) {
  return value.trim().toLowerCase()
}

function matchesFilter(attribute: EditorAttributeSnapshot, filterValue: string) {
  if (!filterValue) {
    return true
  }

  return [attribute.logicalName, attribute.physicalName, attribute.dataType, attribute.definition, attribute.example, attribute.domain]
    .filter(Boolean)
    .some((part) => part?.toLowerCase().includes(filterValue))
}

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
  onChange: (updater: (currentTable: EditorTableSnapshot) => EditorTableSnapshot) => void
  onAddColumn: () => void
  onRemoveAttribute: (attributeId: string) => void
  onApply: () => void
}) {
  const editAttributesFormHandler = new EditAttributesFormHandler()
  const reorderAttributesFormHandler = new ReorderAttributesFormHandler()
  const orderedAttributes = useMemo(
    () => [...table.attributes].sort((left, right) => left.displayOrder - right.displayOrder),
    [table.attributes],
  )
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(orderedAttributes[0]?.id ?? null)
  const [filterValue, setFilterValue] = useState('')
  const previousCountRef = useRef(orderedAttributes.length)

  useEffect(() => {
    const selectedStillExists = orderedAttributes.some((attribute) => attribute.id === selectedAttributeId)

    if (!selectedStillExists) {
      setSelectedAttributeId(orderedAttributes[0]?.id ?? null)
    }

    if (orderedAttributes.length > previousCountRef.current) {
      setSelectedAttributeId(orderedAttributes.at(-1)?.id ?? null)
    }

    previousCountRef.current = orderedAttributes.length
  }, [orderedAttributes, selectedAttributeId])

  const normalizedFilter = normalizeFilterValue(filterValue)
  const filteredAttributes = useMemo(
    () => orderedAttributes.filter((attribute) => matchesFilter(attribute, normalizedFilter)),
    [normalizedFilter, orderedAttributes],
  )
  const selectedAttribute =
    orderedAttributes.find((attribute) => attribute.id === selectedAttributeId) ?? orderedAttributes[0] ?? null

  function emitAttributes(updater: (attributes: EditorAttributeSnapshot[]) => EditorAttributeSnapshot[]) {
    onChange((currentTable) => ({
      ...currentTable,
      attributes: updater(currentTable.attributes),
    }))
  }

  function updateAttribute(attributeId: string, patch: Partial<EditorAttributeSnapshot>) {
    emitAttributes((attributes) => editAttributesFormHandler.updateAttribute(attributes, attributeId, patch))
  }

  function updateSelectedAttribute(patch: Partial<EditorAttributeSnapshot>) {
    if (!selectedAttribute) {
      return
    }

    updateAttribute(selectedAttribute.id, patch)
  }

  function handleRemoveAttribute(attributeId: string) {
    const currentIndex = orderedAttributes.findIndex((attribute) => attribute.id === attributeId)
    const nextSelection =
      orderedAttributes[currentIndex - 1]?.id ??
      orderedAttributes[currentIndex + 1]?.id ??
      orderedAttributes.find((attribute) => attribute.id !== attributeId)?.id ??
      null

    setSelectedAttributeId(nextSelection)
    onRemoveAttribute(attributeId)
  }

  return (
    <div className="dialog-scrim">
      <section className="dialog-card dialog-card--attributes" aria-label="Edit attributes dialog">
        <header className="attributes-modal__header">
          <div>
            <h2>Edit Attributes: {table.logicalName}</h2>
            <p className="modeler-panel__copy">
              Configure schema properties, constraints, and attribute metadata for the selected entity.
            </p>
          </div>
          <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="attributes-modal__toolbar">
          <div className="modeler-toolbar">
            <button className="modeler-toolbar__button" type="button" onClick={onAddColumn}>
              Add Column
            </button>
            <button
              className="modeler-toolbar__button modeler-toolbar__button--ghost"
              type="button"
              disabled={!selectedAttribute}
              onClick={() => {
                if (selectedAttribute) {
                  handleRemoveAttribute(selectedAttribute.id)
                }
              }}
            >
              Delete
            </button>
          </div>

          <label className="attributes-modal__search">
            <span className="attributes-modal__search-label">Filter attributes</span>
            <input
              aria-label="Filter attributes"
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              placeholder="Filter attributes..."
            />
          </label>
        </div>

        <div className="attributes-modal__grid-shell">
          <table className="attributes-grid">
            <thead>
              <tr>
                <th scope="col" aria-label="Order" />
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">PK</th>
                <th scope="col">NN</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttributes.map((attribute) => {
                const isSelected = selectedAttribute?.id === attribute.id
                const dataTypeLabel = attribute.dataType?.toUpperCase() ?? 'TEXT'

                return (
                  <tr
                    key={attribute.id}
                    aria-label={`${attribute.logicalName || 'column'} ${dataTypeLabel}`}
                    aria-selected={isSelected}
                    className={isSelected ? 'attributes-grid__row attributes-grid__row--selected' : 'attributes-grid__row'}
                    onClick={() => setSelectedAttributeId(attribute.id)}
                  >
                    <td>
                      <span className="attributes-grid__drag-handle" aria-hidden="true">
                        ⋮⋮
                      </span>
                    </td>
                    <td>
                      <input
                        aria-label="Column name"
                        value={attribute.logicalName}
                        onChange={(event) =>
                          updateAttribute(attribute.id, {
                            logicalName: event.target.value,
                            physicalName: event.target.value || null,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Data type"
                        value={attribute.dataType ?? ''}
                        onChange={(event) =>
                          updateAttribute(attribute.id, {
                            dataType: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="attributes-grid__checkbox-cell">
                      <input
                        aria-label="Primary key"
                        type="checkbox"
                        checked={attribute.isPrimaryKey}
                        onChange={(event) =>
                          updateAttribute(attribute.id, {
                            isPrimaryKey: event.target.checked,
                          })
                        }
                      />
                    </td>
                    <td className="attributes-grid__checkbox-cell">
                      <input
                        aria-label="Not null"
                        type="checkbox"
                        checked={!attribute.isNull}
                        disabled={attribute.isPrimaryKey}
                        onChange={(event) =>
                          updateAttribute(attribute.id, {
                            isNull: !event.target.checked,
                          })
                        }
                      />
                    </td>
                    <td>
                      <div className="attributes-grid__actions">
                        <button
                          className="modeler-toolbar__button modeler-toolbar__button--ghost"
                          type="button"
                          aria-label={`Move ${attribute.logicalName || 'attribute'} up`}
                          onClick={(event) => {
                            event.stopPropagation()
                            emitAttributes((attributes) => reorderAttributesFormHandler.moveUp(attributes, attribute.id))
                            setSelectedAttributeId(attribute.id)
                          }}
                        >
                          Up
                        </button>
                        <button
                          className="modeler-toolbar__button modeler-toolbar__button--ghost"
                          type="button"
                          aria-label={`Move ${attribute.logicalName || 'attribute'} down`}
                          onClick={(event) => {
                            event.stopPropagation()
                            emitAttributes((attributes) => reorderAttributesFormHandler.moveDown(attributes, attribute.id))
                            setSelectedAttributeId(attribute.id)
                          }}
                        >
                          Down
                        </button>
                        <button
                          className="modeler-toolbar__button modeler-toolbar__button--ghost"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleRemoveAttribute(attribute.id)
                          }}
                        >
                          Delete Attribute
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredAttributes.length === 0 ? (
            <div className="attributes-grid__empty">No attributes match the current filter.</div>
          ) : null}
        </div>

        <div className="attributes-modal__details">
          <section className="attributes-modal__detail-card">
            <h3>Column Details</h3>
            {selectedAttribute ? (
              <div className="attributes-modal__detail-form">
                <label>
                  Physical name
                  <input
                    aria-label="Physical name"
                    value={selectedAttribute.physicalName ?? ''}
                    onChange={(event) =>
                      updateSelectedAttribute({
                        physicalName: event.target.value || null,
                      })
                    }
                  />
                </label>
                <label>
                  Size
                  <input
                    aria-label="Size"
                    value={selectedAttribute.size ?? ''}
                    onChange={(event) =>
                      updateSelectedAttribute({
                        size: event.target.value || null,
                      })
                    }
                  />
                </label>
                <label className="attributes-modal__detail-form--wide">
                  Description / Comment
                  <textarea
                    aria-label="Definition"
                    value={selectedAttribute.definition ?? ''}
                    onChange={(event) =>
                      updateSelectedAttribute({
                        definition: event.target.value || null,
                      })
                    }
                  />
                </label>
              </div>
            ) : (
              <p className="modeler-panel__copy">Select a row to edit its metadata.</p>
            )}
          </section>

          <section className="attributes-modal__detail-card">
            <h3>Semantic Notes</h3>
            {selectedAttribute ? (
              <div className="attributes-modal__detail-form">
                <label>
                  Example
                  <input
                    aria-label="Example"
                    value={selectedAttribute.example ?? ''}
                    onChange={(event) =>
                      updateSelectedAttribute({
                        example: event.target.value || null,
                      })
                    }
                  />
                </label>
                <label className="attributes-modal__detail-form--wide">
                  Domain
                  <textarea
                    aria-label="Domain"
                    value={selectedAttribute.domain ?? ''}
                    onChange={(event) =>
                      updateSelectedAttribute({
                        domain: event.target.value || null,
                      })
                    }
                  />
                </label>
              </div>
            ) : (
              <p className="modeler-panel__copy">Attribute examples and domains appear here.</p>
            )}
          </section>
        </div>

        <footer className="attributes-modal__footer">
          <div className="attributes-modal__status">
            <span>{orderedAttributes.length} Columns defined</span>
            <span>Schema edits are applied to the current table draft immediately.</span>
          </div>
          <div className="modeler-toolbar">
            <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={onClose}>
              Discard
            </button>
            <button className="modeler-toolbar__button" type="button" onClick={onApply}>
              Apply Schema Changes
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
