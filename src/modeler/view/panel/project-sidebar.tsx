export function ProjectSidebar({ project }: { project: { name: string } }) {
  return (
    <aside className="modeler-panel">
      <p className="modeler-panel__eyebrow">Workspace</p>
      <h2 className="modeler-panel__title">{project.name}</h2>
      <p className="modeler-panel__copy">
        Curate entities and relationships with a quiet, high-contrast workspace.
      </p>
      <p className="modeler-panel__copy">Surface hierarchy, blueprint canvas, and PostgreSQL-first modeling.</p>
    </aside>
  )
}
