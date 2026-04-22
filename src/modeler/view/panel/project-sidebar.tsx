import Link from 'next/link'

export function ProjectSidebar({
  project,
  onSaveProject,
  isSavingProject,
  saveFeedback,
}: {
  project: { name: string }
  onSaveProject: () => void
  isSavingProject: boolean
  saveFeedback: string | null
}) {
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
        <Link href="/projects/new" className="modeler-sidebar__tool modeler-sidebar__tool--active">
          <span className="modeler-sidebar__tool-label">Novo Projeto</span>
        </Link>
        <button className="modeler-sidebar__tool" type="button" onClick={onSaveProject} disabled={isSavingProject}>
          <span className="modeler-sidebar__tool-label">{isSavingProject ? 'Salvando...' : 'Salvar Projeto'}</span>
        </button>
        <Link href="/projects" className="modeler-sidebar__tool">
          <span className="modeler-sidebar__tool-label">Carregar Projeto</span>
        </Link>
      </nav>
      {saveFeedback ? <p className="modeler-panel__copy">{saveFeedback}</p> : null}
    </aside>
  )
}
