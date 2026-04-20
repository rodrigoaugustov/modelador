import Dexie, { type Table } from 'dexie'

type LocalProjectRecord = {
  projectId: string
  snapshot: unknown
  updatedAt: string
}

class ProjectLocalDatabase extends Dexie {
  snapshots!: Table<LocalProjectRecord, string>

  constructor(name: string) {
    super(name)

    this.version(1).stores({
      snapshots: 'projectId,updatedAt',
    })
  }
}

export function createProjectLocalStore(name = 'data-modeler') {
  const db = new ProjectLocalDatabase(name)

  return {
    async save(projectId: string, snapshot: unknown) {
      await db.snapshots.put({
        projectId,
        snapshot,
        updatedAt: new Date().toISOString(),
      })
    },

    async get(projectId: string) {
      const record = await db.snapshots.get(projectId)
      return record?.snapshot ?? null
    },
  }
}
