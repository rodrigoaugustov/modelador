export function ProjectSidebar({ project }: { project: { name: string } }) {
  return (
    <aside className="modeler-panel">
      <div className="modeler-sidebar__brand">
        <h1 className="modeler-sidebar__brand-title">DataArchitect</h1>
        <p className="modeler-panel__copy">Digital blueprint editor for PostgreSQL-first modeling.</p>
      </div>
      <div className="property-card">
        <p className="modeler-panel__eyebrow">Workspace</p>
        <h2 className="modeler-panel__title">{project.name}</h2>
        <p className="modeler-panel__copy">
          Curate entities and relationships with quieter panels and a clearer canvas focus.
        </p>
      </div>
      <nav className="modeler-sidebar__nav" aria-label="Workspace tools">
        <button className="modeler-sidebar__tool modeler-sidebar__tool--active" type="button">
          <span className="modeler-sidebar__tool-label">Table</span>
        </button>
        <button className="modeler-sidebar__tool" type="button">
          <span className="modeler-sidebar__tool-label">Relation</span>
        </button>
        <button className="modeler-sidebar__tool" type="button">
          <span className="modeler-sidebar__tool-label">History</span>
        </button>
      </nav>
    </aside>
  )
}
