import { expect, test } from '@playwright/test'

test('user creates a project, edits a model, saves, reopens, and generates ddl', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Sales Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await expect(page.getByRole('heading', { name: /create new table/i })).toBeVisible()
  await expect(page.getByLabel('Column name').first()).toHaveValue('id')
  await page.getByLabel('Table Name').fill('users')
  await page.getByRole('button', { name: /create table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/users/i)).toBeVisible()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill('email')
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await expect(page.getByRole('heading', { name: /edit attributes:/i })).toHaveCount(0)
  await page.reload()
  await expect(page.getByTestId('modeler-canvas').getByText(/email/i)).toBeVisible()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('orders')
  await page.getByRole('button', { name: /create table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/orders/i)).toBeVisible()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill('user_id')
  await page.getByLabel('Data type').last().fill('uuid')
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/user_id/i)).toBeVisible()

  await page.getByRole('button', { name: /configure relationship/i }).click()
  await page.getByLabel('Primary table').selectOption({ label: 'users' })
  await page.getByLabel('Secondary table').selectOption({ label: 'orders' })
  await page.getByLabel('Primary attribute').selectOption({ label: 'users.id' })
  await page.getByLabel('Secondary attribute').selectOption({ label: 'orders.user_id' })
  await page.getByRole('button', { name: /^create relationship$/i }).click()
  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.x6-edge').length)).toBe(1)

  const node = page.locator('.x6-node').first()
  const box = await node.boundingBox()
  const nodeCountBeforeDrag = await page.evaluate(() => document.querySelectorAll('.x6-node').length)

  if (!box) {
    throw new Error('Expected the created table to have a bounding box')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2 + 120, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  await expect
    .poll(async () => page.evaluate(() => document.querySelectorAll('.x6-node').length))
    .toBe(nodeCountBeforeDrag)

  await page.getByRole('button', { name: /generate ddl/i }).click()

  await expect(page.getByText(/create table public\.users/i)).toBeVisible()
  await expect(page.getByText(/foreign key \(user_id\) references public\.users \(id\)/i)).toBeVisible()
})

test('user can start a relationship by dragging from one table to another', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Relationship Drag Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('users')
  await page.getByRole('button', { name: /create table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/users/i)).toBeVisible()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('orders')
  await page.getByRole('button', { name: /create table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/orders/i)).toBeVisible()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill('user_id')
  await page.getByLabel('Data type').last().fill('uuid')
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.locator('.x6-node').first().click()

  const sourcePort = page.getByLabel('Create relationship from users')
  const sourceBox = await sourcePort.boundingBox()

  if (!sourceBox) {
    throw new Error('Expected a visible relationship source handle for the selected table')
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  const targetPort = page.getByLabel('Create relationship to orders')
  const targetBox = await targetPort.boundingBox()

  if (!targetBox) {
    throw new Error('Expected a visible relationship target handle while dragging')
  }

  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 12 })
  await page.mouse.up()

  await expect(page.getByRole('heading', { name: /configure relationship/i })).toBeVisible()
  await expect(page.locator('#relationship-primary-table option:checked')).toHaveText('users')
  await expect(page.locator('#relationship-secondary-table option:checked')).toHaveText('orders')
})
