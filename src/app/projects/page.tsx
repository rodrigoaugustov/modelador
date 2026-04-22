import Link from 'next/link'
import { projectService } from '@/server/persistence/project-service'

export default async function ProjectsPage() {
  const projects = await projectService.listProjects()

  return (
    <main className="home-page">
      <h1>Load Project</h1>
      <p>Open an existing model saved in the workspace database.</p>
      <div className="home-page__actions">
        <Link href="/projects/new">Create project</Link>
        <Link href="/">Back home</Link>
      </div>
      <section className="projects-list" aria-label="Saved projects">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="projects-list__item">
              <span className="projects-list__name">{project.name}</span>
              <span className="projects-list__meta">{project.updated_at ?? 'Saved project'}</span>
            </Link>
          ))
        ) : (
          <p className="modeler-panel__copy">No projects saved yet.</p>
        )}
      </section>
    </main>
  )
}
