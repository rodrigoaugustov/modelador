import { describe, expect, it } from 'vitest'
import { ProjectModel } from '@/modeler/model/project-model'
import { serializeProjectModel } from '@/modeler/util/model-serializer'

describe('serializeProjectModel', () => {
  it('serializes a project into canonical JSON', () => {
    const project = ProjectModel.create({ id: 'proj_1', name: 'Sales Model' })
    const serialized = serializeProjectModel(project)

    expect(serialized.project.id).toBe('proj_1')
    expect(serialized.model.tables).toEqual([])
    expect(serialized.model.relationships).toEqual([])
  })
})
