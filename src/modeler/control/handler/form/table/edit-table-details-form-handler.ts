import type { EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export class EditTableDetailsFormHandler {
  apply(
    table: EditorTableSnapshot,
    patch: Pick<EditorTableSnapshot, 'logicalName' | 'physicalName' | 'schema'>,
  ): EditorTableSnapshot {
    return {
      ...table,
      logicalName: patch.logicalName,
      physicalName: patch.physicalName,
      schema: patch.schema,
    }
  }
}
