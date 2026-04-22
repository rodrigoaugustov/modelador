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

async function addColumn(page: Page, column: { name: string; dataType: string; isPrimaryKey?: boolean }) {
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill(column.name)
  await page.getByLabel('Data type').last().fill(column.dataType)

  if (column.isPrimaryKey) {
    await page.getByLabel('Primary key').last().check()
  }
}

test('user edits table identity, switches to physical mode, edits relationship actions, and exports spec-faithful ddl', async ({
  page,
}) => {
  await createProject(page, 'Spec Fidelity Model')

  await createTable(page, 'users')
  await page.getByRole('button', { name: /edit table details/i }).click()
  await page.getByLabel('Physical table name').fill('tb_users')
  await page.getByLabel('Schema').fill('identity')
  await page.getByRole('button', { name: /apply table details/i }).click()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await addColumn(page, { name: 'id', dataType: 'uuid', isPrimaryKey: true })
  await addColumn(page, { name: 'email', dataType: 'varchar' })
  await page.getByLabel('Physical name').last().fill('email_address')
  await page.getByLabel('Size').last().fill('255')
  await page.getByLabel('Definition').last().fill('Main user contact address')
  await page.getByLabel('Not null').last().check()
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await createTable(page, 'orders')
  await page.getByRole('button', { name: /edit table details/i }).click()
  await page.getByLabel('Physical table name').fill('tb_orders')
  await page.getByLabel('Schema').fill('identity')
  await page.getByRole('button', { name: /apply table details/i }).click()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await addColumn(page, { name: 'id', dataType: 'uuid', isPrimaryKey: true })
  await addColumn(page, { name: 'user_id', dataType: 'uuid' })
  await page.getByLabel('Physical name').last().fill('user_id')
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.getByRole('button', { name: /configure relationship/i }).click()
  const relationshipDialog = page.locator('[aria-label="Configure relationship dialog"]')
  await relationshipDialog.getByLabel('Primary table').selectOption({ label: 'users' })
  await relationshipDialog.getByLabel('Secondary table').selectOption({ label: 'orders' })
  await relationshipDialog.getByLabel('Primary attribute 1').selectOption({ label: 'users.id' })
  await relationshipDialog.getByLabel('Secondary attribute 1').selectOption({ label: 'orders.user_id' })
  await relationshipDialog.getByRole('button', { name: /create relationship/i }).click()
  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.x6-edge').length)).toBe(1)

  await page.locator('.x6-edge path').first().click({ force: true })
  await expect(page.getByRole('button', { name: /edit relationship/i })).toBeVisible()
  await page.getByRole('button', { name: /edit relationship/i }).click()
  await page.getByLabel('On delete').selectOption('restrict')
  await page.getByLabel('On update').selectOption('no action')
  await page.getByRole('button', { name: /save relationship/i }).click()

  await page.getByRole('switch', { name: /physical mode|logical mode/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/tb_users/i)).toBeVisible()
  await expect(page.getByTestId('modeler-canvas').getByText(/tb_orders/i)).toBeVisible()

  await page.getByRole('button', { name: /generate ddl/i }).click()
  await expect(page.getByText(/create table identity\.tb_users/i)).toBeVisible()
  await expect(page.getByText(/create table identity\.tb_orders/i)).toBeVisible()
  await expect(page.getByText(/email_address varchar\(255\) not null/i)).toBeVisible()
  await expect(
    page.getByText(/foreign key \(user_id\) references identity\.tb_users \(id\) on delete restrict on update no action/i),
  ).toBeVisible()
})
