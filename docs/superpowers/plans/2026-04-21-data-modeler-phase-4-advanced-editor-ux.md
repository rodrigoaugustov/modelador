# Data Modeler Phase 4 Advanced Editor And UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the current browser-based modeler into a stronger editor with attribute ordering, editable and composite primary keys, composite foreign-key relationships, drag-to-create relationships, configurable relationship routing, anti-overlap safeguards, and a UI much closer to the approved prototype.

**Architecture:** This phase keeps the approved `Next.js + Route Handlers + Supabase + X6` architecture and the current `src/modeler/control`, `src/modeler/model`, and `src/modeler/view` split. The implementation extends `EditorProjectSnapshot` to capture richer table semantics, ordered attribute metadata, and multi-column relationship mappings while keeping React responsible for shell/layout and X6 responsible for graph interactions, routing, obstacle-aware edge rendering, and manual edge editing.

**Tech Stack:** Next.js App Router, React, TypeScript, AntV X6, Supabase Postgres, IndexedDB, Vitest, Testing Library, Playwright

---

## Scope For Phase 4

This phase intentionally focuses on editor quality and interaction depth:

- no authentication
- no multi-user collaboration
- no reverse engineering from SQL
- no legacy-project migration work
- no additional database dialects beyond PostgreSQL

Important scope boundary for this phase:

- **Composite primary keys are supported in table editing, rendering, validation, and PostgreSQL DDL**
- **Composite foreign keys are supported in relationship editing, validation, persistence, and PostgreSQL DDL**
- **Drag-to-create relationships seed the first column pair automatically; the user can add or remove additional column pairs in the relationship modal before saving**

## Reference Hierarchy

Use these inputs in this order whenever a decision is needed:

1. `tech_specs.txt`
2. `docs/superpowers/specs/2026-04-20-data-modeler-mvp-design.md`
3. `docs/architecture/approved-deviations.md`
4. `prototipo_ui/**` for visual hierarchy and interaction cues only

## File Structure Map

**Ordered attributes and editable composite PK**

- Create: `src/modeler/control/handler/form/table/reorder-attributes-form-handler.ts`
- Modify: `src/modeler/control/handler/form/table/edit-attributes-form-handler.ts`
- Modify: `src/modeler/model/table/text/table-attribute-text.ts`
- Modify: `src/modeler/types/editor-snapshot.ts`
- Modify: `src/modeler/util/model-serializer.ts`
- Modify: `src/modeler/control/assembler/table/table-node-factory.ts`
- Modify: `src/modeler/view/modal/edit-attributes-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`

**Composite PK/FK-aware validation and DDL**

- Modify: `src/server/validation/model-validator.ts`
- Modify: `src/server/ddl/postgres-ddl-mapper.ts`
- Modify: `src/server/ddl/postgres-ddl-generator.ts`
- Modify: `src/app/api/projects/[id]/ddl/route.ts`

**Drag-to-create relationships, composite mappings, and richer line configuration**

- Create: `src/modeler/enum/relationship-line-style.ts`
- Create: `src/modeler/control/action/workspace/relationship-drag-action.ts`
- Create: `src/modeler/control/handler/relationship/relationship-routing-controller.ts`
- Modify: `src/modeler/control/config/workspace-config.ts`
- Modify: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Modify: `src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts`
- Modify: `src/modeler/model/relationship/relationship-model.ts`
- Modify: `src/modeler/model/relationship/segment/relationship-segment.ts`
- Modify: `src/modeler/types/editor-snapshot.ts`
- Modify: `src/modeler/util/model-serializer.ts`
- Modify: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/view/modal/configure-relationship-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`

**Visual alignment, explicit selection, and soft anti-collision**

- Create: `src/modeler/control/util/table-collision-guard.ts`
- Modify: `src/modeler/view/panel/project-sidebar.tsx`
- Modify: `src/modeler/view/panel/property-panel.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Modify: `src/app/globals.css`

**Tests**

- Create: `tests/unit/modeler/control/form/reorder-attributes-form-handler.test.ts`
- Modify: `tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`
- Modify: `tests/unit/server/validation/model-validator.test.ts`
- Modify: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`
- Modify: `tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts`
- Modify: `tests/unit/modeler/model/relationship-model.test.ts`
- Modify: `tests/unit/modeler/types/editor-snapshot.test.ts`
- Modify: `tests/unit/modeler/util/model-serializer.test.ts`
- Create: `tests/unit/modeler/control/relationship-routing-controller.test.ts`
- Create: `tests/unit/modeler/control/util/table-collision-guard.test.ts`
- Modify: `tests/components/configure-relationship-modal.test.tsx`
- Modify: `tests/components/modeler-workspace.test.tsx`
- Create: `tests/e2e/modeler-phase-4.spec.ts`
- Modify: `tests/e2e/modeler-usability.spec.ts`

---

## Task 1: Add Attribute Ordering And Editable Composite Primary Keys

**Files:**
- Create: `src/modeler/control/handler/form/table/reorder-attributes-form-handler.ts`
- Modify: `src/modeler/control/handler/form/table/edit-attributes-form-handler.ts`
- Modify: `src/modeler/model/table/text/table-attribute-text.ts`
- Modify: `src/modeler/types/editor-snapshot.ts`
- Modify: `src/modeler/util/model-serializer.ts`
- Modify: `src/modeler/control/assembler/table/table-node-factory.ts`
- Modify: `src/modeler/view/modal/edit-attributes-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/form/reorder-attributes-form-handler.test.ts`
- Test: `tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing tests for attribute ordering and PK toggling**

