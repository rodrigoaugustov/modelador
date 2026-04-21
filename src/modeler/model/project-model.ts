import { RelationshipModel } from '@/modeler/model/relationship/relationship-model'
import { TableModel } from '@/modeler/model/table/table-model'

type CreateProjectArgs = {
  id: string
  name: string
  description?: string
}

export class ProjectModel {
  static create(args: CreateProjectArgs) {
    return new ProjectModel(args.id, args.name, args.description ?? '')
  }

  readonly tables = new Map<string, TableModel>()
  readonly relationships = new Map<string, RelationshipModel>()

  private constructor(
    public readonly id: string,
    public name: string,
    public description: string,
  ) {}
}
