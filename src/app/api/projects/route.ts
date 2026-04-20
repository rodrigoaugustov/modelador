import { projectService } from '@/server/persistence/project-service'

export async function GET() {
  const projects = await projectService.listProjects()
  return Response.json({ projects })
}

export async function POST(request: Request) {
  const body = await request.json()
  const project = await projectService.createProject({
    name: body.name,
    description: body.description,
  })

  return Response.json({ project }, { status: 201 })
}