```ts
import { describe, expect, it } from 'vitest'
import { ReorderAttributesFormHandler } from '@/modeler/control/handler/form/table/reorder-attributes-form-handler'

describe('ReorderAttributesFormHandler', () => {
  it('moves an attribute upward and rewrites displayOrder sequentially', () => {
    const handler = new ReorderAttributesFormHandler()
    const next = handler.move([
      { id: 'attr_a', logicalName: 'a', displayOrder: 0 },
      { id: 'attr_b', logicalName: 'b', displayOrder: 1 },
      { id: 'attr_c', logicalName: 'c', displayOrder: 2 },
    ] as any, 'attr_c', 'up')

    expect(next.map((attribute) => attribute.id)).toEqual(['attr_a', 'attr_c', 'attr_b'])
    expect(next.map((attribute) => attribute.displayOrder)).toEqual([0, 1, 2])
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'

describe('EditAttributesFormHandler', () => {
  it('allows toggling primary key state on an existing attribute without dropping other PKs', () => {
    const handler = new EditAttributesFormHandler()
    const next = handler.updateAttribute([
      { id: 'attr_company_id', logicalName: 'company_id', isPrimaryKey: true },
      { id: 'attr_branch_id', logicalName: 'branch_id', isPrimaryKey: false },
    ] as any, 'attr_branch_id', {
      isPrimaryKey: true,
      isNull: false,
    })

    const primaryKeys = next.filter((attribute) => attribute.isPrimaryKey)
    expect(primaryKeys.map((attribute) => attribute.id)).toEqual(['attr_company_id', 'attr_branch_id'])
  })
})
```

- [ ] **Step 2: Run the focused tests to verify the new behavior is not implemented**

Run: `npm test -- tests/unit/modeler/control/form/reorder-attributes-form-handler.test.ts tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts`

Expected: FAIL because there is no reorder handler and attributes do not yet carry ordering semantics.

- [ ] **Step 3: Extend the snapshot and handlers with ordering and PK editing**

```ts
// src/modeler/types/editor-snapshot.ts
export type EditorAttributeSnapshot = {
  id: string
  logicalName: string
  physicalName: string | null
  dataType: string | null
  size: string | null
  displayOrder: number
  isNull: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  definition: string | null
  example: string | null
  domain: string | null
}
```

```ts
// src/modeler/control/handler/form/table/reorder-attributes-form-handler.ts
import type { EditorAttributeSnapshot } from '@/modeler/types/editor-snapshot'

export class ReorderAttributesFormHandler {
  move(
    attributes: EditorAttributeSnapshot[],
    attributeId: string,
    direction: 'up' | 'down',
  ): EditorAttributeSnapshot[] {
    const currentIndex = attributes.findIndex((attribute) => attribute.id === attributeId)

    if (currentIndex < 0) {
      return attributes
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= attributes.length) {
      return attributes
    }

    const next = [...attributes]
    const [moved] = next.splice(currentIndex, 1)
    next.splice(targetIndex, 0, moved)

    return next.map((attribute, index) => ({
      ...attribute,
      displayOrder: index,
    }))
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
          isNull: patch.isPrimaryKey ? false : (patch.isNull ?? attribute.isNull),
        }
      : attribute,
  )
}
```

- [ ] **Step 4: Expose reordering and PK controls in the attribute modal and workspace**

```tsx
// src/modeler/view/modal/edit-attributes-modal.tsx
<div className="attribute-row__actions">
  <button type="button" onClick={() => onMoveAttribute(attribute.id, 'up')}>Move up</button>
  <button type="button" onClick={() => onMoveAttribute(attribute.id, 'down')}>Move down</button>
</div>

<label className="property-form__checkbox">
  <input
    aria-label="Primary key"
    type="checkbox"
    checked={attribute.isPrimaryKey}
    onChange={(event) =>
      onChange({
        ...table,
        attributes: editAttributesFormHandler.updateAttribute(table.attributes, attribute.id, {
          isPrimaryKey: event.target.checked,
          isNull: event.target.checked ? false : attribute.isNull,
        }),
      })
    }
  />
  Primary key
</label>
```

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
const orderedAttributes = [...table.attributes].sort((left, right) => left.displayOrder - right.displayOrder)
```

- [ ] **Step 5: Verify the ordering and composite PK tests pass, then commit**

Run: `npm test -- tests/unit/modeler/control/form/reorder-attributes-form-handler.test.ts tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts tests/components/modeler-workspace.test.tsx`

Expected: PASS

```bash
git add src/modeler/control/handler/form/table/reorder-attributes-form-handler.ts src/modeler/control/handler/form/table/edit-attributes-form-handler.ts src/modeler/model/table/text/table-attribute-text.ts src/modeler/types/editor-snapshot.ts src/modeler/util/model-serializer.ts src/modeler/control/assembler/table/table-node-factory.ts src/modeler/view/modal/edit-attributes-modal.tsx src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/form/reorder-attributes-form-handler.test.ts tests/unit/modeler/control/form/edit-attributes-form-handler.test.ts tests/components/modeler-workspace.test.tsx
git commit -m "feat: support ordered attributes and editable composite primary keys"
```

## Task 2: Make Validation And DDL Respect Ordered Columns, Composite PKs, And Composite FKs

**Files:**
- Modify: `src/server/validation/model-validator.ts`
- Modify: `src/server/ddl/postgres-ddl-mapper.ts`
- Modify: `src/server/ddl/postgres-ddl-generator.ts`
- Modify: `src/app/api/projects/[id]/ddl/route.ts`
- Test: `tests/unit/server/validation/model-validator.test.ts`
- Test: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing tests for ordered DDL, composite PK output, and composite FK clauses**

```ts
import { describe, expect, it } from 'vitest'
import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'

