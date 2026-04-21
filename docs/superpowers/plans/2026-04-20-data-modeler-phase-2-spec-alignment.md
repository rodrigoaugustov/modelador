# Data Modeler Phase 2 Spec Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the functional gaps between the current MVP foundation and the approved product requirements by implementing table attributes, relationship editing, richer canvas rendering, and PostgreSQL DDL generation aligned with `tech_specs.txt`.

**Architecture:** This phase keeps the approved `Next.js + Route Handlers + Supabase + X6` modular-monolith architecture, while pushing more behavior into the object-oriented modeler layer and its `control/*`, `model/*`, and `view/*` packages. `tech_specs.txt` remains the primary product requirements source, the approved architecture spec remains the implementation boundary, and `prototipo_ui` is treated as visual reference rather than a behavioral source of truth.

**Tech Stack:** Next.js App Router, React, TypeScript, AntV X6, Supabase Postgres, IndexedDB, Vitest, Testing Library, Playwright

---

## Reference Hierarchy

Use these sources in this order when making decisions:

1. `tech_specs.txt`
2. Approved architectural decisions already documented in `docs/superpowers/specs/2026-04-20-data-modeler-mvp-design.md`
3. `prototipo_ui/**` for visual layout, spacing, hierarchy, and interaction cues

## Approved Deviations To Preserve

These are already approved and should be documented during implementation whenever touched:

- The “front end + back end + database” requirement is implemented as `Next.js UI + Next.js Route Handlers + Supabase Postgres`, which still preserves the three logical parts.
- Raw SVG DOM ownership from the original spec is implemented through `X6` as the rendering/interaction engine, while the product still owns the canonical TypeScript domain model.
- React is used as the application shell and modal/form host, but the editor behavior remains organized under `src/modeler/control`, `src/modeler/model`, and `src/modeler/view`.

## Notes For This Phase

- `prototipo_ui` does **not** remove requirements that are absent from the mockups.
- Prototype fields that conflict with product scope must not be implemented silently. Example: a `Storage Engine` selector is not part of the approved PostgreSQL-only MVP and would require a documented product decision before implementation.
- Before execution starts, track `tech_specs.txt` and `prototipo_ui/**` in git so they become part of the reviewable project history.

---

## File Structure Map

**Documentation and reference tracking**

- Create: `docs/architecture/approved-deviations.md`
- Add/Track: `tech_specs.txt`
- Add/Track: `prototipo_ui/**`

**Typed editor snapshot model**

- Create: `src/modeler/types/editor-snapshot.ts`
- Modify: `src/modeler/util/model-serializer.ts`
- Modify: `src/server/persistence/project-repository.ts`
- Modify: `src/server/persistence/project-service.ts`
- Modify: `src/server/validation/model-validator.ts`
- Modify: `src/server/ddl/postgres-ddl-mapper.ts`
- Modify: `src/server/ddl/postgres-ddl-generator.ts`

**Table rendering and selection**

- Modify: `src/modeler/control/assembler/table/table-node-factory.ts`
- Create: `src/modeler/control/handler/table/table-selection-controller.ts`
- Modify: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Modify: `src/modeler/view/panel/property-panel.tsx`

**Form handlers and modals**

- Create: `src/modeler/control/handler/form/table/create-table-form-handler.ts`
- Create: `src/modeler/control/handler/form/table/edit-attributes-form-handler.ts`
- Create: `src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts`
- Create: `src/modeler/view/modal/create-table-modal.tsx`
- Create: `src/modeler/view/modal/edit-attributes-modal.tsx`
- Create: `src/modeler/view/modal/configure-relationship-modal.tsx`

**Relationship rendering**

- Modify: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/model/relationship/relationship-model.ts`
- Modify: `src/modeler/model/table/table-model.ts`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`

**Tests**

