# Data Modeler Phase 3 Spec Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the main remaining gaps between the current browser-based MVP and the richer object model described in `tech_specs.txt`, with foco em metadados completos, visão lógica/física, relacionamentos editáveis e DDL PostgreSQL mais fiel ao modelo.

**Architecture:** This phase preserves the approved `Next.js + Route Handlers + Supabase + X6` architecture and the existing `src/modeler/control`, `src/modeler/model`, and `src/modeler/view` split. The implementation continues to use the typed `EditorProjectSnapshot` as the canonical state exchanged between browser, local IndexedDB cache, and persistence, while pushing more of the remaining spec behavior into dedicated controllers, handlers, and view assemblies.

**Tech Stack:** Next.js App Router, React, TypeScript, AntV X6, Supabase Postgres, IndexedDB, Vitest, Testing Library, Playwright

---

## Scope For Phase 3

This phase intentionally stays inside the approved MVP boundary:

- no authentication
- no multi-user collaboration
- no reverse engineering from SQL
- no additional database dialects beyond PostgreSQL

This phase is specifically about **spec fidelity and editor refinement**, not product-line expansion.

## Reference Hierarchy

Use these inputs in this order whenever a decision is needed:

1. `tech_specs.txt`
2. `docs/superpowers/specs/2026-04-20-data-modeler-mvp-design.md`
3. `docs/architecture/approved-deviations.md`
4. `prototipo_ui/**` for visual hierarchy and interaction cues only

## File Structure Map

**Table and attribute metadata editing**

- Create: `src/modeler/control/handler/form/table/edit-table-details-form-handler.ts`
- Modify: `src/modeler/control/handler/form/table/edit-attributes-form-handler.ts`
- Create: `src/modeler/view/modal/edit-table-details-modal.tsx`
- Modify: `src/modeler/view/modal/edit-attributes-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`

**Logical/physical view mode**

- Modify: `src/modeler/enum/view-mode.ts`
- Create: `src/modeler/control/handler/workspace/view-mode-controller.ts`
- Modify: `src/modeler/control/assembler/table/table-node-factory.ts`
- Modify: `src/modeler/view/panel/property-panel.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Modify: `src/modeler/types/editor-snapshot.ts`

**Relationship lifecycle and richer edge semantics**

- Modify: `src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts`
- Modify: `src/modeler/model/relationship/relationship-model.ts`
- Modify: `src/modeler/model/relationship/segment/relationship-segment.ts`
- Modify: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/view/modal/configure-relationship-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`

**PostgreSQL catalog, validation, and DDL**

- Create: `src/server/catalog/postgres-data-types.ts`
- Modify: `src/server/validation/model-validator.ts`
- Modify: `src/server/ddl/postgres-ddl-mapper.ts`
- Modify: `src/server/ddl/postgres-ddl-generator.ts`
- Modify: `src/app/api/projects/[id]/ddl/route.ts`

**Tests**

- Create: `tests/unit/modeler/control/form/edit-table-details-form-handler.test.ts`
- Modify: `tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`
- Create: `tests/unit/modeler/control/workspace/view-mode-controller.test.ts`
- Modify: `tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts`
- Modify: `tests/unit/modeler/model/relationship-model.test.ts`
- Modify: `tests/unit/server/validation/model-validator.test.ts`
- Modify: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`
- Modify: `tests/components/modeler-workspace.test.tsx`
- Create: `tests/e2e/modeler-phase-3.spec.ts`

---

## Task 1: Add Full Table Identity And Attribute Metadata Editing

**Files:**
- Create: `src/modeler/control/handler/form/table/edit-table-details-form-handler.ts`
- Modify: `src/modeler/control/handler/form/table/edit-attributes-form-handler.ts`
- Create: `src/modeler/view/modal/edit-table-details-modal.tsx`
- Modify: `src/modeler/view/modal/edit-attributes-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/form/edit-table-details-form-handler.test.ts`
- Test: `tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`

- [ ] **Step 1: Write the failing tests for table details and richer attribute metadata**

```ts
import { describe, expect, it } from 'vitest'
import { EditTableDetailsFormHandler } from '@/modeler/control/handler/form/table/edit-table-details-form-handler'

