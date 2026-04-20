import type { ReactNode } from 'react'

export function PropertyPanel({ children }: { children?: ReactNode }) {
  return (
    <aside className="modeler-panel modeler-panel--right">
      <p className="modeler-panel__eyebrow">Properties</p>
      <div className="property-card">
        <h2 className="modeler-panel__title">Selection</h2>
        {children ?? (
          <p className="modeler-panel__copy">
            Select a table or relationship to edit its metadata, naming, and PostgreSQL details.
          </p>
        )}
      </div>
    </aside>
  )
}