describe('generatePostgresDDL', () => {
  it('emits ordered columns, a composite primary key clause, and a composite foreign key clause', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_branch',
            logicalName: 'branch',
            physicalName: 'tb_branch',
            schema: 'public',
            coordinate: { x: 0, y: 0 },
            attributes: [
              { id: 'attr_company_id', logicalName: 'company_id', physicalName: 'company_id', dataType: 'uuid', size: null, displayOrder: 0, isNull: false, isPrimaryKey: true, isForeignKey: false, definition: null, example: null, domain: null },
              { id: 'attr_branch_id', logicalName: 'branch_id', physicalName: 'branch_id', dataType: 'uuid', size: null, displayOrder: 1, isNull: false, isPrimaryKey: true, isForeignKey: false, definition: null, example: null, domain: null },
              { id: 'attr_name', logicalName: 'name', physicalName: 'name', dataType: 'text', size: null, displayOrder: 2, isNull: false, isPrimaryKey: false, isForeignKey: false, definition: null, example: null, domain: null },
            ],
          },
          {
            id: 'table_order',
            logicalName: 'order',
            physicalName: 'tb_order',
            schema: 'public',
            coordinate: { x: 360, y: 0 },
            attributes: [
              { id: 'attr_order_id', logicalName: 'id', physicalName: 'id', dataType: 'uuid', size: null, displayOrder: 0, isNull: false, isPrimaryKey: true, isForeignKey: false, definition: null, example: null, domain: null },
              { id: 'attr_order_company_id', logicalName: 'company_id', physicalName: 'company_id', dataType: 'uuid', size: null, displayOrder: 1, isNull: false, isPrimaryKey: false, isForeignKey: true, definition: null, example: null, domain: null },
              { id: 'attr_order_branch_id', logicalName: 'branch_id', physicalName: 'branch_id', dataType: 'uuid', size: null, displayOrder: 2, isNull: false, isPrimaryKey: false, isForeignKey: true, definition: null, example: null, domain: null },
            ],
          },
        ],
        relationships: [
          {
            id: 'rel_branch_order',
            primaryTableId: 'table_branch',
            secondaryTableId: 'table_order',
            attributeMappings: [
              { id: 'map_0', primaryAttributeId: 'attr_company_id', secondaryAttributeId: 'attr_order_company_id', displayOrder: 0 },
              { id: 'map_1', primaryAttributeId: 'attr_branch_id', secondaryAttributeId: 'attr_order_branch_id', displayOrder: 1 },
            ],
            relationshipType: 'one-to-many',
            onDelete: 'cascade',
            onUpdate: 'cascade',
            enforceConstraint: true,
            lineStyle: 'orthogonal',
            vertices: [],
          },
        ],
      },
    })

    expect(ddl).toContain('company_id uuid not null,\n  branch_id uuid not null,\n  name text not null')
    expect(ddl).toContain('primary key (company_id, branch_id)')
    expect(ddl).toContain('foreign key (company_id, branch_id) references public.tb_branch (company_id, branch_id)')
  })
})
```

```ts
it('rejects a constrained relationship that does not map every parent key column exactly once', () => {
  const result = validateProjectModel(snapshot)
  expect(result.errors).toContain(
    'Relationship tb_branch.company_id + tb_branch.branch_id -> tb_order.company_id must map every constrained parent key column exactly once',
  )
})
```

- [ ] **Step 2: Run the focused server tests to confirm they fail first**

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts`

Expected: FAIL because column ordering, composite PK output, and composite FK output are not fully respected.

- [ ] **Step 3: Implement ordered column mapping and composite-PK/FK-aware validation**

```ts
// src/server/ddl/postgres-ddl-mapper.ts
const orderedAttributes = [...table.attributes].sort((left, right) => left.displayOrder - right.displayOrder)

const columns: PostgresColumn[] = orderedAttributes.map((attribute) => ({
  id: attribute.id,
  name: attribute.physicalName ?? attribute.logicalName,
  dataType: formatPostgresDataType({
    code: attribute.dataType,
    size: attribute.size,
  }),
  isNullable: attribute.isNull,
  isPrimaryKey: attribute.isPrimaryKey,
}))

const orderedMappings = [...relationship.attributeMappings].sort((left, right) => left.displayOrder - right.displayOrder)
const currentColumns = orderedMappings
  .map((mapping) => columns.find((column) => column.id === mapping.secondaryAttributeId))
  .filter(Boolean)
const referencedColumns = orderedMappings
  .map((mapping) => referencedTable?.attributes.find((attribute) => attribute.id === mapping.primaryAttributeId))
  .filter(Boolean)
```

