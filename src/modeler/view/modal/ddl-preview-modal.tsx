'use client'

export function DDLPreviewModal({ ddl, onClose }: { ddl: string; onClose: () => void }) {
  return (
    <div className="dialog-scrim" role="dialog" aria-modal="true" aria-label="PostgreSQL DDL preview">
      <div className="dialog-card">
        <h2 className="modeler-panel__title">PostgreSQL DDL</h2>
        <pre>{ddl}</pre>
        <div className="modeler-toolbar">
          <button className="modeler-toolbar__button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
