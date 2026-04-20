import { projectService } from '@/server/persistence/project-service'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const project = await projectService.getProject(id)

  return Response.json({ project })
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json()
  const project = await projectService.saveWorkingSnapshot(id, body.snapshot)

  return Response.json({ project })
}
