import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EditAttributesModal } from '@/modeler/view/modal/edit-attributes-modal'

describe('EditAttributesModal', () => {
  it('allows promoting an attribute to a primary key and forces not null in the draft', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const initialTable = {
      id: 'table_orders',
      logicalName: 'orders',
      physicalName: 'orders',
      schema: 'public',
      coordinate: { x: 64, y: 64 },
      attributes: [
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
        {
          id: 'attr_orders_store_id',
          logicalName: 'store_id',
          physicalName: 'store_id',
          dataType: 'uuid',
          size: null,
          isNull: true,
          isPrimaryKey: false,
          isForeignKey: false,
          displayOrder: 1,
          definition: null,
          example: null,
          domain: null,
        },
      ],
    }

    render(
      <EditAttributesModal
        table={initialTable}
        onClose={() => undefined}
        onChange={onChange}
        onAddColumn={() => undefined}
        onRemoveAttribute={() => undefined}
        onApply={() => undefined}
      />,
    )

    await user.click(screen.getAllByRole('checkbox', { name: /primary key/i })[1])

    const updater = onChange.mock.calls.at(-1)?.[0]
    const nextTable = updater(initialTable)

    expect(nextTable.attributes[1].isPrimaryKey).toBe(true)
    expect(nextTable.attributes[1].isNull).toBe(false)
  })

  it('moves an attribute up from the modal controls', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const initialTable = {
      id: 'table_orders',
      logicalName: 'orders',
      physicalName: 'orders',
      schema: 'public',
      coordinate: { x: 64, y: 64 },
      attributes: [
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
        {
          id: 'attr_orders_store_id',
          logicalName: 'store_id',
          physicalName: 'store_id',
          dataType: 'uuid',
          size: null,
          isNull: false,
          isPrimaryKey: true,
          isForeignKey: false,
          displayOrder: 1,
          definition: null,
          example: null,
          domain: null,
        },
        {
          id: 'attr_orders_number',
          logicalName: 'number',
          physicalName: 'number',
          dataType: 'text',
          size: null,
          isNull: true,
          isPrimaryKey: false,
          isForeignKey: false,
          displayOrder: 2,
          definition: null,
          example: null,
          domain: null,
        },
      ],
    }

    render(
      <EditAttributesModal
        table={initialTable}
        onClose={() => undefined}
        onChange={onChange}
        onAddColumn={() => undefined}
        onRemoveAttribute={() => undefined}
        onApply={() => undefined}
      />,
    )

    await user.click(screen.getByRole('button', { name: /move number up/i }))

    const updater = onChange.mock.calls.at(-1)?.[0]
    const nextTable = updater(initialTable)

    expect(nextTable.attributes.map((attribute: { id: string }) => attribute.id)).toEqual([
      'attr_orders_id',
      'attr_orders_number',
      'attr_orders_store_id',
    ])
    expect(nextTable.attributes.map((attribute: { displayOrder: number }) => attribute.displayOrder)).toEqual([0, 1, 2])
  })

  it('keeps the physical name synchronized when editing the main column name field', async () => {
    const onChange = vi.fn()
    const initialTable = {
      id: 'table_orders',
      logicalName: 'orders',
      physicalName: 'orders',
      schema: 'public',
      coordinate: { x: 64, y: 64 },
      attributes: [
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
    }

    render(
      <EditAttributesModal
        table={initialTable}
        onClose={() => undefined}
        onChange={onChange}
        onAddColumn={() => undefined}
        onRemoveAttribute={() => undefined}
        onApply={() => undefined}
      />,
    )

    fireEvent.change(screen.getByLabelText('Column name'), { target: { value: 'branch_id' } })

    const updater = onChange.mock.calls.at(-1)?.[0]
    const nextTable = updater(initialTable)

    expect(nextTable.attributes[0].logicalName).toBe('branch_id')
    expect(nextTable.attributes[0].physicalName).toBe('branch_id')
  })

  it('renders the prototype-inspired columns grid and selected attribute details', async () => {
    const user = userEvent.setup()

    render(
      <EditAttributesModal
        table={{
          id: 'table_orders',
          logicalName: 'orders',
          physicalName: 'orders',
          schema: 'public',
          coordinate: { x: 64, y: 64 },
          attributes: [
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
              definition: 'Human-visible order number',
              example: 'PO-1001',
              domain: null,
            },
          ],
        }}
        onClose={() => undefined}
        onChange={() => undefined}
        onAddColumn={() => undefined}
        onRemoveAttribute={() => undefined}
        onApply={() => undefined}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'PK' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Not Null' })).toBeInTheDocument()

    await user.click(screen.getByRole('row', { name: /number text/i }))

    expect(screen.getByText(/column details/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description \/ comment/i)).toHaveValue('Human-visible order number')
  })
})