describe('EditTableDetailsFormHandler', () => {
  it('updates logical and physical names without dropping schema', () => {
    const handler = new EditTableDetailsFormHandler()
    const next = handler.apply({
      id: 'table_users',
      logicalName: 'users',
      physicalName: null,
      schema: 'public',
      coordinate: { x: 72, y: 72 },
      attributes: [],
    }, {
      logicalName: 'users_account',
      physicalName: 'tb_users_account',
      schema: 'identity',
    })

    expect(next.logicalName).toBe('users_account')
    expect(next.physicalName).toBe('tb_users_account')
    expect(next.schema).toBe('identity')
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'

describe('EditAttributesFormHandler', () => {
  it('updates nullable, size, names, and text metadata for an attribute', () => {
    const handler = new EditAttributesFormHandler()
    const [next] = handler.updateAttribute([
      {
        id: 'attr_users_email',
        logicalName: 'email',
        physicalName: 'email',
        dataType: 'varchar',
        size: null,
        isNull: true,
        isPrimaryKey: false,
        isForeignKey: false,
        definition: null,
        example: null,
        domain: null,
      },
    ], 'attr_users_email', {
      physicalName: 'email_address',
      size: '255',
      isNull: false,
      definition: 'Main user contact address',
      example: 'person@example.com',
      domain: 'valid email',
    })

    expect(next.physicalName).toBe('email_address')
    expect(next.size).toBe('255')
    expect(next.isNull).toBe(false)
    expect(next.definition).toContain('contact')
  })
})
```

- [ ] **Step 2: Run the unit tests to verify the new behaviors fail**

Run: `npm test -- tests/unit/modeler/control/form/edit-table-details-form-handler.test.ts tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`

Expected: FAIL because `EditTableDetailsFormHandler` does not exist and `EditAttributesFormHandler` does not yet expose a metadata update method.

- [ ] **Step 3: Implement the richer form handlers and the matching modal fields**

```ts
// src/modeler/control/handler/form/table/edit-table-details-form-handler.ts
import type { EditorTableSnapshot } from '@/modeler/types/editor-snapshot'

export class EditTableDetailsFormHandler {
  apply(
    table: EditorTableSnapshot,
    patch: Pick<EditorTableSnapshot, 'logicalName' | 'physicalName' | 'schema'>,
  ): EditorTableSnapshot {
    return {
      ...table,
      logicalName: patch.logicalName,
      physicalName: patch.physicalName,
      schema: patch.schema,
    }
  }
}
```

```ts
// src/modeler/control/handler/form/table/edit-attributes-form-handler.ts
updateAttribute(
  attributes: EditorAttributeSnapshot[],
  attributeId: string,
  patch: Partial<EditorAttributeSnapshot>,
) {
  return attributes.map((attribute) =>
    attribute.id === attributeId
      ? {
          ...attribute,
          ...patch,
        }
      : attribute,
  )
}
```

```tsx
// src/modeler/view/modal/edit-attributes-modal.tsx
<label htmlFor={`attribute-physical-name-${index}`}>Physical name</label>
<input
  id={`attribute-physical-name-${index}`}
  aria-label="Physical name"
  value={attribute.physicalName ?? ''}
  onChange={(event) =>
    onChange({
      ...table,
      attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
        physicalName: event.target.value || null,
      }),
    })
  }
/>

<label htmlFor={`attribute-size-${index}`}>Size</label>
<input
  id={`attribute-size-${index}`}
  aria-label="Size"
  value={attribute.size ?? ''}
  onChange={(event) =>
    onChange({
      ...table,
      attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
        size: event.target.value || null,
      }),
    })
  }
/>

<label>
  <input
    type="checkbox"
    checked={!attribute.isNull}
    onChange={(event) =>
      onChange({
        ...table,
        attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
          isNull: !event.target.checked,
        }),
      })
    }
  />
  Not null
