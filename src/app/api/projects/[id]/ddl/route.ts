import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'
import { projectService } from '@/server/persistence/project-service'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json()
  const project = body.snapshot ?? (await projectService.getProject(id))
  const ddl = generatePostgresDDL(project)

  return Response.json({ ddl })
}
