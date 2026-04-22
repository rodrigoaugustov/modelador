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

async function createRelationship(
  page: Page,
  input: {
    primaryTable: string
    secondaryTable: string
    primaryAttribute: string
    secondaryAttribute: string
  },
) {
  await page.getByRole('button', { name: /configure relationship/i }).click()

  const relationshipDialog = page.locator('[aria-label="Configure relationship dialog"]')
  await relationshipDialog.getByLabel('Primary table').selectOption({ label: input.primaryTable })
  await relationshipDialog.getByLabel('Secondary table').selectOption({ label: input.secondaryTable })
  await relationshipDialog.getByLabel('Primary attribute 1').selectOption({ label: input.primaryAttribute })
  await relationshipDialog.getByLabel('Secondary attribute 1').selectOption({ label: input.secondaryAttribute })
  await relationshipDialog.getByRole('button', { name: /create relationship/i }).click()
  await expect(relationshipDialog).toHaveCount(0)
}

test('user reorders attributes, edits composite keys, creates a drag relationship, and exports a composite foreign key', async ({
  page,
}) => {
  await createProject(page, 'Advanced Editor Model')

  await createTable(page, 'branch')
  await page.getByTestId('modeler-canvas').getByText(/^branch$/i).click({ force: true })
  await page.getByRole('button', { name: /edit attributes/i }).click()

  await addColumn(page, { name: 'branch_id', dataType: 'uuid', isPrimaryKey: true })
  await addColumn(page, { name: 'company_id', dataType: 'uuid', isPrimaryKey: true })
  await page.getByRole('button', { name: /move company_id up/i }).click()
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await createTable(page, 'orders')
  await page.getByTestId('modeler-canvas').getByText(/^orders$/i).click({ force: true })
  await page.getByRole('button', { name: /edit attributes/i }).click()

  await addColumn(page, { name: 'company_id', dataType: 'uuid' })
  await addColumn(page, { name: 'branch_id', dataType: 'uuid' })
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

test('user adds and removes manual vertices with double click without breaking the canvas', async ({
  page,
}) => {
  const consoleMessages: string[] = []
  page.on('console', (message) => {
    consoleMessages.push(message.text())
  })

  await createProject(page, 'Manual Vertex Model')
  await createTable(page, 'products')
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await addColumn(page, { name: 'id', dataType: 'uuid', isPrimaryKey: true })
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await createTable(page, 'orders')
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await addColumn(page, { name: 'id', dataType: 'uuid', isPrimaryKey: true })
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await createRelationship(page, {
    primaryTable: 'products',
    secondaryTable: 'orders',
    primaryAttribute: 'products.id',
    secondaryAttribute: 'orders.id',
  })

  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.x6-edge').length)).toBe(1)

  await page.locator('.x6-node').first().click()
  const interactionPoint = await page.locator('.x6-edge path').nth(1).evaluate((node) => {
    const path = node as SVGPathElement
    const point = path.getPointAtLength(path.getTotalLength() / 2)
    return { x: point.x, y: point.y }
  })
  const canvasBox = await page.getByTestId('modeler-canvas').boundingBox()

  if (!canvasBox) {
    throw new Error('Expected the modeler canvas bounding box to be available')
  }

  const clickX = canvasBox.x + interactionPoint.x
  const clickY = canvasBox.y + interactionPoint.y

  await page.mouse.click(clickX, clickY)
  await page.waitForTimeout(250)

  await expect.poll(async () => page.locator('.x6-edge-tool-vertex').count()).toBe(0)

  await page.mouse.dblclick(clickX, clickY)
  await page.waitForTimeout(250)

  await expect.poll(async () => page.locator('.x6-edge-tool-vertex').count()).toBe(1)

  const vertexHandle = page.locator('.x6-edge-tool-vertex').first()
  await expect(vertexHandle).toBeVisible()
  const vertexHandleBox = await vertexHandle.boundingBox()

  if (!vertexHandleBox) {
    throw new Error('Expected a manual vertex handle to be visible after double click insertion')
  }

  await page.mouse.dblclick(
    vertexHandleBox.x + vertexHandleBox.width / 2,
    vertexHandleBox.y + vertexHandleBox.height / 2,
  )
  await page.waitForTimeout(250)

  await expect.poll(async () => page.locator('.x6-edge-tool-vertex').count()).toBe(0)
  expect(consoleMessages).not.toContainEqual(expect.stringContaining('Unable to execute manhattan algorithm'))

  await page.getByRole('button', { name: /generate ddl/i }).click()
  await expect(page.getByText(/create table public\.products/i)).toBeVisible()
  await expect(page.getByText(/create table public\.orders/i)).toBeVisible()
})

test('relationship handle follows the table while the user is still dragging it', async ({ page }) => {
  await createProject(page, 'Live Handle Model')
  await createTable(page, 'users')

  await page.locator('.x6-node').first().click()
  const sourceHandle = page.getByLabel('Create relationship from users')
  const sourceHandleBoxBeforeDrag = await sourceHandle.boundingBox()
  const node = page.locator('.x6-node').first()
  const nodeBox = await node.boundingBox()

  if (!nodeBox || !sourceHandleBoxBeforeDrag) {
    throw new Error('Expected the selected node and relationship handle to be visible before dragging')
  }

  await page.mouse.move(nodeBox.x + nodeBox.width / 2, nodeBox.y + nodeBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(nodeBox.x + nodeBox.width / 2 + 120, nodeBox.y + nodeBox.height / 2 + 80, { steps: 8 })

  await expect
    .poll(async () => {
      const currentBox = await sourceHandle.boundingBox()
      return currentBox ? currentBox.x - sourceHandleBoxBeforeDrag.x : 0
    })
    .toBeGreaterThan(40)

  await page.mouse.up()
})

test('manual vertices can be dragged smoothly after they are created', async ({ page }) => {
  await createProject(page, 'Vertex Drag Model')
  await createTable(page, 'products')
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await addColumn(page, { name: 'id', dataType: 'uuid', isPrimaryKey: true })
  await page.getByRole('button', { name: /apply schema changes/i }).click()
  await createTable(page, 'orders')
  await page.getByRole('button', { name: /edit attributes/i }).click()
  await addColumn(page, { name: 'id', dataType: 'uuid', isPrimaryKey: true })
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await createRelationship(page, {
    primaryTable: 'products',
    secondaryTable: 'orders',
    primaryAttribute: 'products.id',
    secondaryAttribute: 'orders.id',
  })

  await expect.poll(async () => page.evaluate(() => document.querySelectorAll('.x6-edge').length)).toBe(1)

  const interactionPoint = await page.locator('.x6-edge path').nth(1).evaluate((node) => {
    const path = node as SVGPathElement
    const point = path.getPointAtLength(path.getTotalLength() / 2)
    return { x: point.x, y: point.y }
  })
  const canvasBox = await page.getByTestId('modeler-canvas').boundingBox()

  if (!canvasBox) {
    throw new Error('Expected the modeler canvas bounding box to be available')
  }

  await page.mouse.dblclick(canvasBox.x + interactionPoint.x, canvasBox.y + interactionPoint.y)
  await expect.poll(async () => page.locator('.x6-edge-tool-vertex').count()).toBe(1)

  const vertexHandle = page.locator('.x6-edge-tool-vertex').first()
  await expect(vertexHandle).toBeVisible()
  const vertexHandleBoxBeforeDrag = await vertexHandle.boundingBox()

  if (!vertexHandleBoxBeforeDrag) {
    throw new Error('Expected the inserted manual vertex handle to be visible before dragging')
  }

  await page.mouse.move(
    vertexHandleBoxBeforeDrag.x + vertexHandleBoxBeforeDrag.width / 2,
    vertexHandleBoxBeforeDrag.y + vertexHandleBoxBeforeDrag.height / 2,
  )
  await page.mouse.down()
  await page.mouse.move(
    vertexHandleBoxBeforeDrag.x + vertexHandleBoxBeforeDrag.width / 2 + 72,
    vertexHandleBoxBeforeDrag.y + vertexHandleBoxBeforeDrag.height / 2 + 56,
    { steps: 12 },
  )
  await page.mouse.up()

  await expect
    .poll(async () => {
      const currentBox = await vertexHandle.boundingBox()
      return currentBox ? Math.hypot(currentBox.x - vertexHandleBoxBeforeDrag.x, currentBox.y - vertexHandleBoxBeforeDrag.y) : 0
    })
    .toBeGreaterThan(24)
})
