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

    return {
      // `manhattan` can fail intermittently for dense ER layouts.
      // Keep orthogonal routes stable by using `orth` consistently.
      router: { name: 'orth' as const },
      connector: { name: 'rounded' as const },
    }
  }
}
