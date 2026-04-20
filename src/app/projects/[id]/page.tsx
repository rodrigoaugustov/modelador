import { ModelerWorkspace } from '@/modeler/view/workspace/modeler-workspace'
import { projectService } from '@/server/persistence/project-service'

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await projectService.getProject(id)

  return <ModelerWorkspace projectId={id} initialProject={project} />
}
