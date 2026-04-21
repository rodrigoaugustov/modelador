import { ProjectRepository } from '@/server/persistence/project-repository'
import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'

export const projectService = {
  async listProjects() {
    return ProjectRepository.list()
  },

  async createProject(input: { name: string; description?: string }) {
    return ProjectRepository.create(input)
  },

  async getProject(id: string) {
    return ProjectRepository.getById(id)
  },

  async saveWorkingSnapshot(id: string, snapshot: EditorProjectSnapshot) {
    return ProjectRepository.saveWorkingSnapshot(id, snapshot)
  },
}
