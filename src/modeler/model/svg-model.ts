import { Vertex } from '@/modeler/model/vertex'

export abstract class SVGModel {
  protected constructor(
    public readonly identification: string,
    public coordinate: Vertex,
    public cssClass: string,
    public visualElementRef: string | null = null,
  ) {}
}
