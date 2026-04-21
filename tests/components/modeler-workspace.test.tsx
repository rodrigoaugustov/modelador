import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('shows the table details action after selecting a schema card in test mode', async () => {
    const user = userEvent.setup()

    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales', description: '' },
          model: {
            tables: [
              {
                id: 'table_users',
                logicalName: 'users',
                physicalName: 'tb_users',
                schema: 'public',
                coordinate: { x: 64, y: 64 },
                attributes: [],
              },
            ],
            relationships: [],
          },
          diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
          metadata: { viewMode: 'logical', postgresVersion: 'default' },
        }}
      />,
    )

    await user.click(screen.getByText(/^users$/i))

    await user.click(screen.getByRole('button', { name: /edit table details/i }))

    expect(screen.getByRole('heading', { name: /edit table details:/i })).toBeInTheDocument()
  })

  it('renders physical names when the snapshot metadata is in physical mode', () => {
    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales', description: '' },
          model: {
            tables: [
              {
                id: 'table_users',
                logicalName: 'users',
                physicalName: 'tb_users',
                schema: 'public',
                coordinate: { x: 72, y: 72 },
                attributes: [
                  {
                    id: 'attr_users_id',
                    logicalName: 'id',
                    physicalName: 'user_id',
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
          diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
          metadata: { viewMode: 'physical', postgresVersion: 'default' },
        }}
      />,
    )

    expect(screen.getByText(/tb_users/i)).toBeInTheDocument()
    expect(screen.getByText(/user_id/i)).toBeInTheDocument()
  })

  it('allows editing and deleting a relationship from the property panel in test mode', async () => {
    const user = userEvent.setup()

    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales', description: '' },
          model: {
            tables: [
              {
                id: 'table_users',
                logicalName: 'users',
                physicalName: 'tb_users',
                schema: 'public',
                coordinate: { x: 72, y: 72 },
                attributes: [
                  {
                    id: 'attr_users_id',
                    logicalName: 'id',
                    physicalName: 'user_id',
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
              {
                id: 'table_orders',
                logicalName: 'orders',
                physicalName: 'tb_orders',
                schema: 'public',
                coordinate: { x: 320, y: 72 },
                attributes: [
                  {
                    id: 'attr_orders_user_id',
                    logicalName: 'user_id',
                    physicalName: 'user_id',
                    dataType: 'uuid',
                    size: null,
                    isNull: false,
                    isPrimaryKey: false,
                    isForeignKey: true,
                    definition: null,
                    example: null,
                    domain: null,
                  },
                ],
              },
            ],
            relationships: [
              {
                id: 'rel_users_orders',
                primaryTableId: 'table_users',
                secondaryTableId: 'table_orders',
                primaryAttributeId: 'attr_users_id',
                secondaryAttributeId: 'attr_orders_user_id',
                relationshipType: 'one-to-many',
                onDelete: 'cascade',
                onUpdate: 'cascade',
                enforceConstraint: true,
              },
            ],
          },
          diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
          metadata: { viewMode: 'logical', postgresVersion: 'default' },
        }}
      />,
    )

    await user.click(screen.getByText(/users → orders/i))
    await user.click(screen.getByRole('button', { name: /edit relationship/i }))

    expect(screen.getByLabelText('On delete')).toHaveValue('cascade')

    await user.selectOptions(screen.getByLabelText('On delete'), 'restrict')
    await user.click(screen.getByRole('button', { name: /save relationship/i }))

    await user.click(screen.getByText(/users → orders/i))
    await user.click(screen.getByRole('button', { name: /delete relationship/i }))

    expect(screen.queryByText(/users → orders/i)).not.toBeInTheDocument()
  })
})
