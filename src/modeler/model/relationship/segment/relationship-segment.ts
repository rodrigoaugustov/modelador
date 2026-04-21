import { Vertex } from '@/modeler/model/vertex'

export class RelationshipSegment {
  constructor(
    public readonly source: Vertex,
    public readonly target: Vertex,
    public readonly label: string,
  ) {}
}
