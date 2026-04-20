import { describe, expect, it, vi } from 'vitest'
import { GET as listProjects, POST as createProject } from '@/app/api/projects/route'

vi.mock('@/server/persistence/project-service', () => ({
  projectService: {
    listProjects: vi.fn().mockResolvedValue([{ id: 'proj_1', name: 'Sales Model' }]),
    createProject: vi.fn().mockResolvedValue({ id: 'proj_1', name: 'Sales Model' }),
  },
}))

describe('/api/projects', () => {
  it('lists projects', async () => {
    const response = await listProjects()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.projects).toHaveLength(1)
  })

  it('creates a project', async () => {
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sales Model' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await createProject(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.project.id).toBe('proj_1')
  })
})
