import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'
import { projectService } from '@/server/persistence/project-service'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const project = body.snapshot ?? (await projectService.getProject(id))
    const ddl = generatePostgresDDL(project)

    return Response.json({ ddl })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to generate DDL',
      },
      { status: 400 },
    )
  }
}
