export function ProjectSidebar({ project }: { project: { name: string } }) {
  return (
    <aside className="modeler-panel">
      <p className="modeler-panel__eyebrow">Workspace</p>
      <h2 className="modeler-panel__title">{project.name}</h2>
      <p className="modeler-panel__copy">
        Curate entities and relationships with a quiet, high-contrast workspace.
      </p>
      <div className="modeler-toolbar">
        <button className="modeler-toolbar__button" type="button">
          Add table
        </button>
        <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button">
          Generate DDL
        </button>
      </div>
    </aside>
  )
}