</label>
```

- [ ] **Step 4: Wire the new modal into the workspace and verify the tests pass**

Run: `npm test -- tests/unit/modeler/control/form/edit-table-details-form-handler.test.ts tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts tests/components/modeler-workspace.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the table details and metadata editor**

```bash
git add src/modeler/control/handler/form/table/edit-table-details-form-handler.ts src/modeler/control/handler/form/table/edit-attributes-form-handler.ts src/modeler/view/modal/edit-table-details-modal.tsx src/modeler/view/modal/edit-attributes-modal.tsx src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/form/edit-table-details-form-handler.test.ts tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts tests/components/modeler-workspace.test.tsx
git commit -m "feat: add full table and attribute metadata editing"
```

## Task 2: Expose Logical And Physical View Mode Across The Editor

**Files:**
- Modify: `src/modeler/enum/view-mode.ts`
- Create: `src/modeler/control/handler/workspace/view-mode-controller.ts`
- Modify: `src/modeler/control/assembler/table/table-node-factory.ts`
- Modify: `src/modeler/types/editor-snapshot.ts`
- Modify: `src/modeler/view/panel/property-panel.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/workspace/view-mode-controller.test.ts`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing tests for logical/physical mode switching**

```ts
import { describe, expect, it } from 'vitest'
import { ViewModeController } from '@/modeler/control/handler/workspace/view-mode-controller'
import { ViewMode } from '@/modeler/enum/view-mode'

describe('ViewModeController', () => {
  it('switches from logical to physical mode', () => {
    const controller = new ViewModeController()
    expect(controller.toggle(ViewMode.Logical)).toBe(ViewMode.Physical)
  })
})
```

```tsx
it('renders physical names when the snapshot metadata is in physical mode', () => {
  render(
    <ModelerWorkspace
      projectId="proj_1"
      initialProject={{
        project: { id: 'proj_1', name: 'Sales', description: '' },
        model: {
          tables: [
            {
              id: 'table_users',
              logicalName: 'users',
              physicalName: 'tb_users',
              schema: 'public',
              coordinate: { x: 72, y: 72 },
              attributes: [
                {
                  id: 'attr_users_id',
                  logicalName: 'id',
                  physicalName: 'user_id',
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
        metadata: { viewMode: 'physical', postgresVersion: 'default' },
      }}
    />,
  )

  expect(screen.getByText(/tb_users/i)).toBeInTheDocument()
  expect(screen.getByText(/user_id/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the mode tests to confirm they fail**

Run: `npm test -- tests/unit/modeler/control/workspace/view-mode-controller.test.ts tests/components/modeler-workspace.test.tsx`

Expected: FAIL because there is no dedicated controller and the workspace still renders only logical names.

- [ ] **Step 3: Implement the controller, toolbar toggle, and mode-aware node rendering**

```ts
// src/modeler/control/handler/workspace/view-mode-controller.ts
import { ViewMode } from '@/modeler/enum/view-mode'

export class ViewModeController {
  toggle(mode: ViewMode) {
    return mode === ViewMode.Logical ? ViewMode.Physical : ViewMode.Logical
  }
}
```

```ts
// src/modeler/control/assembler/table/table-node-factory.ts
export function createTableNodeDefinition(table: TableModel, viewMode: ViewMode): Node.Metadata {
  const resolveName = (logicalName: string | null, physicalName: string | null) =>
    viewMode === ViewMode.Physical ? physicalName ?? logicalName ?? 'unnamed' : logicalName ?? physicalName ?? 'unnamed'

  const lines = attributes.map((attribute) => {
    const attributeName = resolveName(attribute.logicalName, attribute.physicalName)
    const dataType = attribute.dataType?.toUpperCase() ?? 'TEXT'
    const sizeSuffix = attribute.size ? `(${attribute.size})` : ''
    return `${attributeName} ${dataType}${sizeSuffix}`.trim()
  })

  return {
    ...baseNode,
    attrs: {
      ...baseNode.attrs,
      label: {
        ...baseNode.attrs.label,
        text: [resolveName(table.tableName.logicalName, table.tableName.physicalName), ...lines].join('\n'),
      },
    },
  }
}
```

- [ ] **Step 4: Verify the mode-aware rendering passes**

Run: `npm test -- tests/unit/modeler/control/workspace/view-mode-controller.test.ts tests/components/modeler-workspace.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the logical/physical mode support**

