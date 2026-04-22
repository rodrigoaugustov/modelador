import Link from 'next/link'
import { projectService } from '@/server/persistence/project-service'
import { ProjectPicker } from '@/app/projects/project-picker'

export const dynamic = 'force-dynamic'

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
      {projects.length > 0 ? (
        <ProjectPicker projects={projects} />
      ) : (
        <p className="modeler-panel__copy">No projects saved yet.</p>
      )}
    </main>
  )
}
