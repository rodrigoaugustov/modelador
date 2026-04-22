import { expect, test, type Page } from '@playwright/test'

async function createProject(page: Page, name: string) {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill(name)
  await page.getByRole('button', { name: /create/i }).click()
}

async function createTable(page: Page, tableName: string) {
  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill(tableName)
  await page.getByRole('button', { name: /create table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(new RegExp(tableName, 'i'))).toBeVisible()
}

async function addColumns(page: Page, columns: Array<{ name: string; dataType: string }>) {
  await page.getByRole('button', { name: /edit attributes/i }).click()

  for (const column of columns) {
    await page.getByRole('button', { name: /add column/i }).click()
    await page.getByLabel('Column name').last().fill(column.name)
    await page.getByLabel('Data type').last().selectOption(column.dataType)
  }

  await page.getByRole('button', { name: /apply schema changes/i }).click()
}

async function createRelationship(
  page: Page,
  input: {
    primaryTable: string
    secondaryTable: string
    primaryAttribute: string
    secondaryAttribute: string
  },
) {
  const relationshipDialog = page.locator('[aria-label="Configure relationship dialog"]')
  const configureRelationshipButton = page.getByRole('button', { name: /configure relationship/i })

  if (!(await configureRelationshipButton.isVisible())) {
    await page.getByTestId('modeler-canvas').getByText(new RegExp(input.primaryTable, 'i')).click({ force: true })
  }

  await page.getByRole('button', { name: /configure relationship/i }).click()
  await page.getByLabel('Primary table').selectOption({ label: input.primaryTable })
  await page.getByLabel('Secondary table').selectOption({ label: input.secondaryTable })
  await page.getByLabel('Primary attribute').selectOption({ label: input.primaryAttribute })
  await page.getByLabel('Secondary attribute').selectOption({ label: input.secondaryAttribute })
  await relationshipDialog.getByRole('button', { name: /create relationship/i }).click()
  await expect(relationshipDialog).toHaveCount(0)
}

test('user completes the live usability flow across tables, attributes, relationships, drag, and deletion', async ({
  page,
}) => {
  await createProject(page, 'Usability Validation Model')

  await createTable(page, 'users')
  await addColumns(page, [
    { name: 'id', dataType: 'uuid' },
    { name: 'email', dataType: 'text' },
  ])
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByLabel('Primary key').first().check()
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/email/i)).toBeVisible()

  await createTable(page, 'orders')
  await addColumns(page, [
    { name: 'id', dataType: 'uuid' },
    { name: 'user_id', dataType: 'uuid' },
  ])
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByLabel('Primary key').first().check()
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/user_id/i)).toBeVisible()

  await createTable(page, 'order_items')
  await addColumns(page, [
    { name: 'id', dataType: 'uuid' },
    { name: 'order_id', dataType: 'uuid' },
    { name: 'sku', dataType: 'text' },
  ])
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByLabel('Primary key').first().check()
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/order_id/i)).toBeVisible()
  await expect(page.getByTestId('modeler-canvas').getByText(/sku/i)).toBeVisible()

  await createRelationship(page, {
    primaryTable: 'users',
    secondaryTable: 'orders',
    primaryAttribute: 'users.id',
    secondaryAttribute: 'orders.user_id',
  })

  await createRelationship(page, {
    primaryTable: 'orders',
    secondaryTable: 'order_items',
    primaryAttribute: 'orders.id',
    secondaryAttribute: 'order_items.order_id',
  })

  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.x6-edge').length)).toBe(2)

  await page.getByTestId('modeler-canvas').getByText(/order_items/i).click({ force: true })
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /delete attribute/i }).last().click()
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/sku/i)).toHaveCount(0)

  const connectedNode = page.locator('.x6-node').first()
  const connectedNodeBox = await connectedNode.boundingBox()

  if (!connectedNodeBox) {
    throw new Error('Expected a connected node to have a bounding box before dragging')
  }

  await page.mouse.move(
    connectedNodeBox.x + connectedNodeBox.width / 2,
    connectedNodeBox.y + connectedNodeBox.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    connectedNodeBox.x + connectedNodeBox.width / 2 + 140,
    connectedNodeBox.y + connectedNodeBox.height / 2 + 90,
    { steps: 14 },
  )
  await page.mouse.up()

  await expect
    .poll(async () => {
      const currentBox = await connectedNode.boundingBox()
      return currentBox ? Math.hypot(currentBox.x - connectedNodeBox.x, currentBox.y - connectedNodeBox.y) : 0
    })
    .toBeGreaterThan(30)

  await page.getByRole('button', { name: /delete table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/order_items/i)).toHaveCount(0)
  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.x6-edge').length)).toBe(1)

  await page.getByRole('button', { name: /generate ddl/i }).click()
  await expect(page.getByText(/create table public\.users/i)).toBeVisible()
  await expect(page.getByText(/create table public\.orders/i)).toBeVisible()
  await expect(page.getByText(/create table public\.order_items/i)).toHaveCount(0)
  await expect(page.getByText(/foreign key \(user_id\) references public\.users \(id\)/i)).toBeVisible()
})
