import type { EditorAttributeSnapshot } from '@/modeler/types/editor-snapshot'

export class EditAttributesFormHandler {
  addAttribute(attributes: EditorAttributeSnapshot[]): EditorAttributeSnapshot[] {
    return [
      ...attributes,
      {
        id: `draft_attr_${crypto.randomUUID()}`,
        logicalName: '',
        physicalName: null,
        dataType: 'text',
        size: null,
        isNull: true,
        isPrimaryKey: false,
        isForeignKey: false,
        definition: null,
        example: null,
        domain: null,
      },
    ]
  }

  removeAttribute(attributes: EditorAttributeSnapshot[], attributeId: string): EditorAttributeSnapshot[] {
    return attributes.filter((attribute) => attribute.id !== attributeId)
  }
}
