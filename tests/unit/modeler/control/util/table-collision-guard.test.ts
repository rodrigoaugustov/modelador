import { describe, expect, it } from 'vitest'
import { TableCollisionGuard } from '@/modeler/control/util/table-collision-guard'

describe('TableCollisionGuard', () => {
  it('nudges a moved table away from an occupied rectangle', () => {
    const guard = new TableCollisionGuard()

    const next = guard.resolve({
      moving: { x: 160, y: 160, width: 320, height: 160 },
      occupied: [{ x: 120, y: 120, width: 320, height: 160 }],
    })

    expect(next).not.toEqual({ x: 160, y: 160 })
  })

  it('keeps the position unchanged when there is no overlap', () => {
    const guard = new TableCollisionGuard()

    const next = guard.resolve({
      moving: { x: 480, y: 320, width: 320, height: 160 },
      occupied: [{ x: 120, y: 120, width: 320, height: 160 }],
    })

    expect(next).toEqual({ x: 480, y: 320 })
  })
})