```ts
// src/server/ddl/postgres-ddl-generator.ts
for (const foreignKey of table.foreignKeys) {
  columns.push(
    `  foreign key (${foreignKey.columns.join(', ')}) references ${foreignKey.referencesTable} (${foreignKey.referencesColumns.join(', ')}) on delete ${foreignKey.onDelete} on update ${foreignKey.onUpdate}`,
  )
}
```

```ts
// src/server/validation/model-validator.ts
const primaryKeyAttributes = primaryTable?.attributes.filter((attribute) => attribute.isPrimaryKey) ?? []
const mappedPrimaryIds = relationship.attributeMappings.map((mapping) => mapping.primaryAttributeId)

if (
  relationship.enforceConstraint &&
  relationship.relationshipType !== 'many-to-many' &&
  (
    relationship.attributeMappings.length !== primaryKeyAttributes.length ||
    new Set(mappedPrimaryIds).size !== relationship.attributeMappings.length ||
    !primaryKeyAttributes.every((attribute) => mappedPrimaryIds.includes(attribute.id))
  )
) {
  errors.push(
    `Relationship ${relationshipLabel} must map every constrained parent key column exactly once`,
  )
}
```

- [ ] **Step 4: Return clearer DDL failures to the UI and rerun the tests**

```ts
// src/app/api/projects/[id]/ddl/route.ts
return Response.json(
  {
    error: error instanceof Error ? error.message : 'Unable to generate DDL',
  },
  { status: 400 },
)
```

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts tests/components/modeler-workspace.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the composite key server work**

```bash
git add src/server/validation/model-validator.ts src/server/ddl/postgres-ddl-mapper.ts src/server/ddl/postgres-ddl-generator.ts src/app/api/projects/[id]/ddl/route.ts tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts tests/components/modeler-workspace.test.tsx
git commit -m "feat: support ordered ddl output and composite key constraints"
```

## Task 3: Add Drag-To-Create Relationships, Composite Column Mapping, And Prefilled Drafts

**Files:**
- Create: `src/modeler/enum/relationship-line-style.ts`
- Create: `src/modeler/control/action/workspace/relationship-drag-action.ts`
- Modify: `src/modeler/control/config/workspace-config.ts`
- Modify: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Modify: `src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts`
- Modify: `src/modeler/model/relationship/relationship-model.ts`
- Modify: `src/modeler/model/relationship/segment/relationship-segment.ts`
- Modify: `src/modeler/types/editor-snapshot.ts`
- Modify: `src/modeler/util/model-serializer.ts`
- Modify: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/view/modal/configure-relationship-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts`
- Test: `tests/unit/modeler/model/relationship-model.test.ts`
- Test: `tests/unit/modeler/types/editor-snapshot.test.ts`
- Test: `tests/unit/modeler/util/model-serializer.test.ts`
- Test: `tests/components/configure-relationship-modal.test.tsx`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing tests for drag-created relationship drafts, composite mappings, and line style state**

```ts
import { describe, expect, it } from 'vitest'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'

describe('ConfigureRelationshipFormHandler', () => {
  it('creates a draft from a dragged parent-child pair with the first mapping prefilled', () => {
    const handler = new ConfigureRelationshipFormHandler()
    const draft = handler.createDraftFromConnection({
      primaryTableId: 'table_users',
      secondaryTableId: 'table_orders',
      primaryAttributeId: 'attr_users_id',
      secondaryAttributeId: 'attr_orders_user_id',
    })

    expect(draft.primaryTableId).toBe('table_users')
    expect(draft.secondaryTableId).toBe('table_orders')
    expect(draft.attributeMappings).toEqual([
      {
        id: expect.any(String),
        primaryAttributeId: 'attr_users_id',
        secondaryAttributeId: 'attr_orders_user_id',
        displayOrder: 0,
      },
    ])
    expect(draft.lineStyle).toBe('orthogonal')
  })
})
```

```ts
it('stores explicit bend points and composite column mappings when manual routing is used', () => {
  const relationship = RelationshipModel.create({
    id: 'rel_users_orders',
    primaryTable: source,
    secondaryTable: target,
    attributeMappings: [
      { id: 'map_0', primaryAttributeId: 'attr_users_company_id', secondaryAttributeId: 'attr_orders_company_id', displayOrder: 0 },
      { id: 'map_1', primaryAttributeId: 'attr_users_branch_id', secondaryAttributeId: 'attr_orders_branch_id', displayOrder: 1 },
    ],
    relationshipType: 'one-to-many',
    lineStyle: 'orthogonal',
    vertices: [{ x: 200, y: 160 }],
  })

  expect(relationship.attributeMappings).toHaveLength(2)
  expect(relationship.vertices).toEqual([{ x: 200, y: 160 }])
})
```

- [ ] **Step 2: Run the focused relationship tests to confirm the drag flow is absent**

Run: `npm test -- tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/unit/modeler/types/editor-snapshot.test.ts tests/unit/modeler/util/model-serializer.test.ts tests/components/configure-relationship-modal.test.tsx`

Expected: FAIL because there is no drag-created draft with mapping rows, no relationship mapping collection, and no line-style state.

- [ ] **Step 3: Add relationship line style, mapping-row state, and drag action support**

```ts
// src/modeler/enum/relationship-line-style.ts
export const relationshipLineStyles = ['straight', 'orthogonal', 'curved'] as const
export type RelationshipLineStyle = (typeof relationshipLineStyles)[number]
```

```ts
// src/modeler/types/editor-snapshot.ts
export type EditorRelationshipAttributeMappingSnapshot = {
  id: string
  primaryAttributeId: string
  secondaryAttributeId: string
  displayOrder: number
}

