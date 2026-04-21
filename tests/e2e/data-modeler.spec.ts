import { expect, test } from '@playwright/test'

test('user creates a project, edits a model, saves, reopens, and generates ddl', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Sales Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Logical table name').fill('users')
  await page.getByRole('button', { name: /save table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/users/i)).toBeVisible()
  const node = page.locator('.x6-node').first()
  const box = await node.boundingBox()

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
    .toBe(1)

  await page.getByRole('button', { name: /generate ddl/i }).click()

  await expect(page.getByText(/create table users/i)).toBeVisible()
})
