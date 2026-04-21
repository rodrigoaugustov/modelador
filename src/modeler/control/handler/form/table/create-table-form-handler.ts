import type { EditorAttributeSnapshot, EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export class CreateTableFormHandler {
  createDraft(): Omit<EditorTableSnapshot, 'id' | 'coordinate'> {
    const idAttribute: EditorAttributeSnapshot = {
      id: 'draft_attr_id',
      logicalName: 'id',
      physicalName: 'id',
      dataType: 'uuid',
      size: null,
      isNull: false,
      isPrimaryKey: true,
      isForeignKey: false,
      definition: null,
      example: null,
      domain: null,
    }

    return {
      logicalName: '',
      physicalName: null,
      schema: 'public',
      attributes: [idAttribute],
    }
  }
}