export type EditorRelationshipSnapshot = {
  id: string
  primaryTableId: string
  secondaryTableId: string
  attributeMappings: EditorRelationshipAttributeMappingSnapshot[]
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many'
  onDelete: 'no action' | 'restrict' | 'cascade' | 'set null'
  onUpdate: 'no action' | 'restrict' | 'cascade' | 'set null'
  enforceConstraint: boolean
  lineStyle: RelationshipLineStyle
  vertices: { x: number; y: number }[]
}
```

```ts
// src/modeler/control/action/workspace/relationship-drag-action.ts
export type RelationshipConnectionSeed = {
  primaryTableId: string
  secondaryTableId: string
  primaryAttributeId: string
  secondaryAttributeId: string
}

export class RelationshipDragAction {
  begin(seed: RelationshipConnectionSeed) {
    return seed
  }
}
```

```ts
// src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts
createDraftFromConnection(seed: {
  primaryTableId: string
  secondaryTableId: string
  primaryAttributeId: string
  secondaryAttributeId: string
}): EditorRelationshipSnapshot {
  return {
    id: `rel_${crypto.randomUUID()}`,
    primaryTableId: seed.primaryTableId,
    secondaryTableId: seed.secondaryTableId,
    attributeMappings: [
      {
        id: `map_${crypto.randomUUID()}`,
        primaryAttributeId: seed.primaryAttributeId,
        secondaryAttributeId: seed.secondaryAttributeId,
        displayOrder: 0,
      },
    ],
    relationshipType: 'one-to-many',
    onDelete: 'cascade',
    onUpdate: 'cascade',
    enforceConstraint: true,
    lineStyle: 'orthogonal',
    vertices: [],
  }
}

addMapping(
  relationship: EditorRelationshipSnapshot,
  primaryAttributeId: string,
  secondaryAttributeId: string,
) {
  return {
    ...relationship,
    attributeMappings: [
      ...relationship.attributeMappings,
      {
        id: `map_${crypto.randomUUID()}`,
        primaryAttributeId,
        secondaryAttributeId,
        displayOrder: relationship.attributeMappings.length,
      },
    ],
  }
}

updateMapping(
  relationship: EditorRelationshipSnapshot,
  mappingId: string,
  patch: Partial<EditorRelationshipAttributeMappingSnapshot>,
) {
  return {
    ...relationship,
    attributeMappings: relationship.attributeMappings.map((mapping) =>
      mapping.id === mappingId
        ? {
            ...mapping,
            ...patch,
          }
        : mapping,
    ),
  }
}

removeMapping(relationship: EditorRelationshipSnapshot, mappingId: string) {
  return {
    ...relationship,
    attributeMappings: relationship.attributeMappings
      .filter((mapping) => mapping.id !== mappingId)
      .map((mapping, index) => ({
        ...mapping,
        displayOrder: index,
      })),
  }
}
```

- [ ] **Step 4: Wire the X6 drag interaction to open a prefilled modal and allow adding mapping rows**

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
graphInstance.on?.('edge:connected', ({ isNew, edge }) => {
  if (!isNew) {
    return
  }

  const source = edge.getSourceCellId()
  const target = edge.getTargetCellId()

  if (!source || !target || source === target) {
    edge.remove()
    return
  }

  setRelationshipDraft(
    configureRelationshipFormHandler.createDraftFromConnection({
      primaryTableId: source,
      secondaryTableId: target,
      primaryAttributeId: resolvePrimaryAttributeId(source),
      secondaryAttributeId: resolveSecondaryAttributeId(target),
    }),
  )
  setIsConfiguringRelationship(true)
  edge.remove()
})
```

