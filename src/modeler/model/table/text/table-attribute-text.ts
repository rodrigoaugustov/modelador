import { SVGModel } from '@/modeler/model/svg-model'
import type { TableTextAreaModel } from '@/modeler/model/table/table-text-area-model'

export class TableAttributeText extends SVGModel {
  logicalName: string | null = null
  physicalName: string | null = null
  isNull: boolean | null = null
  definition: string | null = null
  example: string | null = null
  domain: string | null = null
  dataType: string | null = null
  size: string | null = null
  isPrimaryKey: boolean | null = null
  isForeignKey: boolean | null = null

  constructor(
    public readonly tableTextArea: TableTextAreaModel,
    cssClass: string,
    factorId: string,
  ) {
    super(`${tableTextArea.tableModel.identification}_${factorId}`, tableTextArea.coordinate, cssClass)
  }
}