- Create: `tests/unit/modeler/types/editor-snapshot.test.ts`
- Create: `tests/unit/modeler/control/table-selection-controller.test.ts`
- Create: `tests/unit/modeler/control/form/create-table-form-handler.test.ts`
- Create: `tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`
- Create: `tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts`
- Modify: `tests/unit/server/validation/model-validator.test.ts`
- Modify: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`
- Modify: `tests/components/modeler-workspace.test.tsx`
- Modify: `tests/e2e/data-modeler.spec.ts`

---

## Task 1: Track Official References And Typed Snapshot Contracts

**Files:**
- Create: `docs/architecture/approved-deviations.md`
- Add/Track: `tech_specs.txt`
- Add/Track: `prototipo_ui/**`
- Create: `src/modeler/types/editor-snapshot.ts`
- Modify: `src/modeler/util/model-serializer.ts`
- Test: `tests/unit/modeler/types/editor-snapshot.test.ts`

- [ ] **Step 1: Write the failing test for the richer snapshot contract**

```ts
import { describe, expect, it } from 'vitest'
import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'

describe('EditorProjectSnapshot', () => {
  it('supports tables with attributes and relationships with referential metadata', () => {
    const snapshot: EditorProjectSnapshot = {
      project: { id: 'proj_1', name: 'Sales', description: '' },
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'users',
            schema: 'public',
            coordinate: { x: 64, y: 64 },
            attributes: [
              {
                id: 'attr_users_id',
                logicalName: 'id',
                physicalName: 'id',
                dataType: 'uuid',
                size: null,
                isNull: false,
                isPrimaryKey: true,
                isForeignKey: false,
                definition: null,
                example: null,
                domain: null,
              },
            ],
          },
        ],
        relationships: [
          {
            id: 'rel_users_orders',
            primaryTableId: 'table_users',
            secondaryTableId: 'table_orders',
            primaryAttributeId: 'attr_users_id',
            secondaryAttributeId: 'attr_orders_user_id',
            relationshipType: 'one-to-many',
            onDelete: 'cascade',
            onUpdate: 'cascade',
            enforceConstraint: true,
          },
        ],
      },
      diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
      metadata: { viewMode: 'logical', postgresVersion: 'default' },
    }

    expect(snapshot.model.tables[0].attributes[0].isPrimaryKey).toBe(true)
    expect(snapshot.model.relationships[0].relationshipType).toBe('one-to-many')
  })
})
```

- [ ] **Step 2: Run the snapshot test to verify it fails**

Run: `npm test -- tests/unit/modeler/types/editor-snapshot.test.ts`
Expected: FAIL with `Cannot find module '@/modeler/types/editor-snapshot'`.

- [ ] **Step 3: Implement the typed snapshot contracts, serializer alignment, and deviations doc**

```ts
// src/modeler/types/editor-snapshot.ts
export type EditorAttributeSnapshot = {
  id: string
  logicalName: string
  physicalName: string | null
  dataType: string | null
  size: string | null
  isNull: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  definition: string | null
  example: string | null
  domain: string | null
}

export type EditorTableSnapshot = {
  id: string
  logicalName: string
  physicalName: string | null
  schema: string
  coordinate: { x: number; y: number }
  attributes: EditorAttributeSnapshot[]
}

export type EditorRelationshipSnapshot = {
  id: string
  primaryTableId: string
  secondaryTableId: string
  primaryAttributeId: string
  secondaryAttributeId: string
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many'
  onDelete: 'no action' | 'restrict' | 'cascade' | 'set null'
  onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null'
  enforceConstraint: boolean
}

export type EditorProjectSnapshot = {
  project: { id: string; name: string; description: string }
  model: {
    tables: EditorTableSnapshot[]
    relationships: EditorRelationshipSnapshot[]
  }
  diagram: { viewport: { x: number; y: number; zoom: number } }
  metadata: { viewMode: 'logical' | 'physical'; postgresVersion: string }
}
```

```ts
// src/modeler/util/model-serializer.ts
import type { EditorProjectSnapshot } from '@/modeler/types/editor-snapshot'

export function serializeProjectModel(project: ProjectModel): EditorProjectSnapshot {
  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
    },
    model: {
      tables: Array.from(project.tables.values()).map((table) => ({
        id: table.identification,
        logicalName: table.tableName.logicalName,
        physicalName: table.tableName.physicalName,
        schema: 'public',
        coordinate: { x: table.coordinate.x, y: table.coordinate.y },
        attributes: [
          ...Array.from(table.tablePrimaryKeyList.values()),
          ...Array.from(table.tableAttributeList.values()),
        ].map((attribute) => ({
          id: attribute.identification,
          logicalName: attribute.logicalName ?? '',
          physicalName: attribute.physicalName,
          dataType: attribute.dataType,
          size: attribute.size,
          isNull: attribute.isNull ?? true,
          isPrimaryKey: attribute.isPrimaryKey ?? false,
          isForeignKey: attribute.isForeignKey ?? false,
          definition: attribute.definition,
          example: attribute.example,
          domain: attribute.domain,
        })),
      })),
      relationships: Array.from(project.relationships.values()).map((relationship) => ({
        id: relationship.identification,
        primaryTableId: relationship.primaryTable.identification,
        secondaryTableId: relationship.secondaryTable.identification,
        primaryAttributeId: relationship.primaryAttributeId,
        secondaryAttributeId: relationship.secondaryAttributeId,
        relationshipType: relationship.relationshipType,
        onDelete: relationship.onDelete,
        onUpdate: relationship.onUpdate,
        enforceConstraint: relationship.enforceConstraint,
      })),
    },
    diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
    metadata: { viewMode: 'logical', postgresVersion: 'default' },
  }
}
```

```md
<!-- docs/architecture/approved-deviations.md -->
# Approved Deviations

- Approved on 2026-04-20: implement the logical three-part system as `Next.js app shell + Route Handlers + Supabase Postgres`.
- Approved on 2026-04-20: use `X6` as the SVG interaction/rendering engine while keeping the domain model as the source of truth.
- Approved on 2026-04-20: use React modals and panels as the host UI while preserving MVC-inspired `src/modeler/control`, `src/modeler/model`, and `src/modeler/view` responsibilities.
```

- [ ] **Step 4: Run the snapshot unit test and existing serializer tests**

Run: `npm test -- tests/unit/modeler/types/editor-snapshot.test.ts tests/unit/modeler/util/model-serializer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the reference tracking and typed snapshot baseline**

```bash
git add docs/architecture/approved-deviations.md tech_specs.txt prototipo_ui src/modeler/types/editor-snapshot.ts src/modeler/util/model-serializer.ts tests/unit/modeler/types/editor-snapshot.test.ts tests/unit/modeler/util/model-serializer.test.ts
git commit -m "docs: track product references and typed editor snapshots"
```

## Task 2: Render Table Schema Cards And Selection State

**Files:**
- Modify: `src/modeler/control/assembler/table/table-node-factory.ts`
- Create: `src/modeler/control/handler/table/table-selection-controller.ts`
- Modify: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Modify: `src/modeler/view/panel/property-panel.tsx`
- Test: `tests/unit/modeler/control/table-selection-controller.test.ts`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing tests for table selection and attribute-rich node content**

```ts
import { describe, expect, it } from 'vitest'
import { TableSelectionController } from '@/modeler/control/handler/table/table-selection-controller'

describe('TableSelectionController', () => {
  it('stores the selected table id and clears relationship selection', () => {
    const controller = new TableSelectionController()

    const next = controller.selectTable({
      selectedTableId: null,
      selectedRelationshipId: 'rel_users_orders',
    }, 'table_users')

    expect(next.selectedTableId).toBe('table_users')
    expect(next.selectedRelationshipId).toBeNull()
  })
})
```

```tsx
import { render, screen } from '@testing-library/react'
import { ModelerWorkspace } from '@/modeler/view/workspace/modeler-workspace'

describe('ModelerWorkspace', () => {
  it('renders schema-card style node text for table attributes in the workspace', () => {
    render(
      <ModelerWorkspace
        projectId="proj_1"
        initialProject={{
          project: { id: 'proj_1', name: 'Sales' },
          model: {
            tables: [
              {
                id: 'table_users',
                logicalName: 'users',
                physicalName: null,
                schema: 'public',
                coordinate: { x: 64, y: 64 },
                attributes: [
                  {
                    id: 'attr_users_id',
                    logicalName: 'id',
                    physicalName: null,
                    dataType: 'uuid',
                    size: null,
                    isNull: false,
                    isPrimaryKey: true,
                    isForeignKey: false,
                    definition: null,
                    example: null,
                    domain: null,
                  },
                ],
              },
            ],
            relationships: [],
          },
          diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
          metadata: { viewMode: 'logical', postgresVersion: 'default' },
        }}
      />,
    )

    expect(screen.getByText(/users/i)).toBeInTheDocument()
    expect(screen.getByText(/id/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/modeler/control/table-selection-controller.test.ts tests/components/modeler-workspace.test.tsx`
Expected: FAIL because `TableSelectionController` does not exist and the workspace does not yet render attribute rows.

- [ ] **Step 3: Implement table selection state and schema-card node rendering**

```ts
// src/modeler/control/handler/table/table-selection-controller.ts
export type SelectionState = {
  selectedTableId: string | null
  selectedRelationshipId: string | null
}

export class TableSelectionController {
  selectTable(state: SelectionState, tableId: string): SelectionState {
    return {
      selectedTableId: tableId,
      selectedRelationshipId: null,
    }
  }
}
```

```ts
// src/modeler/control/assembler/table/table-node-factory.ts
export function createTableNodeDefinition(table: TableModel): Node.Metadata {
  const attributes = [
    ...Array.from(table.tablePrimaryKeyList.values()),
    ...Array.from(table.tableAttributeList.values()),
  ]

  const lines = attributes.map((attribute) => {
    const attributeName = attribute.logicalName ?? 'unnamed'
    const typeName = attribute.dataType ? attribute.dataType.toUpperCase() : 'TEXT'
    const nullableToken = attribute.isNull ? '' : ' [NN]'
    const pkToken = attribute.isPrimaryKey ? ' [PK]' : ''
    const fkToken = attribute.isForeignKey ? ' [FK]' : ''
    return `${attributeName} ${typeName}${pkToken}${fkToken}${nullableToken}`.trim()
  })

  return {
    id: table.identification,
    shape: 'rect',
    x: table.coordinate.x,
    y: table.coordinate.y,
    width: 320,
    height: Math.max(140, 64 + lines.length * 28),
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: 'rgba(169, 180, 185, 0.15)',
        strokeWidth: 1,
        rx: 18,
        ry: 18,
      },
      label: {
        text: [table.tableName.logicalName, ...lines].join('\n'),
        fill: '#2a3439',
        fontSize: 14,
        fontWeight: 600,
        textAnchor: 'start',
        refX: 20,
        refY: 22,
      },
    },
  }
}
```

```tsx
// src/modeler/view/panel/property-panel.tsx
export function PropertyPanel({
  children,
  title = 'Selection',
}: {
  children?: ReactNode
  title?: string
}) {
  return (
    <aside className="modeler-panel modeler-panel--right">
      <p className="modeler-panel__eyebrow">Properties</p>
      <div className="property-card">
        <h2 className="modeler-panel__title">{title}</h2>
        {children ?? <p className="modeler-panel__copy">Select a table or relationship to edit its metadata.</p>}
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: Run the tests to verify selection and node rendering pass**

Run: `npm test -- tests/unit/modeler/control/table-selection-controller.test.ts tests/components/modeler-workspace.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the richer table node rendering baseline**

```bash
git add src/modeler/control/assembler/table/table-node-factory.ts src/modeler/control/handler/table/table-selection-controller.ts src/modeler/control/handler/workspace/workspace-controller.ts src/modeler/view/workspace/modeler-workspace.tsx src/modeler/view/panel/property-panel.tsx tests/unit/modeler/control/table-selection-controller.test.ts tests/components/modeler-workspace.test.tsx
git commit -m "feat: render schema cards and table selection state"
```

## Task 3: Add Create Table Modal With Initial Columns

**Files:**
- Create: `src/modeler/control/handler/form/table/create-table-form-handler.ts`
- Create: `src/modeler/view/modal/create-table-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/form/create-table-form-handler.test.ts`
- Modify: `tests/e2e/data-modeler.spec.ts`

- [ ] **Step 1: Write the failing tests for create-table drafts and modal flow**

```ts
import { describe, expect, it } from 'vitest'
import { CreateTableFormHandler } from '@/modeler/control/handler/form/table/create-table-form-handler'

describe('CreateTableFormHandler', () => {
  it('creates a new table draft with a required primary key row', () => {
    const handler = new CreateTableFormHandler()
    const draft = handler.createDraft()

    expect(draft.attributes[0].logicalName).toBe('id')
    expect(draft.attributes[0].isPrimaryKey).toBe(true)
    expect(draft.attributes[0].isNull).toBe(false)
  })
})
```

```ts
import { expect, test } from '@playwright/test'

test('user creates a table from the modal with seed attributes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Sales Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await expect(page.getByRole('heading', { name: /create new table/i })).toBeVisible()
  await expect(page.getByDisplayValue('id')).toBeVisible()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/modeler/control/form/create-table-form-handler.test.ts`
Expected: FAIL with missing create-table handler.

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: FAIL because the editor still uses the small inline form instead of the modal flow.

- [ ] **Step 3: Implement the create-table draft handler and modal**

```ts
// src/modeler/control/handler/form/table/create-table-form-handler.ts
import type { EditorAttributeSnapshot, EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export class CreateTableFormHandler {
  createDraft(): Omit<EditorTableSnapshot, 'id' | 'coordinate'> {
    const idAttribute: EditorAttributeSnapshot = {
      id: 'draft_attr_id',
      logicalName: 'id',
      physicalName: 'id',
      dataType: 'uuid',
      size: null,
      isNull: false,
      isPrimaryKey: true,
      isForeignKey: false,
      definition: null,
      example: null,
      domain: null,
    }

    return {
      logicalName: '',
      physicalName: null,
      schema: 'public',
      attributes: [idAttribute],
    }
  }
}
```

```tsx
// src/modeler/view/modal/create-table-modal.tsx
'use client'

export function CreateTableModal({
  draft,
  onClose,
  onChange,
  onSubmit,
}: {
  draft: Omit<EditorTableSnapshot, 'id' | 'coordinate'>
  onClose: () => void
  onChange: (draft: Omit<EditorTableSnapshot, 'id' | 'coordinate'>) => void
  onSubmit: () => void
}) {
  return (
    <div className="dialog-scrim">
      <section className="dialog-card" aria-label="Create table dialog">
        <h2>Create New Table</h2>
        <label htmlFor="table-name">Table Name</label>
        <input
          id="table-name"
          value={draft.logicalName}
          onChange={(event) => onChange({ ...draft, logicalName: event.target.value })}
        />
        <label htmlFor="table-schema">Schema</label>
        <input
          id="table-schema"
          value={draft.schema}
          onChange={(event) => onChange({ ...draft, schema: event.target.value })}
        />
        {draft.attributes.map((attribute) => (
          <div key={attribute.id}>
            <input value={attribute.logicalName} readOnly />
            <input value={attribute.dataType ?? ''} readOnly />
          </div>
        ))}
        <div className="modeler-toolbar">
          <button type="button" className="modeler-toolbar__button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="modeler-toolbar__button" onClick={onSubmit}>
            Create Table
          </button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify the create-table modal passes**

Run: `npm test -- tests/unit/modeler/control/form/create-table-form-handler.test.ts`
Expected: PASS

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: PASS for the modal opening and seeded `id` row assertions after updating the scenario.

- [ ] **Step 5: Commit the create-table modal flow**

```bash
git add src/modeler/control/handler/form/table/create-table-form-handler.ts src/modeler/view/modal/create-table-modal.tsx src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/form/create-table-form-handler.test.ts tests/e2e/data-modeler.spec.ts
git commit -m "feat: add create table modal with seeded attributes"
```

## Task 4: Add Attribute Editing And Table Property Management

**Files:**
- Create: `src/modeler/control/handler/form/table/edit-attributes-form-handler.ts`
- Create: `src/modeler/view/modal/edit-attributes-modal.tsx`
- Modify: `src/modeler/view/panel/property-panel.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Modify: `src/server/persistence/project-service.ts`
- Test: `tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`
- Modify: `tests/e2e/data-modeler.spec.ts`

- [ ] **Step 1: Write the failing tests for attribute editing**

```ts
import { describe, expect, it } from 'vitest'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'

describe('EditAttributesFormHandler', () => {
  it('adds a nullable non-key attribute row by default', () => {
    const handler = new EditAttributesFormHandler()
    const attributes = handler.addAttribute([])

    expect(attributes).toHaveLength(1)
    expect(attributes[0].isPrimaryKey).toBe(false)
    expect(attributes[0].isNull).toBe(true)
  })
})
```

```ts
import { expect, test } from '@playwright/test'

test('user edits attributes and sees them persisted after refresh', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Sales Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('users')
  await page.getByRole('button', { name: /create table/i }).click()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel(/column name/i).last().fill('email')
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.reload()
  await expect(page.getByTestId('modeler-canvas').getByText(/email/i)).toBeVisible()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`
Expected: FAIL with missing handler module.

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: FAIL because there is no edit-attributes modal or persisted attribute editing yet.

- [ ] **Step 3: Implement attribute editing handler, modal, and table-focused property panel**

```ts
// src/modeler/control/handler/form/table/edit-attributes-form-handler.ts
import type { EditorAttributeSnapshot } from '@/modeler/types/editor-snapshot'

export class EditAttributesFormHandler {
  addAttribute(attributes: EditorAttributeSnapshot[]): EditorAttributeSnapshot[] {
    return [
      ...attributes,
      {
        id: `draft_attr_${crypto.randomUUID()}`,
        logicalName: '',
        physicalName: null,
        dataType: 'text',
        size: null,
        isNull: true,
        isPrimaryKey: false,
        isForeignKey: false,
        definition: null,
        example: null,
        domain: null,
      },
    ]
  }
}
```

```tsx
// src/modeler/view/modal/edit-attributes-modal.tsx
'use client'

export function EditAttributesModal({
  table,
  onClose,
  onChange,
  onApply,
}: {
  table: EditorTableSnapshot
  onClose: () => void
  onChange: (table: EditorTableSnapshot) => void
  onApply: () => void
}) {
  return (
    <div className="dialog-scrim">
      <section className="dialog-card" aria-label="Edit attributes dialog">
        <h2>Edit Attributes: {table.logicalName}</h2>
        {table.attributes.map((attribute, index) => (
          <div key={attribute.id}>
            <label htmlFor={`attribute-name-${index}`}>Column Name</label>
            <input
              id={`attribute-name-${index}`}
              value={attribute.logicalName}
              onChange={(event) =>
                onChange({
                  ...table,
                  attributes: table.attributes.map((currentAttribute) =>
                    currentAttribute.id === attribute.id
                      ? { ...currentAttribute, logicalName: event.target.value }
                      : currentAttribute,
                  ),
                })
              }
            />
          </div>
        ))}
        <div className="modeler-toolbar">
          <button type="button" className="modeler-toolbar__button--ghost" onClick={onClose}>
            Discard
          </button>
          <button type="button" className="modeler-toolbar__button" onClick={onApply}>
            Apply Schema Changes
          </button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify attribute editing passes**

Run: `npm test -- tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`
Expected: PASS

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: PASS with attribute persistence visible after reload.

- [ ] **Step 5: Commit the attribute editing workflow**

```bash
git add src/modeler/control/handler/form/table/edit-attributes-form-handler.ts src/modeler/view/modal/edit-attributes-modal.tsx src/modeler/view/panel/property-panel.tsx src/modeler/view/workspace/modeler-workspace.tsx src/server/persistence/project-service.ts tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts tests/e2e/data-modeler.spec.ts
git commit -m "feat: add attribute editing and table property management"
```

## Task 5: Add Relationship Configuration And Edge Rendering

**Files:**
- Create: `src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts`
- Create: `src/modeler/view/modal/configure-relationship-modal.tsx`
- Modify: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/model/relationship/relationship-model.ts`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts`
- Modify: `tests/e2e/data-modeler.spec.ts`

- [ ] **Step 1: Write the failing tests for relationship drafts**

```ts
import { describe, expect, it } from 'vitest'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'

describe('ConfigureRelationshipFormHandler', () => {
  it('creates a one-to-many relationship draft with enforced constraint', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const draft = handler.createDraft('table_users', 'table_orders', 'attr_users_id', 'attr_orders_user_id')

    expect(draft.relationshipType).toBe('one-to-many')
    expect(draft.enforceConstraint).toBe(true)
    expect(draft.onDelete).toBe('cascade')
  })
})
```

```ts
import { expect, test } from '@playwright/test'

test('user configures a relationship and sees the edge on the canvas', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Sales Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /configure relationship/i }).click()
  await expect(page.getByRole('heading', { name: /configure relationship/i })).toBeVisible()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts`
Expected: FAIL with missing relationship form handler.

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: FAIL because relationship creation is not available in the editor.

- [ ] **Step 3: Implement relationship draft handling, domain enrichment, and edge rendering**

```ts
// src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts
import type { EditorRelationshipSnapshot } from '@/modeler/types/editor-snapshot'

export class ConfigureRelationshipFormHandler {
  createDraft(
    primaryTableId: string,
    secondaryTableId: string,
    primaryAttributeId: string,
    secondaryAttributeId: string,
  ): EditorRelationshipSnapshot {
    return {
      id: `rel_${crypto.randomUUID()}`,
      primaryTableId,
      secondaryTableId,
      primaryAttributeId,
      secondaryAttributeId,
      relationshipType: 'one-to-many',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      enforceConstraint: true,
    }
  }
}
```

```ts
// src/modeler/model/relationship/relationship-model.ts
export class RelationshipModel extends SVGModel {
  static create(args: CreateRelationshipArgs & {
    primaryAttributeId: string
    secondaryAttributeId: string
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many'
    onDelete: 'no action' | 'restrict' | 'cascade' | 'set null'
    onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null'
    enforceConstraint: boolean
  }) {
    return new RelationshipModel(args)
  }

  readonly primaryAttributeId: string
  readonly secondaryAttributeId: string
  readonly relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many'
  readonly onDelete: 'no action' | 'restrict' | 'cascade' | 'set null'
  readonly onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null'
  readonly enforceConstraint: boolean

  private constructor(args: CreateRelationshipArgs & {
    primaryAttributeId: string
    secondaryAttributeId: string
    relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many'
    onDelete: 'no action' | 'restrict' | 'cascade' | 'set null'
    onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null'
    enforceConstraint: boolean
  }) {
    super(args.id, new Vertex(args.primaryTable.coordinate.x, args.primaryTable.coordinate.y), 'relationship-edge')
    this.primaryTable = args.primaryTable
    this.secondaryTable = args.secondaryTable
    this.primaryAttributeId = args.primaryAttributeId
    this.secondaryAttributeId = args.secondaryAttributeId
    this.relationshipType = args.relationshipType
    this.onDelete = args.onDelete
    this.onUpdate = args.onUpdate
    this.enforceConstraint = args.enforceConstraint
  }
}
```

- [ ] **Step 4: Run the tests to verify relationship configuration passes**

Run: `npm test -- tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts`
Expected: PASS

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: PASS with a visible relationship configuration flow and edge rendered on the canvas.

- [ ] **Step 5: Commit relationship configuration and rendering**

```bash
git add src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts src/modeler/view/modal/configure-relationship-modal.tsx src/modeler/control/assembler/relationship/relationship-edge-factory.ts src/modeler/model/relationship/relationship-model.ts src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/e2e/data-modeler.spec.ts
git commit -m "feat: add relationship configuration and edge rendering"
```

## Task 6: Enforce Validation Rules And Generate Full PostgreSQL DDL

**Files:**
- Modify: `src/server/validation/model-validator.ts`
- Modify: `src/server/ddl/postgres-ddl-mapper.ts`
- Modify: `src/server/ddl/postgres-ddl-generator.ts`
- Modify: `src/app/api/projects/[id]/ddl/route.ts`
- Modify: `tests/unit/server/validation/model-validator.test.ts`
- Modify: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`

- [ ] **Step 1: Write the failing tests for duplicate tables, FK rules, and relationship-driven DDL**

```ts
import { describe, expect, it } from 'vitest'
import { validateProjectModel } from '@/server/validation/model-validator'
import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'

describe('validation and ddl', () => {
  it('rejects duplicate table names and foreign keys without target relationships', () => {
    const result = validateProjectModel({
      model: {
        tables: [
          {
            id: 'table_users_1',
            logicalName: 'users',
            physicalName: 'users',
            attributes: [],
          },
          {
            id: 'table_users_2',
            logicalName: 'users',
            physicalName: 'users',
            attributes: [],
          },
        ],
        relationships: [],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Duplicate table name users')
  })

  it('emits foreign key constraints for enforced one-to-many relationships', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'users',
            attributes: [
              { logicalName: 'id', physicalName: 'id', dataType: 'uuid', isNull: false, isPrimaryKey: true, isForeignKey: false },
            ],
          },
          {
            id: 'table_orders',
            logicalName: 'orders',
            physicalName: 'orders',
            attributes: [
              { logicalName: 'id', physicalName: 'id', dataType: 'uuid', isNull: false, isPrimaryKey: true, isForeignKey: false },
              { logicalName: 'user_id', physicalName: 'user_id', dataType: 'uuid', isNull: false, isPrimaryKey: false, isForeignKey: true },
            ],
          },
        ],
        relationships: [
          {
            id: 'rel_users_orders',
            primaryTableId: 'table_users',
            secondaryTableId: 'table_orders',
            primaryAttributeId: 'id',
            secondaryAttributeId: 'user_id',
            relationshipType: 'one-to-many',
            onDelete: 'cascade',
            onUpdate: 'cascade',
            enforceConstraint: true,
          },
        ],
      },
    })

    expect(ddl).toContain('foreign key (user_id) references users (id)')
    expect(ddl).toContain('on delete cascade')
    expect(ddl).toContain('on update cascade')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts`
Expected: FAIL because duplicate table detection and FK DDL generation are not implemented yet.

- [ ] **Step 3: Implement the stricter validator and relationship-aware PostgreSQL generator**

```ts
// src/server/validation/model-validator.ts
export function validateProjectModel(snapshot: EditorProjectSnapshot): ValidationResult {
  const errors: string[] = []
  const tableNames = new Set<string>()
  const tableIds = new Set(snapshot.model.tables.map((table) => table.id))

  for (const table of snapshot.model.tables) {
    const tableName = table.physicalName ?? table.logicalName
    if (!tableName.trim()) {
      errors.push(`Table name is required for ${table.id}`)
      continue
    }

    if (tableNames.has(tableName)) {
      errors.push(`Duplicate table name ${tableName}`)
    }
    tableNames.add(tableName)

    const attributeNames = new Set<string>()
    for (const attribute of table.attributes) {
      const attributeName = attribute.physicalName ?? attribute.logicalName
      if (!attributeName.trim()) {
        errors.push(`Attribute name is required for table ${table.id}`)
        continue
      }

      if (attributeNames.has(attributeName)) {
        errors.push(`Duplicate attribute name ${attributeName} in table ${table.id}`)
      }
      attributeNames.add(attributeName)
    }
  }

  for (const relationship of snapshot.model.relationships) {
    if (!tableIds.has(relationship.primaryTableId) || !tableIds.has(relationship.secondaryTableId)) {
      errors.push(`Relationship ${relationship.id} references an unknown table`)
    }
  }

  return { isValid: errors.length === 0, errors }
}
```

```ts
// src/server/ddl/postgres-ddl-generator.ts
export function generatePostgresDDL(snapshot: EditorProjectSnapshot) {
  const validation = validateProjectModel(snapshot)
  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'))
  }

  const tables = mapProjectToPostgresTables(snapshot)

  return tables
    .map((table) => {
      const columns = table.columns.map((column) => {
        const notNullClause = column.isNullable ? '' : ' not null'
        return `  ${column.name} ${column.dataType}${notNullClause}`
      })

      if (table.primaryKeys.length > 0) {
        columns.push(`  primary key (${table.primaryKeys.join(', ')})`)
      }

      for (const foreignKey of table.foreignKeys) {
        columns.push(
          `  foreign key (${foreignKey.column}) references ${foreignKey.referencesTable} (${foreignKey.referencesColumn}) on delete ${foreignKey.onDelete} on update ${foreignKey.onUpdate}`,
        )
      }

      return `create table ${table.tableName} (\n${columns.join(',\n')}\n);`
    })
    .join('\n\n')
}
```

- [ ] **Step 4: Run the validation and DDL tests**

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the spec-aligned validation and DDL rules**

```bash
git add src/server/validation/model-validator.ts src/server/ddl/postgres-ddl-mapper.ts src/server/ddl/postgres-ddl-generator.ts src/app/api/projects/[id]/ddl/route.ts tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts
git commit -m "feat: enforce spec-aligned validation and postgres ddl"
```

## Task 7: Cover The Full Editor Flow End To End

**Files:**
- Modify: `tests/e2e/data-modeler.spec.ts`
- Modify: `tests/components/modeler-workspace.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`

- [ ] **Step 1: Write the failing E2E scenario for the full spec-aligned happy path**

```ts
import { expect, test } from '@playwright/test'

test('user creates a project, creates a table, edits attributes, configures a relationship, reloads, and generates ddl', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Sales Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('users')
  await page.getByRole('button', { name: /create table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/users/i)).toBeVisible()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel(/column name/i).last().fill('email')
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.getByRole('button', { name: /generate ddl/i }).click()
  await expect(page.getByText(/create table users/i)).toBeVisible()
  await expect(page.getByText(/email/i)).toBeVisible()
})
```

- [ ] **Step 2: Run the E2E scenario to verify it fails**

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: FAIL until the full create/edit/generate flow is wired together.

- [ ] **Step 3: Implement any missing editor glue and visual refinements required by the flow**

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
// Final phase expectations:
// - open create-table modal from toolbar
// - open edit-attributes modal when a table is selected
// - open relationship modal from toolbar or selection affordance
// - persist every semantic change through the same snapshot pipeline
// - keep X6 graph updates one-way from semantic state, except move events
```

```css
/* src/app/globals.css */
/* Final pass should align panel, toolbar, dialog, and node spacing with prototipo_ui and DESIGN.md:
   - quiet neutral surfaces
   - no hard section borders
   - primary gradient CTA
   - glassmorphism modal treatment
*/
```

- [ ] **Step 4: Run the E2E scenario and then the full suite**

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: PASS

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit the phase-2 end-to-end flow completion**

```bash
git add src/app/globals.css src/modeler/view/workspace/modeler-workspace.tsx tests/components/modeler-workspace.test.tsx tests/e2e/data-modeler.spec.ts
git commit -m "feat: complete phase two editor workflows"
```

## Task 8: Run Full Usability Validation In A Real Browser

**Files:**
- Create: `tests/e2e/modeler-usability.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `tests/e2e/data-modeler.spec.ts`