```tsx
// src/modeler/view/modal/configure-relationship-modal.tsx
{draft.attributeMappings.map((mapping, index) => (
  <div key={mapping.id} className="relationship-mapping-row">
    <select
      aria-label={`Primary attribute mapping ${index + 1}`}
      value={mapping.primaryAttributeId}
      onChange={(event) => onUpdateMapping(mapping.id, { primaryAttributeId: event.target.value })}
    >
      {primaryAttributeOptions.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    <select
      aria-label={`Secondary attribute mapping ${index + 1}`}
      value={mapping.secondaryAttributeId}
      onChange={(event) => onUpdateMapping(mapping.id, { secondaryAttributeId: event.target.value })}
    >
      {secondaryAttributeOptions.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    <button type="button" onClick={() => onRemoveMapping(mapping.id)}>Remove pair</button>
  </div>
))}
<button type="button" onClick={onAddMapping}>Add column pair</button>
```

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
<ConfigureRelationshipModal
  draft={relationshipDraft}
  onAddMapping={() =>
    setRelationshipDraft((currentDraft) =>
      currentDraft
        ? configureRelationshipFormHandler.addMapping(
            currentDraft,
            resolvePrimaryAttributeId(currentDraft.primaryTableId),
            resolveSecondaryAttributeId(currentDraft.secondaryTableId),
          )
        : currentDraft,
    )
  }
  onUpdateMapping={(mappingId, patch) =>
    setRelationshipDraft((currentDraft) =>
      currentDraft ? configureRelationshipFormHandler.updateMapping(currentDraft, mappingId, patch) : currentDraft,
    )
  }
  onRemoveMapping={(mappingId) =>
    setRelationshipDraft((currentDraft) =>
      currentDraft ? configureRelationshipFormHandler.removeMapping(currentDraft, mappingId) : currentDraft,
    )
  }
/>
```

- [ ] **Step 5: Verify the drag relationship tests pass, then commit**

Run: `npm test -- tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/unit/modeler/types/editor-snapshot.test.ts tests/unit/modeler/util/model-serializer.test.ts tests/components/configure-relationship-modal.test.tsx tests/components/modeler-workspace.test.tsx`

Expected: PASS

```bash
git add src/modeler/enum/relationship-line-style.ts src/modeler/control/action/workspace/relationship-drag-action.ts src/modeler/control/config/workspace-config.ts src/modeler/control/handler/workspace/workspace-controller.ts src/modeler/control/handler/form/relationship/configure-relationship-form-handler.ts src/modeler/model/relationship/relationship-model.ts src/modeler/model/relationship/segment/relationship-segment.ts src/modeler/types/editor-snapshot.ts src/modeler/util/model-serializer.ts src/modeler/control/assembler/relationship/relationship-edge-factory.ts src/modeler/view/modal/configure-relationship-modal.tsx src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/form/configure-relationship-form-handler.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/unit/modeler/types/editor-snapshot.test.ts tests/unit/modeler/util/model-serializer.test.ts tests/components/configure-relationship-modal.test.tsx tests/components/modeler-workspace.test.tsx
git commit -m "feat: add drag-to-create relationships with composite column mappings"
```

## Task 4: Add Configurable Routing, Manual Edge Editing, And Soft Anti-Collision

**Files:**
- Create: `src/modeler/control/handler/relationship/relationship-routing-controller.ts`
- Create: `src/modeler/control/util/table-collision-guard.ts`
- Modify: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Modify: `src/modeler/view/modal/configure-relationship-modal.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/relationship-routing-controller.test.ts`
- Test: `tests/unit/modeler/control/util/table-collision-guard.test.ts`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing tests for route style mapping and overlap prevention**

```ts
import { describe, expect, it } from 'vitest'
import { RelationshipRoutingController } from '@/modeler/control/handler/relationship/relationship-routing-controller'

describe('RelationshipRoutingController', () => {
  it('maps orthogonal style to an obstacle-aware manhattan router', () => {
    const controller = new RelationshipRoutingController()
    expect(controller.resolveEdgeGeometry('orthogonal')).toEqual({
      router: { name: 'manhattan', args: { padding: 24 } },
      connector: { name: 'rounded' },
    })
  })
})
```

```ts
import { describe, expect, it } from 'vitest'
import { TableCollisionGuard } from '@/modeler/control/util/table-collision-guard'

describe('TableCollisionGuard', () => {
  it('nudges a moved table away from an occupied rectangle', () => {
    const guard = new TableCollisionGuard()
    const next = guard.resolve({
      moving: { x: 160, y: 160, width: 320, height: 160 },
      occupied: [{ x: 120, y: 120, width: 320, height: 160 }],
    })

    expect(next).not.toEqual({ x: 160, y: 160 })
  })
})
```

- [ ] **Step 2: Run the routing tests to verify the controllers do not exist yet**

Run: `npm test -- tests/unit/modeler/control/relationship-routing-controller.test.ts tests/unit/modeler/control/util/table-collision-guard.test.ts`

Expected: FAIL because routing and collision utilities are not implemented.

- [ ] **Step 3: Implement route-style mapping and table collision guards**

```ts
// src/modeler/control/handler/relationship/relationship-routing-controller.ts
import type { RelationshipLineStyle } from '@/modeler/enum/relationship-line-style'

export class RelationshipRoutingController {
  resolveEdgeGeometry(style: RelationshipLineStyle) {
    if (style === 'straight') {
      return {
        router: { name: 'normal' },
        connector: { name: 'straight' },
      }
    }

    if (style === 'curved') {
      return {
        router: { name: 'normal' },
        connector: { name: 'smooth' },
      }
    }

    return {
      router: { name: 'manhattan', args: { padding: 24 } },
      connector: { name: 'rounded' },
    }
  }
}
```

```ts
// src/modeler/control/util/table-collision-guard.ts
type Rect = { x: number; y: number; width: number; height: number }