```bash
git add src/modeler/enum/view-mode.ts src/modeler/control/handler/workspace/view-mode-controller.ts src/modeler/control/assembler/table/table-node-factory.ts src/modeler/view/panel/property-panel.tsx src/modeler/view/workspace/modeler-workspace.tsx src/modeler/types/editor-snapshot.ts tests/unit/modeler/control/workspace/view-mode-controller.test.ts tests/components/modeler-workspace.test.tsx
git commit -m "feat: add logical and physical view mode"
```

## Task 3: Make Relationships Fully Editable And Richer On The Canvas

**Files:**
- Modify: `src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts`
- Modify: `src/modeler/model/relationship/relationship-model.ts`
- Modify: `src/modeler/model/relationship/segment/relationship-segment.ts`
- Modify: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/view/modal/configure-relationship-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts`
- Test: `tests/unit/modeler/model/relationship-model.test.ts`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing tests for editing and deleting relationships**

```ts
import { describe, expect, it } from 'vitest'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'

describe('ConfigureRelationshipFormHandler', () => {
  it('updates delete and update actions for an existing relationship', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const next = handler.applyPatch({
      id: 'rel_users_orders',
      primaryTableId: 'table_users',
      secondaryTableId: 'table_orders',
      primaryAttributeId: 'attr_users_id',
      secondaryAttributeId: 'attr_orders_user_id',
      relationshipType: 'one-to-many',
      onDelete: 'cascade',
      onUpdate: 'cascade',
      enforceConstraint: true,
    }, {
      onDelete: 'restrict',
      onUpdate: 'no action',
      enforceConstraint: false,
    })

    expect(next.onDelete).toBe('restrict')
    expect(next.onUpdate).toBe('no action')
    expect(next.enforceConstraint).toBe(false)
  })
})
```

```ts
it('stores relationship segments derived from the connected tables', () => {
  const relationship = RelationshipModel.create({
    id: 'rel_users_orders',
    primaryTable: source,
    secondaryTable: target,
    primaryAttributeId: 'attr_users_id',
    secondaryAttributeId: 'attr_orders_user_id',
    relationshipType: 'one-to-many',
    onDelete: 'cascade',
    onUpdate: 'cascade',
    enforceConstraint: true,
  })

  expect(relationship.segmentList.length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run the relationship tests to verify the current code is insufficient**

Run: `npm test -- tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts`

Expected: FAIL because the handler has no patch flow and `RelationshipModel` does not expose a segment list.

- [ ] **Step 3: Implement relationship editing, deletion, and segment-aware edge labels**

```ts
// src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts
applyPatch(
  relationship: EditorRelationshipSnapshot,
  patch: Partial<EditorRelationshipSnapshot>,
) {
  return {
    ...relationship,
    ...patch,
  }
}
```

```ts
// src/modeler/model/relationship/segment/relationship-segment.ts
import { Vertex } from '@/modeler/model/vertex'

export class RelationshipSegment {
  constructor(
    public readonly source: Vertex,
    public readonly target: Vertex,
    public readonly label: string,
  ) {}
}
```

```ts
// src/modeler/control/assembler/relationship/relationship-edge-factory.ts
export function createRelationshipEdgeDefinition(relationship: RelationshipModel): Edge.Metadata {
  const label =
    relationship.relationshipType === 'one-to-one'
      ? '1:1'
      : relationship.relationshipType === 'many-to-many'
        ? 'N:N'
        : '1:N'

  return {
    id: relationship.identification,
    source: relationship.primaryTable.identification,
    target: relationship.secondaryTable.identification,
    connector: { name: 'rounded' },
    labels: [
      {
        attrs: {
          label: {
            text: label,
            fill: '#435368',
            fontSize: 12,
          },
        },
      },
    ],
    attrs: {
      line: {
        stroke: '#0053db',
        strokeWidth: 2,
        targetMarker: 'classic',
      },
    },
  }
}
```

- [ ] **Step 4: Add relationship selection and property editing to the workspace, then rerun the tests**

Run: `npm test -- tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/components/modeler-workspace.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the richer relationship lifecycle**

```bash
git add src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts src/modeler/model/relationship/relationship-model.ts src/modeler/model/relationship/segment/relationship-segment.ts src/modeler/control/assembler/relationship/relationship-edge-factory.ts src/modeler/view/modal/configure-relationship-modal.tsx src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/components/modeler-workspace.test.tsx
git commit -m "feat: add editable relationship properties and richer edge rendering"
```

## Task 4: Harden PostgreSQL Catalog, Validation, And DDL Naming Rules

**Files:**
- Create: `src/server/catalog/postgres-data-types.ts`
- Modify: `src/server/validation/model-validator.ts`
- Modify: `src/server/ddl/postgres-ddl-mapper.ts`
- Modify: `src/server/ddl/postgres-ddl-generator.ts`
- Modify: `src/app/api/projects/[id]/ddl/route.ts`
- Test: `tests/unit/server/validation/model-validator.test.ts`
- Test: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`

- [ ] **Step 1: Write the failing tests for physical names, size-aware types, and relationship actions**

```ts
import { describe, expect, it } from 'vitest'
import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'

describe('generatePostgresDDL', () => {
  it('uses physical names and size-aware PostgreSQL types when available', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: 'tb_users',
            schema: 'identity',
            coordinate: { x: 72, y: 72 },
            attributes: [
              {
                id: 'attr_users_email',
                logicalName: 'email',
                physicalName: 'email_address',
                dataType: 'varchar',
                size: '255',
                isNull: false,
                isPrimaryKey: false,
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
    })

    expect(ddl).toContain('create table identity.tb_users')
    expect(ddl).toContain('email_address varchar(255) not null')
  })
})
```

```ts
it('rejects a relationship that points to a non-key primary attribute in one-to-many mode', () => {
  const result = validateProjectModel(snapshot)
  expect(result.errors).toContain('Relationship rel_users_orders must reference a primary key or unique parent column')
})
```

- [ ] **Step 2: Run the server-side tests to verify they fail first**

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts`

Expected: FAIL because schema-qualified table names, size formatting, and stricter relationship validation are not implemented.

- [ ] **Step 3: Implement the PostgreSQL catalog and the stricter mapper/generator**

```ts
// src/server/catalog/postgres-data-types.ts
export const postgresDataTypes = [
  { code: 'uuid', label: 'UUID', supportsSize: false },
  { code: 'varchar', label: 'VARCHAR', supportsSize: true },
  { code: 'numeric', label: 'NUMERIC', supportsSize: true },
  { code: 'text', label: 'TEXT', supportsSize: false },
] as const
```

```ts
// src/server/ddl/postgres-ddl-mapper.ts
const formatDataType = (column: EditorAttributeSnapshot) =>
  column.size && ['varchar', 'numeric'].includes(column.dataType ?? '')
    ? `${column.dataType}(${column.size})`
    : column.dataType ?? 'text'

return {
  tableName: `${table.schema}.${table.physicalName ?? table.logicalName}`,
  columns: table.attributes.map((attribute) => ({
    id: attribute.id,
    name: attribute.physicalName ?? attribute.logicalName,
    dataType: formatDataType(attribute),
    isNullable: attribute.isNull,
    isPrimaryKey: attribute.isPrimaryKey,
  })),
}
```

- [ ] **Step 4: Verify the server tests pass after the mapper and validator changes**

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts`

Expected: PASS

- [ ] **Step 5: Commit the PostgreSQL fidelity work**

```bash
git add src/server/catalog/postgres-data-types.ts src/server/validation/model-validator.ts src/server/ddl/postgres-ddl-mapper.ts src/server/ddl/postgres-ddl-generator.ts src/app/api/projects/[id]/ddl/route.ts tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts
git commit -m "feat: harden postgres metadata validation and ddl fidelity"
```

## Task 5: Verify The Full Phase 3 Flow End To End

**Files:**
- Modify: `tests/components/modeler-workspace.test.tsx`
- Create: `tests/e2e/modeler-phase-3.spec.ts`
- Modify: `tests/e2e/modeler-usability.spec.ts`
- Modify: `src/app/globals.css`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`

- [ ] **Step 1: Write the failing E2E scenario for phase 3 fidelity**

```ts
import { expect, test } from '@playwright/test'

test('user edits table identity, switches to physical mode, edits relationship actions, and exports spec-faithful ddl', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Spec Fidelity Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('users')
  await page.getByRole('button', { name: /create table/i }).click()

  await page.getByRole('button', { name: /edit table details/i }).click()
  await page.getByLabel('Physical table name').fill('tb_users')
  await page.getByLabel('Schema').fill('identity')
  await page.getByRole('button', { name: /apply table details/i }).click()

  await page.getByRole('button', { name: /switch to physical mode/i }).click()
  await expect(page.getByTestId('modeler-canvas').getByText(/tb_users/i)).toBeVisible()

  await page.getByRole('button', { name: /generate ddl/i }).click()
  await expect(page.getByText(/create table identity.tb_users/i)).toBeVisible()
})
```

- [ ] **Step 2: Run the phase-3 E2E test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/modeler-phase-3.spec.ts`

Expected: FAIL because the editor still lacks the full identity editor and physical mode flow.

- [ ] **Step 3: Implement the last missing UI glue and visual polish exposed by the E2E**

```css
/* src/app/globals.css */
.modeler-toolbar__button--toggle-active {
  background: #0053db;
  color: #ffffff;
}

.property-card {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
}
```

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
<button
  className={cn('modeler-toolbar__button', {
    'modeler-toolbar__button--toggle-active': viewMode === ViewMode.Physical,
  })}
  type="button"
  onClick={() => setViewMode(viewModeController.toggle(viewMode))}
>
  {viewMode === ViewMode.Logical ? 'Switch to physical mode' : 'Switch to logical mode'}
</button>
```

- [ ] **Step 4: Run the focused phase-3 E2E and then the whole suite**

Run: `npm run test:e2e -- tests/e2e/modeler-phase-3.spec.ts tests/e2e/modeler-usability.spec.ts`

Expected: PASS

Run: `npm test`

Expected: PASS

Run: `npm run test:e2e`

Expected: PASS

- [ ] **Step 5: Commit the phase-3 verification and polish**

```bash
git add src/app/globals.css src/modeler/view/workspace/modeler-workspace.tsx tests/components/modeler-workspace.test.tsx tests/e2e/modeler-phase-3.spec.ts tests/e2e/modeler-usability.spec.ts
git commit -m "test: verify phase three spec fidelity flows"
```

## Self-Review

### Spec Coverage

- Attribute metadata from `tech_specs.txt`: explicitly covered in Task 1
- Logical and physical naming rules from `tech_specs.txt`: explicitly covered in Task 2
- Relationship metadata and segment model from `tech_specs.txt`: explicitly covered in Task 3
- PostgreSQL-only DDL fidelity and naming rules: explicitly covered in Task 4
- End-to-end editor verification after all semantics are connected: explicitly covered in Task 5

### Placeholder Scan

- No `TBD`
- No `TODO`
- No “implement later”
- No hand-wavy validation/testing steps without exact commands

### Type Consistency

- The plan keeps `EditorProjectSnapshot`, `EditorTableSnapshot`, `EditorAttributeSnapshot`, and `EditorRelationshipSnapshot` as the canonical payload types
- `ViewMode` remains the single source of truth for logical/physical switching
- Relationship semantics consistently use `relationshipType`, `onDelete`, `onUpdate`, and `enforceConstraint`
