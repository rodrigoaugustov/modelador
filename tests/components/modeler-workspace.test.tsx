import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
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
                    displayOrder: 0,
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
                    displayOrder: 0,
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
                    displayOrder: 0,
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
                    displayOrder: 0,
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

    await user.click(screen.getByText(/users/i, { selector: '.relationship-card__header' }))
    await user.click(screen.getByRole('button', { name: /edit relationship/i }))

    expect(screen.getByLabelText('On delete')).toHaveValue('cascade')

    await user.selectOptions(screen.getByLabelText('On delete'), 'restrict')
    await user.click(screen.getByRole('button', { name: /save relationship/i }))

    await user.click(screen.getByText(/users/i, { selector: '.relationship-card__header' }))
    await user.click(screen.getByRole('button', { name: /delete relationship/i }))

    expect(screen.queryByText(/users/i, { selector: '.relationship-card__header' })).not.toBeInTheDocument()
  })

  it('shows a validation error when ddl generation fails', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Relationship products.code -> orders.product_id must reference a primary key parent column',
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales', description: '' },
          model: { tables: [], relationships: [] },
          diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
          metadata: { viewMode: 'logical', postgresVersion: 'default' },
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /generate ddl/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /relationship products\.code -> orders\.product_id must reference a primary key parent column/i,
    )

    vi.unstubAllGlobals()
  })

  it('renders table attributes using displayOrder instead of raw array order', () => {
    const { container } = render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales', description: '' },
          model: {
            tables: [
              {
                id: 'table_orders',
                logicalName: 'orders',
                physicalName: 'tb_orders',
                schema: 'public',
                coordinate: { x: 72, y: 72 },
                attributes: [
                  {
                    id: 'attr_orders_number',
                    logicalName: 'number',
                    physicalName: 'number',
                    dataType: 'text',
                    size: null,
                    isNull: true,
                    isPrimaryKey: false,
                    isForeignKey: false,
                    displayOrder: 1,
                    definition: null,
                    example: null,
                    domain: null,
                  },
                  {
                    id: 'attr_orders_id',
                    logicalName: 'id',
                    physicalName: 'id',
                    dataType: 'uuid',
                    size: null,
                    isNull: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                    displayOrder: 0,
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
          metadata: { viewMode: 'logical', postgresVersion: 'default' },
        }}
      />,
    )

    const rows = Array.from(container.querySelectorAll('.schema-card__body > div')).map((node) => node.textContent?.trim())

    expect(rows).toEqual(['id UUID', 'number TEXT'])
  })

  it('opens a prefilled relationship modal when dragging from one table handle to another', () => {
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
                physicalName: 'users',
                schema: 'public',
                coordinate: { x: 72, y: 72 },
                attributes: [
                  {
                    id: 'attr_users_id',
                    logicalName: 'id',
                    physicalName: 'id',
                    dataType: 'uuid',
                    size: null,
                    isNull: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                    displayOrder: 0,
                    definition: null,
                    example: null,
                    domain: null,
                  },
                ],
              },
              {
                id: 'table_orders',
                logicalName: 'orders',
                physicalName: 'orders',
                schema: 'public',
                coordinate: { x: 392, y: 72 },
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
                    displayOrder: 0,
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
          metadata: { viewMode: 'logical', postgresVersion: 'default' },
        }}
      />,
    )

    fireEvent.click(screen.getByText(/^users$/i))
    fireEvent.mouseDown(screen.getByLabelText('Create relationship from users'))
    fireEvent.mouseUp(screen.getByLabelText('Create relationship to orders'))

    expect(screen.getByRole('heading', { name: /configure relationship/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Primary table')).toHaveValue('table_users')
    expect(screen.getByLabelText('Secondary table')).toHaveValue('table_orders')
  })

  it('positions adjacent relationship handles without overlap', () => {
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
                physicalName: 'users',
                schema: 'public',
                coordinate: { x: 72, y: 72 },
                attributes: [],
              },
              {
                id: 'table_orders',
                logicalName: 'orders',
                physicalName: 'orders',
                schema: 'public',
                coordinate: { x: 392, y: 72 },
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

    fireEvent.click(screen.getByText(/^users$/i))

    const sourceHandle = screen.getByLabelText('Create relationship from users')
    fireEvent.mouseDown(sourceHandle)
    const targetHandle = screen.getByLabelText('Create relationship to orders')

    expect(sourceHandle).not.toHaveStyle({
      left: targetHandle.getAttribute('style')?.match(/left:\s*([^;]+)/)?.[1] ?? '',
      top: targetHandle.getAttribute('style')?.match(/top:\s*([^;]+)/)?.[1] ?? '',
    })
  })

  it('keeps global actions in the canvas toolbar while the right rail stays contextual', () => {
    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales', description: '' },
          model: { tables: [], relationships: [] },
          diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
          metadata: { viewMode: 'logical', postgresVersion: 'default' },
        }}
      />,
    )

    const globalActions = screen.getByLabelText('Global actions')

    expect(globalActions).toContainElement(screen.getByRole('button', { name: /add table/i }))
    expect(globalActions).toContainElement(screen.getByRole('button', { name: /generate ddl/i }))
    expect(screen.getByText(/select a table or relationship/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit table details/i })).not.toBeInTheDocument()
  })

  it('marks the selected schema card visibly in test mode', async () => {
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
                physicalName: 'users',
                schema: 'public',
                coordinate: { x: 72, y: 72 },
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

    expect(screen.getByText(/^users$/i).closest('[data-selected="true"]')).not.toBeNull()
  })
})
