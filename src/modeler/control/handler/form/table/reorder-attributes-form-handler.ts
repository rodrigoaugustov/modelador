import type { EditorAttributeSnapshot } from '@/modeler/types/editor-snapshot'

export class ReorderAttributesFormHandler {
  private normalize(attributes: EditorAttributeSnapshot[]) {
    return attributes.map((attribute, index) => ({
      ...attribute,
      displayOrder: index,
    }))
  }

  moveUp(attributes: EditorAttributeSnapshot[], attributeId: string): EditorAttributeSnapshot[] {
    const index = attributes.findIndex((attribute) => attribute.id === attributeId)

    if (index <= 0) {
      return this.normalize(attributes)
    }

    const next = [...attributes]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]

    return this.normalize(next)
  }

  moveDown(attributes: EditorAttributeSnapshot[], attributeId: string): EditorAttributeSnapshot[] {
    const index = attributes.findIndex((attribute) => attribute.id === attributeId)

    if (index === -1 || index >= attributes.length - 1) {
      return this.normalize(attributes)
    }

    const next = [...attributes]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]

    return this.normalize(next)
  }
}