export class TableCollisionGuard {
  resolve(input: { moving: Rect; occupied: Rect[] }) {
    const collides = input.occupied.some((rect) =>
      !(
        input.moving.x + input.moving.width <= rect.x ||
        rect.x + rect.width <= input.moving.x ||
        input.moving.y + input.moving.height <= rect.y ||
        rect.y + rect.height <= input.moving.y
      ),
    )

    return collides
      ? { x: input.moving.x + 32, y: input.moving.y + 32 }
      : { x: input.moving.x, y: input.moving.y }
  }
}
```

- [ ] **Step 4: Apply routing geometry and manual vertex editing in the workspace**

```ts
// src/modeler/control/assembler/relationship/relationship-edge-factory.ts
const geometry = routingController.resolveEdgeGeometry(relationship.lineStyle)

return {
  id: relationship.identification,
  source: relationship.primaryTable.identification,
  target: relationship.secondaryTable.identification,
  router: geometry.router,
  connector: geometry.connector,
  vertices: relationship.vertices,
  tools: ['vertices'],
  attrs: {
    line: {
      stroke: '#0053db',
      strokeWidth: 2,
      targetMarker: 'classic',
    },
  },
}
```

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
graphInstance.on?.('edge:change:vertices', ({ edge }) => {
  setRelationships((current) =>
    current.map((relationship) =>
      relationship.id === edge.id
        ? {
            ...relationship,
            vertices: edge.getVertices() ?? [],
          }
        : relationship,
    ),
  )
})
```

- [ ] **Step 5: Verify obstacle-aware routing and soft anti-collision, then commit**

Run: `npm test -- tests/unit/modeler/control/relationship-routing-controller.test.ts tests/unit/modeler/control/util/table-collision-guard.test.ts tests/components/modeler-workspace.test.tsx`

Expected: PASS

```bash
git add src/modeler/control/handler/relationship/relationship-routing-controller.ts src/modeler/control/util/table-collision-guard.ts src/modeler/control/assembler/relationship/relationship-edge-factory.ts src/modeler/control/handler/workspace/workspace-controller.ts src/modeler/view/modal/configure-relationship-modal.tsx src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/relationship-routing-controller.test.ts tests/unit/modeler/control/util/table-collision-guard.test.ts tests/components/modeler-workspace.test.tsx
git commit -m "feat: add configurable relationship routing and soft anti-collision"
```

## Task 5: Reshape The UI To Match The Prototype More Closely And Make Selection Explicit

**Files:**
- Modify: `src/modeler/view/panel/project-sidebar.tsx`
- Modify: `src/modeler/view/panel/property-panel.tsx`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/components/modeler-workspace.test.tsx`
- Test: `tests/e2e/modeler-usability.spec.ts`

- [ ] **Step 1: Write the failing tests for explicit selection states and action placement**

```tsx
it('shows global actions in the canvas toolbar and keeps the right panel contextual', async () => {
  render(<ModelerWorkspace projectId="proj_1" initialProject={snapshot} />)

  expect(screen.getByRole('button', { name: /add table/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /generate ddl/i })).toBeInTheDocument()
  expect(screen.getByText(/select a table or relationship/i)).toBeInTheDocument()
})
```

```tsx
it('marks the selected table visibly in test mode', async () => {
  const user = userEvent.setup()
  render(<ModelerWorkspace projectId="proj_1" initialProject={snapshot} />)

  await user.click(screen.getByText(/^users$/i))

  expect(screen.getByText(/^users$/i).closest('[data-selected="true"]')).not.toBeNull()
})
```

- [ ] **Step 2: Run the focused component and E2E tests to confirm the current layout is insufficient**

Run: `npm test -- tests/components/modeler-workspace.test.tsx`

Expected: FAIL because the action layout is still overly stacked in the right panel.

- [ ] **Step 3: Move global actions into a top toolbar and keep the right rail contextual**

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
<header className="modeler-canvas-toolbar">
  <div>
    <h1 className="modeler-canvas-toolbar__title">Model Editor</h1>
    <p className="modeler-canvas-toolbar__meta">Project {projectId}</p>
  </div>
  <div className="modeler-toolbar">
    <button type="button">Add table</button>
    <button type="button">Configure relationship</button>
    <button type="button">Generate DDL</button>
  </div>
</header>
```

```tsx
// src/modeler/view/panel/property-panel.tsx
<aside className="modeler-panel modeler-panel--right">
  <p className="modeler-panel__eyebrow">Inspector</p>
  <div className="property-card">{children}</div>
</aside>
```

- [ ] **Step 4: Add explicit selected states and prototype-aligned styling**

```css
/* src/app/globals.css */
.schema-card[data-selected='true'],
.x6-node[data-selected='true'] rect {
  outline: 2px solid rgba(0, 83, 219, 0.55);
  box-shadow: 0 0 0 6px rgba(0, 83, 219, 0.14);
}

.x6-edge[data-selected='true'] path {
  stroke: #0f4bb8;
  stroke-width: 3px;
}

.modeler-canvas-toolbar {
  align-items: flex-start;
}

.modeler-panel--right {
  background: linear-gradient(180deg, #eef4f8, #e3ebf1);
}
```

- [ ] **Step 5: Verify the UI behavior and commit**

Run: `npm test -- tests/components/modeler-workspace.test.tsx`

Expected: PASS

Run: `npm run test:e2e -- tests/e2e/modeler-usability.spec.ts`

Expected: PASS

