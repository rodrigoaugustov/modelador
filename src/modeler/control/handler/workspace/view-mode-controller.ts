import { ViewMode } from '@/modeler/enum/view-mode'

export class ViewModeController {
  toggle(mode: ViewMode) {
    return mode === ViewMode.Logical ? ViewMode.Physical : ViewMode.Logical
  }
}
