import type { ReactNode } from 'react'

export function PropertyPanel({
  children,
  badge,
  title = 'Selection',
}: {
  children?: ReactNode
  badge?: string | null
  title?: string
}) {
  return (
    <aside className="modeler-panel modeler-panel--right">
      <div className="modeler-panel__header">
        <p className="modeler-panel__eyebrow">Properties</p>
        {badge ? <span className="modeler-panel__chip">{badge}</span> : null}
      </div>
      <div className="property-card">
        <h2 className="modeler-panel__title">{title}</h2>
        {children ?? (
          <p className="modeler-panel__copy">
            Select a table or relationship to edit its metadata, naming, and PostgreSQL details.
          </p>
        )}
      </div>
    </aside>
  )
}
