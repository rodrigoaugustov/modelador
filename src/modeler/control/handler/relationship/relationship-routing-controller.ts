import type { RelationshipLineStyle } from '@/modeler/enum/relationship-line-style'

export class RelationshipRoutingController {
  resolveEdgeGeometry(
    style: RelationshipLineStyle,
    vertices: Array<{ x: number; y: number }> = [],
  ) {
    if (style === 'straight') {
      return {
        router: { name: 'normal' as const },
        connector: { name: 'normal' as const },
      }
    }

    if (style === 'curved') {
      return {
        router: { name: 'normal' as const },
        connector: { name: 'smooth' as const },
      }
    }

    if (vertices.length > 0) {
      return {
        router: { name: 'orth' as const },
        connector: { name: 'rounded' as const },
      }
    }

    return {
      router: { name: 'manhattan' as const, args: { padding: 24 } },
      connector: { name: 'rounded' as const },
    }
  }
}
