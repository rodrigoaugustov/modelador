import { SVGModel } from '@/modeler/model/svg-model'
import type { TableTextAreaModel } from '@/modeler/model/table/table-text-area-model'

export class TableNameText extends SVGModel {
  physicalName: string | null = null

  constructor(
    public readonly tableNameArea: TableTextAreaModel,
    public logicalName: string,
    cssClass: string,
    factorId: string,
  ) {
    super(`${tableNameArea.tableModel.identification}_${factorId}`, tableNameArea.coordinate, cssClass)
  }
}