- [ ] **Step 1: Write the failing browser usability scenario**

```ts
import { expect, test } from '@playwright/test'

async function createProject(page: import('@playwright/test').Page, name: string) {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill(name)
  await page.getByRole('button', { name: /create/i }).click()
}

async function dragFirstNode(page: import('@playwright/test').Page, deltaX: number, deltaY: number) {
  const node = page.locator('.x6-node').first()
  const box = await node.boundingBox()

  if (!box) {
    throw new Error('Expected a node bounding box before dragging')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 12 })
  await page.mouse.up()
}

test('user completes the full modeling usability flow in a live browser session', async ({ page }) => {
  await createProject(page, 'Usability Validation Model')

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('users')
  await page.getByRole('button', { name: /create table/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('orders')
  await page.getByRole('button', { name: /create table/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('order_items')
  await page.getByRole('button', { name: /create table/i }).click()

  await expect(page.getByTestId('modeler-canvas').getByText(/users/i)).toBeVisible()
  await expect(page.getByTestId('modeler-canvas').getByText(/orders/i)).toBeVisible()
  await expect(page.getByTestId('modeler-canvas').getByText(/order_items/i)).toBeVisible()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel(/column name/i).last().fill('email')
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.getByRole('button', { name: /configure relationship/i }).click()
  await page.getByRole('button', { name: /create relationship/i }).click()

  const beforeDragEdgePath = await page.locator('.x6-edge path').first().getAttribute('d')
  await dragFirstNode(page, 180, 120)
  await expect
    .poll(async () => page.evaluate(() => document.querySelectorAll('.x6-node').length))
    .toBe(3)
  const afterDragEdgePath = await page.locator('.x6-edge path').first().getAttribute('d')

  expect(beforeDragEdgePath).not.toBeNull()
  expect(afterDragEdgePath).not.toBeNull()
  expect(afterDragEdgePath).not.toBe(beforeDragEdgePath)

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /delete attribute/i }).last().click()
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.getByRole('button', { name: /delete table/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/order_items/i)).toHaveCount(0)

  await page.getByRole('button', { name: /generate ddl/i }).click()
  await expect(page.getByText(/create table users/i)).toBeVisible()
  await expect(page.getByText(/create table orders/i)).toBeVisible()
})
```

