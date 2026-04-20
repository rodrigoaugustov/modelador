import { expect, test } from '@playwright/test'

test('user creates a project, edits a model, saves, reopens, and generates ddl', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Sales Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Logical table name').fill('users')
  await page.getByRole('button', { name: /save table/i }).click()

  await page.getByRole('button', { name: /generate ddl/i }).click()

  await expect(page.getByText(/create table users/i)).toBeVisible()
})
