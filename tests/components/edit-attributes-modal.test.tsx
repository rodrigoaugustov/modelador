import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EditAttributesModal } from '@/modeler/view/modal/edit-attributes-modal'

describe('EditAttributesModal', () => {
  it('allows promoting an attribute to a primary key and forces not null in the draft', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

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
        }}
        onClose={() => undefined}
        onChange={onChange}
        onAddColumn={() => undefined}
        onRemoveAttribute={() => undefined}
        onApply={() => undefined}
      />,
    )

    await user.click(screen.getAllByRole('checkbox', { name: /primary key/i })[1])

    const nextTable = onChange.mock.calls.at(-1)?.[0]

    expect(nextTable.attributes[1].isPrimaryKey).toBe(true)
    expect(nextTable.attributes[1].isNull).toBe(false)
  })

  it('moves an attribute up from the modal controls', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

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
        }}
        onClose={() => undefined}
        onChange={onChange}
        onAddColumn={() => undefined}
        onRemoveAttribute={() => undefined}
        onApply={() => undefined}
      />,
    )

    await user.click(screen.getByRole('button', { name: /move number up/i }))

    const nextTable = onChange.mock.calls.at(-1)?.[0]

    expect(nextTable.attributes.map((attribute: { id: string }) => attribute.id)).toEqual([
      'attr_orders_id',
      'attr_orders_number',
      'attr_orders_store_id',
    ])
    expect(nextTable.attributes.map((attribute: { displayOrder: number }) => attribute.displayOrder)).toEqual([0, 1, 2])
  })
})