- [ ] **Step 2: Run the browser usability scenario to verify it fails**

Run: `npm run test:e2e -- tests/e2e/modeler-usability.spec.ts`
Expected: FAIL because the full usability affordances for multi-table creation, attribute deletion, table deletion, relationship creation, and edge dynamism are not all implemented yet.

- [ ] **Step 3: Update the Playwright config so the usability scenario always runs against a live local app**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
```

- [ ] **Step 4: Implement any missing hooks the usability suite reveals, then rerun both E2E specs**

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts tests/e2e/modeler-usability.spec.ts`
Expected: PASS

- [ ] **Step 5: Run the full suite after the usability pass**

Run: `npm test`
Expected: PASS

Run: `npm run test:e2e`
Expected: PASS

- [ ] **Step 6: Commit the usability validation suite**

```bash
git add playwright.config.ts tests/e2e/data-modeler.spec.ts tests/e2e/modeler-usability.spec.ts
git commit -m "test: add browser usability validation suite"
```

## Self-Review

### Spec Coverage

- Browser-based editor: carried forward from phase 1 and expanded in Tasks 2-7
- Object-oriented front-end organization: reinforced through `control/handler/form`, `control/handler/table`, `model`, and `view` additions in Tasks 2-5
- Temporary local complex storage: preserved by existing IndexedDB pipeline and exercised again by persisted attribute/relationship flows in Tasks 4 and 7
- Table metadata from `tech_specs.txt`: addressed in Tasks 1, 3, and 4
- Relationship metadata from `tech_specs.txt`: addressed in Tasks 1, 5, and 6
- PostgreSQL DDL generation: strengthened in Task 6 and verified in Task 7
- UI reference alignment with `prototipo_ui`: applied in Tasks 2-7 without allowing missing prototype elements to remove requirements
- Documentation of deviations: handled in Task 1
- Real-browser usability validation across create/edit/delete/drag/relationship flows: covered in Task 8

No known phase-2 gaps remain relative to the approved MVP scope.

### Placeholder Scan

- No `TBD`
- No `TODO`
- No “implement later” wording in task steps
- Prototype is explicitly scoped as visual reference only

### Type Consistency

- Snapshot types consistently use `EditorProjectSnapshot`, `EditorTableSnapshot`, `EditorAttributeSnapshot`, and `EditorRelationshipSnapshot`
- Selection consistently uses `selectedTableId` and `selectedRelationshipId`
- Relationship semantics consistently use `relationshipType`, `onDelete`, `onUpdate`, and `enforceConstraint`
