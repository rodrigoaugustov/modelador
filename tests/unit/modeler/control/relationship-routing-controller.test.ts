import { describe, expect, it } from 'vitest'
import { RelationshipRoutingController } from '@/modeler/control/handler/relationship/relationship-routing-controller'

describe('RelationshipRoutingController', () => {
  it('maps orthogonal style to a stable orth route', () => {
    const controller = new RelationshipRoutingController()

    expect(controller.resolveEdgeGeometry('orthogonal')).toEqual({
      router: { name: 'orth' },
      connector: { name: 'rounded' },
    })
  })

  it('keeps orth routing when orthogonal edges have manual vertices', () => {
    const controller = new RelationshipRoutingController()

    expect(controller.resolveEdgeGeometry('orthogonal', [{ x: 120, y: 80 }])).toEqual({
      router: { name: 'orth' },
      connector: { name: 'rounded' },
    })
  })

  it('maps straight and curved styles to the expected connectors', () => {
    const controller = new RelationshipRoutingController()

    expect(controller.resolveEdgeGeometry('straight')).toEqual({
      router: { name: 'normal' },
      connector: { name: 'normal' },
    })
    expect(controller.resolveEdgeGeometry('curved')).toEqual({
      router: { name: 'normal' },
      connector: { name: 'smooth' },
    })
  })
})
