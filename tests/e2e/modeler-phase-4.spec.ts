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

test('user reorders attributes, edits composite keys, creates a drag relationship, and exports a composite foreign key', async ({
  page,
}) => {
  await createProject(page, 'Advanced Editor Model')

  await createTable(page, 'branch')
  await page.getByTestId('modeler-canvas').getByText(/^branch$/i).click({ force: true })
  await page.getByRole('button', { name: /edit attributes/i }).click()

  await page.getByLabel('Column name').first().fill('branch_id')
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill('company_id')
  await page.getByLabel('Data type').last().fill('uuid')
  await page.getByLabel('Primary key').last().check()
  await page.getByRole('button', { name: /move company_id up/i }).click()
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await createTable(page, 'orders')
  await page.getByTestId('modeler-canvas').getByText(/^orders$/i).click({ force: true })
  await page.getByRole('button', { name: /edit attributes/i }).click()

  await page.getByLabel('Column name').first().fill('company_id')
  await page.getByLabel('Primary key').first().uncheck()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill('branch_id')
  await page.getByLabel('Data type').last().fill('uuid')
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.locator('.x6-node').nth(0).click()
  await expect(page.getByText(/branch in schema public with 2 attributes\./i)).toBeVisible()

  const sourceHandle = page.getByLabel('Create relationship from branch')
  await expect(sourceHandle).toBeVisible()
  const sourceBox = await sourceHandle.boundingBox()

  if (!sourceBox) {
    throw new Error('Expected branch relationship source handle to be visible')
  }

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()

  const targetHandle = page.getByLabel('Create relationship to orders')
  const targetBox = await targetHandle.boundingBox()

  if (!targetBox) {
    throw new Error('Expected orders relationship target handle to be visible during drag')
  }

  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 12,
  })
  await page.mouse.up()

  const relationshipDialog = page.locator('[aria-label="Configure relationship dialog"]')
  await expect(relationshipDialog).toBeVisible()
  await expect(relationshipDialog.locator('#relationship-primary-table option:checked')).toHaveText(/branch/i)
  await expect(relationshipDialog.locator('#relationship-secondary-table option:checked')).toHaveText(/orders/i)
  await expect(relationshipDialog.getByLabel('Primary attribute 1').locator('option:checked')).toHaveText(
    /branch\.company_id/i,
  )
  await expect(relationshipDialog.getByLabel('Secondary attribute 1').locator('option:checked')).toHaveText(
    /orders\.company_id/i,
  )
  await relationshipDialog.getByRole('button', { name: /add attribute mapping/i }).click()
  await relationshipDialog.getByLabel('Primary attribute 2').selectOption({ label: 'branch.branch_id' })
  await relationshipDialog.getByLabel('Secondary attribute 2').selectOption({ label: 'orders.branch_id' })
  await relationshipDialog.getByLabel('Line style').selectOption('curved')
  await relationshipDialog.getByRole('button', { name: /create relationship/i }).click()
  await expect(relationshipDialog).toHaveCount(0)

  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.x6-edge').length)).toBe(1)

  await page.getByRole('button', { name: /generate ddl/i }).click()

  await expect(page.getByText(/create table public\.branch/i)).toBeVisible()
  await expect(page.getByText(/primary key \(company_id, branch_id\)/i)).toBeVisible()
  await expect(
    page.getByText(/foreign key \(company_id, branch_id\) references public\.branch \(company_id, branch_id\)/i),
  ).toBeVisible()
})
