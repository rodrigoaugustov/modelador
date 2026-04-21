import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ConfigureRelationshipModal } from '@/modeler/view/modal/configure-relationship-modal'

describe('ConfigureRelationshipModal', () => {
  it('limits constrained parent choices to primary keys and normalizes legacy drafts', async () => {
    const onChange = vi.fn()

    render(
      <ConfigureRelationshipModal
        draft={{
          id: 'rel_products_orders',
          primaryTableId: 'table_products',
          secondaryTableId: 'table_orders',
          attributeMappings: [
            {
              id: 'map_products_orders_product_id',
              primaryAttributeId: 'attr_products_code',
              secondaryAttributeId: 'attr_orders_product_id',
            },
          ],
          relationshipType: 'one-to-many',
          onDelete: 'cascade',
          onUpdate: 'cascade',
          enforceConstraint: true,
        }}
        tables={[
          {
            id: 'table_products',
            logicalName: 'products',
            physicalName: 'products',
            schema: 'public',
            coordinate: { x: 0, y: 0 },
            attributes: [
              {
                id: 'attr_products_code',
                logicalName: 'code',
                physicalName: 'code',
                dataType: 'integer',
                size: null,
                displayOrder: 0,
                isNull: false,
                isPrimaryKey: false,
                isForeignKey: false,
                definition: null,
                example: null,
                domain: null,
              },
              {
                id: 'attr_products_id',
                logicalName: 'id',
                physicalName: 'id',
                dataType: 'uuid',
                size: null,
                displayOrder: 1,
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
            physicalName: 'orders',
            schema: 'public',
            coordinate: { x: 320, y: 0 },
            attributes: [
              {
                id: 'attr_orders_product_id',
                logicalName: 'product_id',
                physicalName: 'product_id',
                dataType: 'uuid',
                size: null,
                displayOrder: 0,
                isNull: false,
                isPrimaryKey: false,
                isForeignKey: true,
                definition: null,
                example: null,
                domain: null,
              },
            ],
          },
        ]}
        onClose={() => undefined}
        onChange={onChange}
        onSubmit={() => undefined}
      />,
    )

    expect(screen.queryByRole('option', { name: 'products.code' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'products.id' })).toBeInTheDocument()

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          attributeMappings: [
            expect.objectContaining({
              primaryAttributeId: 'attr_products_id',
            }),
          ],
        }),
      ),
    )
  })
})
