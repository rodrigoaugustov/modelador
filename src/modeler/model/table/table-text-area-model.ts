import { SVGModel } from '@/modeler/model/svg-model'
import type { TableModel } from '@/modeler/model/table/table-model'

export class TableTextAreaModel extends SVGModel {
  constructor(
    public readonly tableModel: TableModel,
    public readonly tableTextAreaAbove: TableTextAreaModel | null,
    cssClass: string,
    areaObjectTypeId: string,
  ) {
    super(`${tableModel.identification}_${areaObjectTypeId}`, tableModel.coordinate, cssClass)
  }
}
