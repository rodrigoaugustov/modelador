import { describe, expect, it } from 'vitest'
import { ViewMode } from '@/modeler/enum/view-mode'
import { ViewModeController } from '@/modeler/control/handler/workspace/view-mode-controller'

describe('ViewModeController', () => {
  it('switches from logical to physical mode', () => {
    const controller = new ViewModeController()

    expect(controller.toggle(ViewMode.Logical)).toBe(ViewMode.Physical)
  })
})