```bash
git add src/modeler/view/panel/project-sidebar.tsx src/modeler/view/panel/property-panel.tsx src/modeler/view/workspace/modeler-workspace.tsx src/app/globals.css tests/components/modeler-workspace.test.tsx tests/e2e/modeler-usability.spec.ts
git commit -m "feat: align editor ui with prototype and explicit selection states"
```

## Task 6: Verify The Full Advanced Editing Flow End To End

**Files:**
- Create: `tests/e2e/modeler-phase-4.spec.ts`
- Modify: `tests/e2e/modeler-usability.spec.ts`
- Modify: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing E2E scenario for advanced editing**

```ts
import { expect, test } from '@playwright/test'

test('user reorders attributes, edits composite keys, creates a drag relationship, and exports a composite foreign key', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: /create project/i }).click()
  await page.getByLabel('Project name').fill('Advanced Editor Model')
  await page.getByRole('button', { name: /create/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('branch')
  await page.getByRole('button', { name: /create table/i }).click()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByLabel('Primary key').first().uncheck()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill('company_id')
  await page.getByLabel('Primary key').last().check()
  await page.getByRole('button', { name: /move up/i }).last().click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').last().fill('branch_id')
  await page.getByLabel('Primary key').last().check()
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.getByRole('button', { name: /add table/i }).click()
  await page.getByLabel('Table Name').fill('order')
  await page.getByRole('button', { name: /create table/i }).click()

  await page.getByRole('button', { name: /edit attributes/i }).click()
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').nth(1).fill('company_id')
  await page.getByRole('button', { name: /add column/i }).click()
  await page.getByLabel('Column name').nth(2).fill('branch_id')
  await page.getByRole('button', { name: /apply schema changes/i }).click()

  await page.locator('.x6-node').nth(0).dragTo(page.locator('.x6-node').nth(1))
  await page.getByRole('button', { name: /add column pair/i }).click()
  await page.getByLabel('Primary attribute mapping 2').selectOption({ label: /branch\.branch_id/i })
  await page.getByLabel('Secondary attribute mapping 2').selectOption({ label: /order\.branch_id/i })
  await page.getByRole('button', { name: /create relationship/i }).click()

  await page.getByRole('button', { name: /generate ddl/i }).click()
  await expect(page.getByText(/primary key \(company_id, branch_id\)/i)).toBeVisible()
  await expect(
    page.getByText(/foreign key \(company_id, branch_id\) references public\.branch \(company_id, branch_id\)/i),
  ).toBeVisible()
})
```

- [ ] **Step 2: Run the new E2E to confirm the advanced interaction set is incomplete**

Run: `npm run test:e2e -- tests/e2e/modeler-phase-4.spec.ts`

Expected: FAIL because the advanced ordering, routing, and drag-relationship flow is not yet complete.

- [ ] **Step 3: Fill the last gaps exposed by the E2E and improve the assertions**

```ts
// tests/e2e/modeler-phase-4.spec.ts
await expect(page.getByRole('button', { name: /move up/i }).first()).toBeVisible()
await expect(page.locator('.x6-edge')).toHaveCount(1)
await expect(page.locator('.x6-edge path')).toHaveCount(1)
await expect(page.getByRole('button', { name: /add column pair/i })).toBeVisible()
await expect(page.getByRole('alert')).toHaveCount(0)
```

- [ ] **Step 4: Run the full verification stack**

Run: `npm test`

Expected: PASS

Run: `npm run test:e2e -- tests/e2e/modeler-phase-4.spec.ts tests/e2e/modeler-usability.spec.ts tests/e2e/data-modeler.spec.ts`

Expected: PASS

Run: `npm run test:e2e`

Expected: PASS

- [ ] **Step 5: Commit the phase 4 verification**

```bash
git add tests/e2e/modeler-phase-4.spec.ts tests/e2e/modeler-usability.spec.ts tests/components/modeler-workspace.test.tsx
git commit -m "test: verify advanced editor and routing workflows"
```

## Self-Review

### Spec Coverage

- Possibility to change attribute order: explicitly covered in Task 1
- Edit PK after table creation: explicitly covered in Task 1
- Support tables with more than one PK: explicitly covered in Tasks 1 and 2
- Support relationships with composite keys: explicitly covered in Tasks 2, 3, and 6
- Create relationships by click-and-drag with prefilled dialog: explicitly covered in Task 3
- Reduce right-side stacking and align the UI to the prototype: explicitly covered in Task 5
- Make selection visually explicit: explicitly covered in Task 5
- Allow line style selection and manual routing: explicitly covered in Tasks 3 and 4
- Avoid relationship lines running blindly behind tables and reduce overlap pain: explicitly covered in Task 4

### Placeholder Scan

- No `TBD`
- No `TODO`
- No vague “add polish later” steps
- No hand-wavy testing steps without exact commands

### Type Consistency

- `EditorAttributeSnapshot.displayOrder` is the single source of truth for attribute ordering
- `EditorRelationshipSnapshot.attributeMappings` is the single source of truth for relationship column pairing
- `EditorRelationshipSnapshot.lineStyle` and `EditorRelationshipSnapshot.vertices` are the single source of truth for edge routing
- Composite PK and composite FK support are both implemented in this phase through ordered attribute and mapping collections
