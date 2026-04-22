import type { EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export class CreateTableFormHandler {
  createDraft(): Omit<EditorTableSnapshot, 'id' | 'coordinate'> {
    return {
      logicalName: '',
      physicalName: null,
      schema: 'public',
      attributes: [],
    }
  }
}
