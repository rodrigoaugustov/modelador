import type { EditorAttributeSnapshot } from '@/modeler/types/editor-snapshot'

export class EditAttributesFormHandler {
  private rewriteDisplayOrder(attributes: EditorAttributeSnapshot[]) {
    return attributes.map((attribute, index) => ({
      ...attribute,
      displayOrder: index,
    }))
  }

  addAttribute(attributes: EditorAttributeSnapshot[]): EditorAttributeSnapshot[] {
    return [
      ...attributes,
      {
        id: `draft_attr_${crypto.randomUUID()}`,
        logicalName: '',
        physicalName: null,
        dataType: 'text',
        size: null,
        displayOrder: attributes.length,
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
    return this.rewriteDisplayOrder(attributes.filter((attribute) => attribute.id !== attributeId))
  }

  updateAttribute(
    attributes: EditorAttributeSnapshot[],
    attributeId: string,
    patch: Partial<EditorAttributeSnapshot>,
  ): EditorAttributeSnapshot[] {
    return attributes.map((attribute) =>
      attribute.id === attributeId
        ? {
            ...attribute,
            ...patch,
            isNull: patch.isPrimaryKey ? false : (patch.isNull ?? attribute.isNull),
          }
        : attribute,
    )
  }
}
