import { render, screen } from '@testing-library/react'
import { ModelerWorkspace } from '@/modeler/view/workspace/modeler-workspace'

describe('ModelerWorkspace', () => {
  it('renders the canvas host and project panels', () => {
    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales' },
          model: { tables: [], relationships: [] },
        }}
      />,
    )

    expect(screen.getByTestId('modeler-canvas')).toBeInTheDocument()
    expect(screen.getByText(/sales/i)).toBeInTheDocument()
  })

  it('renders schema-card style table details for attributes in test mode', () => {
    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales' },
          model: {
            tables: [
              {
                id: 'table_users',
                logicalName: 'users',
                physicalName: null,
                schema: 'public',
                coordinate: { x: 64, y: 64 },
                attributes: [
                  {
                    id: 'attr_users_id',
                    logicalName: 'id',
                    physicalName: null,
                    dataType: 'uuid',
                    size: null,
                    isNull: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                    definition: null,
                    example: null,
                    domain: null,
                  },
                ],
              },
            ],
            relationships: [],
          },
        }}
      />,
    )

    expect(screen.getByText(/users/i)).toBeInTheDocument()
    expect(screen.getByText(/id/i)).toBeInTheDocument()
  })
})
