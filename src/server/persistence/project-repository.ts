import { createSupabaseServerClient } from '@/lib/supabase/server'
import { buildEmptyProjectSnapshot, type EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'

const supabase = createSupabaseServerClient()

export const ProjectRepository = {
  async list() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    return data ?? []
  },

  async create(input: { name: string; description?: string }) {
    const id = crypto.randomUUID()
    const snapshot = buildEmptyProjectSnapshot({
      id,
      name: input.name,
      description: input.description ?? '',
    })

    const { data, error } = await supabase
      .from('projects')
      .insert({
        id,
        name: input.name,
        description: input.description ?? '',
        working_snapshot_json: snapshot,
      })
      .select('id, name, description, current_version')
      .single()

    if (error) {
      throw error
    }

    return data
  },

  async getById(id: string): Promise<EditorProjectSnapshot> {
    const { data, error } = await supabase
      .from('projects')
      .select('working_snapshot_json')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return data.working_snapshot_json
  },

  async saveWorkingSnapshot(id: string, snapshot: EditorProjectSnapshot) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        working_snapshot_json: snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, description, current_version, working_snapshot_json')
      .single()

    if (error) {
      throw error
    }

    return data
  },
}
