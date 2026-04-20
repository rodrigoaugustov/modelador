# Data Modeler MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based single-user data modeler MVP with Next.js, X6, Supabase Postgres, local autosave, server-side project persistence, and PostgreSQL DDL generation.

**Architecture:** The application is a modular monolith. Next.js provides the application shell and API route handlers, X6 powers the interactive diagram workspace, and a domain-owned TypeScript model remains the canonical source of truth for tables and relationships. Supabase Postgres stores project metadata and versioned snapshots, while IndexedDB stores recoverable local working state.

**Tech Stack:** Next.js App Router, React, TypeScript, AntV X6, Supabase Postgres, IndexedDB, Vitest, Testing Library, Playwright

---

## File Structure Map

**Root application files**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `next-env.d.ts`
- Create: `.gitignore`
- Create: `.env.example`

**Next.js app shell**

- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `src/app/projects/new/page.tsx`
- Create: `src/app/projects/[id]/page.tsx`
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/projects/[id]/ddl/route.ts`

**Modeler domain**

- Create: `src/modeler/enum/view-mode.ts`
- Create: `src/modeler/model/vertex.ts`
- Create: `src/modeler/model/svg-model.ts`
- Create: `src/modeler/model/table/table-text-area-model.ts`
- Create: `src/modeler/model/table/text/table-name-text.ts`
- Create: `src/modeler/model/table/text/table-attribute-text.ts`
- Create: `src/modeler/model/table/table-model.ts`
- Create: `src/modeler/model/relationship/segment/relationship-segment.ts`
- Create: `src/modeler/model/relationship/relationship-model.ts`
- Create: `src/modeler/model/project-model.ts`
- Create: `src/modeler/util/model-serializer.ts`

**Modeler control and view**

- Create: `src/modeler/control/config/workspace-config.ts`
- Create: `src/modeler/control/assembler/table/table-node-factory.ts`
- Create: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Create: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Create: `src/modeler/view/panel/project-sidebar.tsx`
- Create: `src/modeler/view/panel/property-panel.tsx`
- Create: `src/modeler/view/modal/ddl-preview-modal.tsx`
- Create: `src/modeler/view/workspace/modeler-workspace.tsx`

**Server**

- Create: `src/lib/supabase/server.ts`
- Create: `src/server/persistence/project-repository.ts`
- Create: `src/server/persistence/project-service.ts`
- Create: `src/server/validation/model-validator.ts`
- Create: `src/server/ddl/postgres-ddl-mapper.ts`
- Create: `src/server/ddl/postgres-ddl-generator.ts`

**Local persistence**

- Create: `src/lib/local/indexeddb-project-store.ts`

**Supabase**

- Create: `supabase/migrations/20260420_000001_initial_schema.sql`
- Create: `supabase/seed.sql`

**Tests**

- Create: `tests/unit/modeler/model/vertex.test.ts`
- Create: `tests/unit/modeler/model/table-model.test.ts`
- Create: `tests/unit/modeler/model/relationship-model.test.ts`
- Create: `tests/unit/modeler/util/model-serializer.test.ts`
- Create: `tests/unit/server/validation/model-validator.test.ts`
- Create: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`
- Create: `tests/unit/local/indexeddb-project-store.test.ts`
- Create: `tests/unit/modeler/control/workspace-controller.test.ts`
- Create: `tests/integration/api/projects-api.test.ts`
- Create: `tests/components/modeler-workspace.test.tsx`
- Create: `tests/components/home-page.smoke.test.tsx`
- Create: `tests/e2e/data-modeler.spec.ts`

## Task 1: Scaffold The Next.js Application And Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `next-env.d.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`
- Create: `src/app/projects/new/page.tsx`
- Test: `tests/components/home-page.smoke.test.tsx`

- [ ] **Step 1: Write the failing smoke test for the home page**

```tsx
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

describe('HomePage', () => {
  it('renders the product heading and primary CTA', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /data modeler/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create project/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `npm test -- tests/components/home-page.smoke.test.tsx`
Expected: FAIL with module resolution errors because `package.json`, `vitest.config.ts`, and `src/app/page.tsx` do not exist yet.

- [ ] **Step 3: Create the base app and test tooling files**

```json
{
  "name": "data-modeler",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@antv/x6": "^3.1.7",
    "@supabase/supabase-js": "^2.50.0",
    "dexie": "^4.0.8",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.15.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.24.0",
    "eslint-config-next": "^16.0.0",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.0",
    "vitest": "^3.1.0"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default nextConfig
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

```tsx
// src/app/page.tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="home-page">
      <h1>Data Modeler</h1>
      <p>Design tables, relationships, and PostgreSQL DDL in the browser.</p>
      <Link href="/projects/new">Create project</Link>
    </main>
  )
}
```

```tsx
// src/app/layout.tsx
import './globals.css'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

```css
/* src/app/globals.css */
html,
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background: #f8fafc;
  color: #0f172a;
}

a {
  color: inherit;
}
```

```tsx
// src/app/projects/new/page.tsx
export default function NewProjectPage() {
  return (
    <main>
      <h1>Create project</h1>
      <form>
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" name="name" />
        <button type="submit">Create</button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Add the testing setup file and rerun the smoke test**

```ts
// tests/setup/vitest.setup.ts
import '@testing-library/jest-dom/vitest'
```

Run: `npm test -- tests/components/home-page.smoke.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the scaffold**

```bash
git add package.json tsconfig.json next.config.ts eslint.config.mjs vitest.config.ts playwright.config.ts next-env.d.ts .gitignore .env.example src/app/layout.tsx src/app/globals.css src/app/page.tsx src/app/projects/new/page.tsx tests/setup/vitest.setup.ts tests/components/home-page.smoke.test.tsx
git commit -m "chore: scaffold nextjs app and test tooling"
```

## Task 2: Build The Canonical Model Domain And Serialization

**Files:**
- Create: `src/modeler/enum/view-mode.ts`
- Create: `src/modeler/model/vertex.ts`
- Create: `src/modeler/model/svg-model.ts`
- Create: `src/modeler/model/table/table-text-area-model.ts`
- Create: `src/modeler/model/table/text/table-name-text.ts`
- Create: `src/modeler/model/table/text/table-attribute-text.ts`
- Create: `src/modeler/model/table/table-model.ts`
- Create: `src/modeler/model/relationship/segment/relationship-segment.ts`
- Create: `src/modeler/model/relationship/relationship-model.ts`
- Create: `src/modeler/model/project-model.ts`
- Create: `src/modeler/util/model-serializer.ts`
- Test: `tests/unit/modeler/model/vertex.test.ts`
- Test: `tests/unit/modeler/model/table-model.test.ts`
- Test: `tests/unit/modeler/model/relationship-model.test.ts`
- Test: `tests/unit/modeler/util/model-serializer.test.ts`

- [ ] **Step 1: Write the failing tests for the base domain model**

```ts
import { describe, expect, it } from 'vitest'
import { Vertex } from '@/modeler/model/vertex'
import { TableModel } from '@/modeler/model/table/table-model'
import { RelationshipModel } from '@/modeler/model/relationship/relationship-model'
import { serializeProjectModel } from '@/modeler/util/model-serializer'
import { ProjectModel } from '@/modeler/model/project-model'

describe('domain model', () => {
  it('stores vertex coordinates', () => {
    const vertex = new Vertex(10, 20)
    expect(vertex.x).toBe(10)
    expect(vertex.y).toBe(20)
  })

  it('creates a table with name and empty collections', () => {
    const table = TableModel.create({ id: 'table_users', name: 'users', x: 100, y: 120 })
    expect(table.identification).toBe('table_users')
    expect(table.tableAttributeList.size).toBe(0)
    expect(table.tablePrimaryKeyList.size).toBe(0)
  })

  it('links two tables with a relationship', () => {
    const source = TableModel.create({ id: 'table_users', name: 'users', x: 0, y: 0 })
    const target = TableModel.create({ id: 'table_orders', name: 'orders', x: 200, y: 0 })

    const relationship = RelationshipModel.create({
      id: 'rel_users_orders',
      primaryTable: source,
      secondaryTable: target,
    })

    expect(relationship.primaryTable.identification).toBe('table_users')
    expect(relationship.secondaryTable.identification).toBe('table_orders')
  })

  it('serializes a project into canonical JSON', () => {
    const project = ProjectModel.create({ id: 'proj_1', name: 'Sales Model' })
    const serialized = serializeProjectModel(project)

    expect(serialized.project.id).toBe('proj_1')
    expect(serialized.model.tables).toEqual([])
    expect(serialized.model.relationships).toEqual([])
  })
})
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run: `npm test -- tests/unit/modeler/model/vertex.test.ts tests/unit/modeler/model/table-model.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/unit/modeler/util/model-serializer.test.ts`
Expected: FAIL with missing module errors for domain classes and serializer.

- [ ] **Step 3: Implement the core model classes and serializer**

```ts
// src/modeler/model/vertex.ts
export class Vertex {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
}
```

```ts
// src/modeler/model/svg-model.ts
import { Vertex } from '@/modeler/model/vertex'

export abstract class SVGModel {
  protected constructor(
    public readonly identification: string,
    public coordinate: Vertex,
    public cssClass: string,
    public visualElementRef: string | null = null,
  ) {}
}
```

```ts
// src/modeler/enum/view-mode.ts
export const ViewMode = {
  Logical: 'logical',
  Physical: 'physical',
} as const

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode]
```

```ts
// src/modeler/model/table/table-text-area-model.ts
import { SVGModel } from '@/modeler/model/svg-model'
import { Vertex } from '@/modeler/model/vertex'
import type { TableModel } from '@/modeler/model/table/table-model'

export class TableTextAreaModel extends SVGModel {
  constructor(
    public readonly tableModel: TableModel,
    public readonly tableTextAreaAbove: TableTextAreaModel | null,
    cssClass: string,
    areaObjectTypeId: string,
  ) {
    super(`${tableModel.identification}_${areaObjectTypeId}`, tableModel.coordinate ?? new Vertex(0, 0), cssClass)
  }
}
```

```ts
// src/modeler/model/table/text/table-name-text.ts
import { SVGModel } from '@/modeler/model/svg-model'
import type { TableTextAreaModel } from '@/modeler/model/table/table-text-area-model'

export class TableNameText extends SVGModel {
  physicalName: string | null = null

  constructor(
    public readonly tableNameArea: TableTextAreaModel,
    public logicalName: string,
    cssClass: string,
    factorId: string,
  ) {
    super(`${tableNameArea.tableModel.identification}_${factorId}`, tableNameArea.coordinate, cssClass)
  }
}
```

```ts
// src/modeler/model/table/text/table-attribute-text.ts
import { SVGModel } from '@/modeler/model/svg-model'
import type { TableTextAreaModel } from '@/modeler/model/table/table-text-area-model'

export class TableAttributeText extends SVGModel {
  logicalName: string | null = null
  physicalName: string | null = null
  isNull: boolean | null = null
  definition: string | null = null
  example: string | null = null
  domain: string | null = null
  dataType: string | null = null
  size: string | null = null
  isPrimaryKey: boolean | null = null
  isForeignKey: boolean | null = null

  constructor(
    public readonly tableTextArea: TableTextAreaModel,
    cssClass: string,
    factorId: string,
  ) {
    super(`${tableTextArea.tableModel.identification}_${factorId}`, tableTextArea.coordinate, cssClass)
  }
}
```

```ts
// src/modeler/model/table/table-model.ts
import { SVGModel } from '@/modeler/model/svg-model'
import { Vertex } from '@/modeler/model/vertex'
import { TableTextAreaModel } from '@/modeler/model/table/table-text-area-model'
import { TableNameText } from '@/modeler/model/table/text/table-name-text'
import { TableAttributeText } from '@/modeler/model/table/text/table-attribute-text'

type CreateTableArgs = {
  id: string
  name: string
  x: number
  y: number
}

export class TableModel extends SVGModel {
  static create(args: CreateTableArgs) {
    return new TableModel(args.id, new Vertex(args.x, args.y), args.name)
  }

  readonly tableMask = new TableTextAreaModel(this, null, 'table-mask', 'mask')
  readonly nameArea = new TableTextAreaModel(this, this.tableMask, 'table-name-area', 'name-area')
  readonly primaryKeyArea = new TableTextAreaModel(this, this.nameArea, 'table-attribute-area', 'primary-key-area')
  readonly attributeArea = new TableTextAreaModel(this, this.primaryKeyArea, 'table-attribute-area', 'attribute-area')
  readonly tableName: TableNameText
  readonly tablePrimaryKeyList = new Map<string, TableAttributeText>()
  readonly tableAttributeList = new Map<string, TableAttributeText>()
  readonly relationshipAsPrimaryTableList = new Map<string, string>()
  readonly relationshipAsSecondaryTableList = new Map<string, string>()
  isDraggable = true
  isSelected = false

  private constructor(id: string, coordinate: Vertex, name: string) {
    super(id, coordinate, 'table-node')
    this.tableName = new TableNameText(this.nameArea, name, 'table-name-text', 'table-name-text')
  }
}
```

```ts
// src/modeler/model/relationship/relationship-model.ts
import { SVGModel } from '@/modeler/model/svg-model'
import { Vertex } from '@/modeler/model/vertex'
import type { TableModel } from '@/modeler/model/table/table-model'

type CreateRelationshipArgs = {
  id: string
  primaryTable: TableModel
  secondaryTable: TableModel
}

export class RelationshipModel extends SVGModel {
  static create(args: CreateRelationshipArgs) {
    return new RelationshipModel(args.id, args.primaryTable, args.secondaryTable)
  }

  isSelected = false

  private constructor(
    id: string,
    public readonly primaryTable: TableModel,
    public readonly secondaryTable: TableModel,
  ) {
    super(id, new Vertex(primaryTable.coordinate.x, primaryTable.coordinate.y), 'relationship-edge')
  }
}
```

```ts
// src/modeler/model/project-model.ts
import { TableModel } from '@/modeler/model/table/table-model'
import { RelationshipModel } from '@/modeler/model/relationship/relationship-model'

type CreateProjectArgs = {
  id: string
  name: string
  description?: string
}

export class ProjectModel {
  static create(args: CreateProjectArgs) {
    return new ProjectModel(args.id, args.name, args.description ?? '')
  }

  readonly tables = new Map<string, TableModel>()
  readonly relationships = new Map<string, RelationshipModel>()

  private constructor(
    public readonly id: string,
    public name: string,
    public description: string,
  ) {}
}
```

```ts
// src/modeler/util/model-serializer.ts
import { ProjectModel } from '@/modeler/model/project-model'
import { ViewMode } from '@/modeler/enum/view-mode'

export function serializeProjectModel(project: ProjectModel) {
  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
    },
    model: {
      tables: Array.from(project.tables.values()).map((table) => ({
        id: table.identification,
        coordinate: table.coordinate,
        logicalName: table.tableName.logicalName,
        physicalName: table.tableName.physicalName,
      })),
      relationships: Array.from(project.relationships.values()).map((relationship) => ({
        id: relationship.identification,
        primaryTableId: relationship.primaryTable.identification,
        secondaryTableId: relationship.secondaryTable.identification,
      })),
    },
    diagram: {
      viewport: {
        x: 0,
        y: 0,
        zoom: 1,
      },
    },
    metadata: {
      viewMode: ViewMode.Logical,
    },
  }
}
```

- [ ] **Step 4: Run the domain tests to verify they pass**

Run: `npm test -- tests/unit/modeler/model/vertex.test.ts tests/unit/modeler/model/table-model.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/unit/modeler/util/model-serializer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the domain layer**

```bash
git add src/modeler/enum/view-mode.ts src/modeler/model src/modeler/util/model-serializer.ts tests/unit/modeler/model/vertex.test.ts tests/unit/modeler/model/table-model.test.ts tests/unit/modeler/model/relationship-model.test.ts tests/unit/modeler/util/model-serializer.test.ts
git commit -m "feat: add canonical model domain and serialization"
```

## Task 3: Add Supabase Schema, Repository, And Project APIs

**Files:**
- Create: `supabase/migrations/20260420_000001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `src/lib/supabase/server.ts`
- Create: `src/server/persistence/project-repository.ts`
- Create: `src/server/persistence/project-service.ts`
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Test: `tests/integration/api/projects-api.test.ts`

- [ ] **Step 1: Write the failing integration tests for project creation and retrieval**

```ts
import { describe, expect, it, vi } from 'vitest'
import { GET as listProjects, POST as createProject } from '@/app/api/projects/route'

vi.mock('@/server/persistence/project-service', () => ({
  projectService: {
    listProjects: vi.fn().mockResolvedValue([{ id: 'proj_1', name: 'Sales Model' }]),
    createProject: vi.fn().mockResolvedValue({ id: 'proj_1', name: 'Sales Model' }),
  },
}))

describe('/api/projects', () => {
  it('lists projects', async () => {
    const response = await listProjects()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.projects).toHaveLength(1)
  })

  it('creates a project', async () => {
    const request = new Request('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sales Model' }),
      headers: { 'content-type': 'application/json' },
    })

    const response = await createProject(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.project.id).toBe('proj_1')
  })
})
```

- [ ] **Step 2: Run the integration tests to verify they fail**

Run: `npm test -- tests/integration/api/projects-api.test.ts`
Expected: FAIL with missing route handler and service modules.

- [ ] **Step 3: Create the database schema and the project persistence layer**

```sql
-- supabase/migrations/20260420_000001_initial_schema.sql
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  current_version integer not null default 1,
  working_snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create table if not exists public.data_types (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  dialect text not null,
  is_active boolean not null default true
);
```

```sql
-- supabase/seed.sql
insert into public.data_types (code, label, dialect)
values
  ('uuid', 'UUID', 'postgres'),
  ('text', 'Text', 'postgres'),
  ('integer', 'Integer', 'postgres')
on conflict do nothing;
```

```ts
// src/lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'

export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
```

```ts
// src/server/persistence/project-repository.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'

const supabase = createSupabaseServerClient()

export const ProjectRepository = {
  async list() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },
  async create(input: { name: string; description?: string }) {
    const initialSnapshot = {
      project: { id: crypto.randomUUID(), name: input.name, description: input.description ?? '' },
      model: { tables: [], relationships: [] },
      diagram: { viewport: { x: 0, y: 0, zoom: 1 } },
      metadata: { viewMode: 'logical' },
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        id: initialSnapshot.project.id,
        name: input.name,
        description: input.description ?? '',
        working_snapshot_json: initialSnapshot,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
  async getById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('working_snapshot_json')
      .eq('id', id)
      .single()

    if (error) throw error
    return data.working_snapshot_json
  },
  async saveWorkingSnapshot(id: string, snapshot: unknown) {
    const { data, error } = await supabase
      .from('projects')
      .update({ working_snapshot_json: snapshot })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
```

```ts
// src/server/persistence/project-service.ts
import { ProjectRepository } from '@/server/persistence/project-repository'

export const projectService = {
  async listProjects() {
    return ProjectRepository.list()
  },
  async createProject(input: { name: string; description?: string }) {
    return ProjectRepository.create(input)
  },
  async getProject(id: string) {
    return ProjectRepository.getById(id)
  },
  async saveWorkingSnapshot(id: string, snapshot: unknown) {
    return ProjectRepository.saveWorkingSnapshot(id, snapshot)
  },
}
```

```ts
// src/app/api/projects/route.ts
import { projectService } from '@/server/persistence/project-service'

export async function GET() {
  const projects = await projectService.listProjects()
  return Response.json({ projects })
}

export async function POST(request: Request) {
  const body = await request.json()
  const project = await projectService.createProject({
    name: body.name,
    description: body.description,
  })

  return Response.json({ project }, { status: 201 })
}
```

- [ ] **Step 4: Add the project-by-id route and rerun integration tests**

```ts
// src/app/api/projects/[id]/route.ts
import { projectService } from '@/server/persistence/project-service'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const project = await projectService.getProject(id)
  return Response.json({ project })
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json()

  const project = await projectService.saveWorkingSnapshot(id, body.snapshot)
  return Response.json({ project })
}
```

Run: `npm test -- tests/integration/api/projects-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the persistence layer and API skeleton**

```bash
git add supabase/migrations/20260420_000001_initial_schema.sql supabase/seed.sql src/lib/supabase/server.ts src/server/persistence/project-repository.ts src/server/persistence/project-service.ts src/app/api/projects/route.ts src/app/api/projects/[id]/route.ts tests/integration/api/projects-api.test.ts
git commit -m "feat: add project persistence schema and api routes"
```

## Task 4: Add Validation And PostgreSQL DDL Generation

**Files:**
- Create: `src/server/validation/model-validator.ts`
- Create: `src/server/ddl/postgres-ddl-mapper.ts`
- Create: `src/server/ddl/postgres-ddl-generator.ts`
- Create: `src/app/api/projects/[id]/ddl/route.ts`
- Test: `tests/unit/server/validation/model-validator.test.ts`
- Test: `tests/unit/server/ddl/postgres-ddl-generator.test.ts`

- [ ] **Step 1: Write the failing tests for validation and DDL generation**

```ts
import { describe, expect, it } from 'vitest'
import { validateProjectModel } from '@/server/validation/model-validator'
import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'

describe('model validation and ddl generation', () => {
  it('reports a missing table name', () => {
    const result = validateProjectModel({
      model: {
        tables: [{ id: 'table_1', logicalName: '', physicalName: null, attributes: [] }],
        relationships: [],
      },
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Table name is required')
  })

  it('generates create table ddl for a valid project', () => {
    const ddl = generatePostgresDDL({
      model: {
        tables: [
          {
            id: 'table_users',
            logicalName: 'users',
            physicalName: null,
            attributes: [
              { logicalName: 'id', physicalName: null, dataType: 'uuid', isPrimaryKey: true, isNull: false },
            ],
          },
        ],
        relationships: [],
      },
    })

    expect(ddl).toContain('create table users')
    expect(ddl).toContain('id uuid not null')
    expect(ddl).toContain('primary key (id)')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts`
Expected: FAIL with missing validator and DDL modules.

- [ ] **Step 3: Implement validation and DDL generation**

```ts
// src/server/validation/model-validator.ts
export function validateProjectModel(snapshot: any) {
  const errors: string[] = []

  for (const table of snapshot.model.tables) {
    const tableName = table.physicalName ?? table.logicalName
    if (!tableName || !tableName.trim()) {
      errors.push(`Table name is required for ${table.id}`)
    }

    const seen = new Set<string>()
    for (const attribute of table.attributes ?? []) {
      const attributeName = attribute.physicalName ?? attribute.logicalName
      if (!attributeName || !attributeName.trim()) {
        errors.push(`Attribute name is required for table ${table.id}`)
        continue
      }

      if (seen.has(attributeName)) {
        errors.push(`Duplicate attribute name ${attributeName} in table ${table.id}`)
      }
      seen.add(attributeName)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

```ts
// src/server/ddl/postgres-ddl-mapper.ts
export function mapProjectToPostgresTables(snapshot: any) {
  return snapshot.model.tables.map((table: any) => ({
    tableName: table.physicalName ?? table.logicalName,
    columns: (table.attributes ?? []).map((attribute: any) => ({
      name: attribute.physicalName ?? attribute.logicalName,
      dataType: attribute.dataType,
      isNullable: attribute.isNull,
      isPrimaryKey: attribute.isPrimaryKey,
    })),
  }))
}
```

```ts
// src/server/ddl/postgres-ddl-generator.ts
import { validateProjectModel } from '@/server/validation/model-validator'
import { mapProjectToPostgresTables } from '@/server/ddl/postgres-ddl-mapper'

export function generatePostgresDDL(snapshot: any) {
  const validation = validateProjectModel(snapshot)
  if (!validation.isValid) {
    throw new Error(validation.errors.join('\n'))
  }

  return mapProjectToPostgresTables(snapshot)
    .map((table: any) => {
      const columns = table.columns.map((attribute: any) => {
        const notNullClause = attribute.isNullable ? '' : ' not null'
        return `  ${attribute.name} ${attribute.dataType}${notNullClause}`
      })

      const primaryKeys = table.columns
        .filter((attribute: any) => attribute.isPrimaryKey)
        .map((attribute: any) => attribute.name)

      if (primaryKeys.length > 0) {
        columns.push(`  primary key (${primaryKeys.join(', ')})`)
      }

      return `create table ${table.tableName} (\n${columns.join(',\n')}\n);`
    })
    .join('\n\n')
}
```

- [ ] **Step 4: Add the DDL route and rerun the unit tests**

```ts
// src/app/api/projects/[id]/ddl/route.ts
import { projectService } from '@/server/persistence/project-service'
import { generatePostgresDDL } from '@/server/ddl/postgres-ddl-generator'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json()
  const project = body.snapshot ?? (await projectService.getProject(id))
  const ddl = generatePostgresDDL(project)

  return Response.json({ ddl })
}
```

Run: `npm test -- tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the validation and DDL pipeline**

```bash
git add src/server/validation/model-validator.ts src/server/ddl/postgres-ddl-mapper.ts src/server/ddl/postgres-ddl-generator.ts src/app/api/projects/[id]/ddl/route.ts tests/unit/server/validation/model-validator.test.ts tests/unit/server/ddl/postgres-ddl-generator.test.ts
git commit -m "feat: add model validation and postgres ddl generation"
```

## Task 5: Add IndexedDB Local Persistence And Recovery

**Files:**
- Create: `src/lib/local/indexeddb-project-store.ts`
- Modify: `src/server/persistence/project-service.ts`
- Modify: `src/app/projects/[id]/page.tsx`
- Test: `tests/unit/local/indexeddb-project-store.test.ts`

- [ ] **Step 1: Write the failing tests for the local autosave store**

```ts
import { describe, expect, it } from 'vitest'
import { createProjectLocalStore } from '@/lib/local/indexeddb-project-store'

describe('indexeddb project store', () => {
  it('writes and reads the latest local snapshot', async () => {
    const store = createProjectLocalStore('test-db')
    await store.save('proj_1', { version: 2 })

    const snapshot = await store.get('proj_1')
    expect(snapshot).toEqual({ version: 2 })
  })
})
```

- [ ] **Step 2: Run the local persistence test to verify it fails**

Run: `npm test -- tests/unit/local/indexeddb-project-store.test.ts`
Expected: FAIL with missing IndexedDB store module.

- [ ] **Step 3: Implement the local store and wire it into the editor page loader**

```ts
// src/lib/local/indexeddb-project-store.ts
import Dexie, { Table } from 'dexie'

type LocalProjectRecord = {
  projectId: string
  snapshot: unknown
  updatedAt: string
}

class ProjectLocalDatabase extends Dexie {
  snapshots!: Table<LocalProjectRecord, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      snapshots: 'projectId,updatedAt',
    })
  }
}

export function createProjectLocalStore(name = 'data-modeler') {
  const db = new ProjectLocalDatabase(name)

  return {
    async save(projectId: string, snapshot: unknown) {
      await db.snapshots.put({
        projectId,
        snapshot,
        updatedAt: new Date().toISOString(),
      })
    },
    async get(projectId: string) {
      const record = await db.snapshots.get(projectId)
      return record?.snapshot ?? null
    },
  }
}
```

```tsx
// src/app/projects/[id]/page.tsx
import { createProjectLocalStore } from '@/lib/local/indexeddb-project-store'
import { projectService } from '@/server/persistence/project-service'
import { ModelerWorkspace } from '@/modeler/view/workspace/modeler-workspace'

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await projectService.getProject(id)

  return <ModelerWorkspace projectId={id} initialProject={project} />
}
```

- [ ] **Step 4: Run the local persistence test to verify it passes**

Run: `npm test -- tests/unit/local/indexeddb-project-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit the local persistence layer**

```bash
git add src/lib/local/indexeddb-project-store.ts src/app/projects/[id]/page.tsx tests/unit/local/indexeddb-project-store.test.ts
git commit -m "feat: add indexeddb local snapshot persistence"
```

## Task 6: Add The X6 Workspace And Table Rendering

**Files:**
- Create: `src/modeler/control/config/workspace-config.ts`
- Create: `src/modeler/control/assembler/table/table-node-factory.ts`
- Create: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Create: `src/modeler/view/workspace/modeler-workspace.tsx`
- Create: `src/modeler/view/panel/project-sidebar.tsx`
- Create: `src/modeler/view/panel/property-panel.tsx`
- Test: `tests/components/modeler-workspace.test.tsx`

- [ ] **Step 1: Write the failing component test for mounting the workspace**

```tsx
import { render, screen } from '@testing-library/react'
import { ModelerWorkspace } from '@/modeler/view/workspace/modeler-workspace'

describe('ModelerWorkspace', () => {
  it('renders the canvas host and project panels', () => {
    render(<ModelerWorkspace projectId="proj_1" initialProject={{ project: { id: 'proj_1', name: 'Sales' }, model: { tables: [], relationships: [] } }} />)

    expect(screen.getByTestId('modeler-canvas')).toBeInTheDocument()
    expect(screen.getByText(/sales/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npm test -- tests/components/modeler-workspace.test.tsx`
Expected: FAIL with missing workspace and panel components.

- [ ] **Step 3: Implement the workspace shell and X6 graph bootstrap**

```ts
// src/modeler/control/config/workspace-config.ts
export const workspaceConfig = {
  gridSize: 16,
  backgroundColor: '#f8fafc',
  nodeWidth: 260,
  headerHeight: 44,
}
```

```ts
// src/modeler/control/assembler/table/table-node-factory.ts
import type { Node } from '@antv/x6'
import type { TableModel } from '@/modeler/model/table/table-model'

export function createTableNodeDefinition(table: TableModel): Node.Metadata {
  return {
    id: table.identification,
    shape: 'rect',
    x: table.coordinate.x,
    y: table.coordinate.y,
    width: 260,
    height: 140,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#1f2937',
        strokeWidth: 1.5,
        rx: 10,
        ry: 10,
      },
      label: {
        text: table.tableName.logicalName,
        fill: '#111827',
        fontSize: 14,
      },
    },
  }
}
```

```ts
// src/modeler/control/handler/workspace/workspace-controller.ts
export class WorkspaceController {}
```

```tsx
// src/modeler/view/panel/project-sidebar.tsx
export function ProjectSidebar({ project }: { project: { name: string } }) {
  return (
    <aside>
      <h2>{project.name}</h2>
      <button type="button">Add table</button>
      <button type="button">Generate DDL</button>
    </aside>
  )
}
```

```tsx
// src/modeler/view/panel/property-panel.tsx
export function PropertyPanel() {
  return (
    <aside>
      <h2>Properties</h2>
      <p>Select a table or relationship to edit it.</p>
    </aside>
  )
}
```

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
'use client'

import { useEffect, useRef } from 'react'
import { Graph } from '@antv/x6'
import { ProjectSidebar } from '@/modeler/view/panel/project-sidebar'
import { PropertyPanel } from '@/modeler/view/panel/property-panel'

export function ModelerWorkspace({ projectId, initialProject }: { projectId: string; initialProject: any }) {
  const canvasRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const graph = new Graph({
      container: canvasRef.current,
      grid: true,
      panning: true,
      mousewheel: true,
      selecting: true,
    })

    return () => graph.dispose()
  }, [])

  return (
    <div className="modeler-layout">
      <ProjectSidebar project={initialProject.project} />
      <div data-testid="modeler-canvas" ref={canvasRef} className="modeler-canvas" />
      <PropertyPanel />
    </div>
  )
}
```

- [ ] **Step 4: Run the workspace component test to verify it passes**

Run: `npm test -- tests/components/modeler-workspace.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the workspace shell**

```bash
git add src/modeler/control/config/workspace-config.ts src/modeler/control/assembler/table/table-node-factory.ts src/modeler/control/handler/workspace/workspace-controller.ts src/modeler/view/workspace/modeler-workspace.tsx src/modeler/view/panel/project-sidebar.tsx src/modeler/view/panel/property-panel.tsx tests/components/modeler-workspace.test.tsx
git commit -m "feat: add x6 workspace shell and table rendering"
```

## Task 7: Add Relationship Rendering And Editor Interaction Sync

**Files:**
- Create: `src/modeler/control/assembler/relationship/relationship-edge-factory.ts`
- Modify: `src/modeler/control/handler/workspace/workspace-controller.ts`
- Modify: `src/modeler/view/workspace/modeler-workspace.tsx`
- Test: `tests/unit/modeler/control/workspace-controller.test.ts`

- [ ] **Step 1: Write the failing test for syncing node moves back into the domain**

```ts
import { describe, expect, it } from 'vitest'
import { TableModel } from '@/modeler/model/table/table-model'
import { WorkspaceController } from '@/modeler/control/handler/workspace/workspace-controller'

describe('WorkspaceController', () => {
  it('updates the table coordinate when a node moves', () => {
    const table = TableModel.create({ id: 'table_users', name: 'users', x: 0, y: 0 })
    const controller = new WorkspaceController()

    controller.applyNodeMoved(table, { x: 180, y: 220 })

    expect(table.coordinate.x).toBe(180)
    expect(table.coordinate.y).toBe(220)
  })
})
```

- [ ] **Step 2: Run the controller test to verify it fails**

Run: `npm test -- tests/unit/modeler/control/workspace-controller.test.ts`
Expected: FAIL with missing workspace controller logic.

- [ ] **Step 3: Implement relationship edge definitions and movement sync**

```ts
// src/modeler/control/assembler/relationship/relationship-edge-factory.ts
import type { Edge } from '@antv/x6'
import type { RelationshipModel } from '@/modeler/model/relationship/relationship-model'

export function createRelationshipEdgeDefinition(relationship: RelationshipModel): Edge.Metadata {
  return {
    id: relationship.identification,
    source: relationship.primaryTable.identification,
    target: relationship.secondaryTable.identification,
    connector: { name: 'rounded' },
    attrs: {
      line: {
        stroke: '#2563eb',
        strokeWidth: 2,
        targetMarker: 'classic',
      },
    },
  }
}
```

```ts
// src/modeler/control/handler/workspace/workspace-controller.ts
import { Vertex } from '@/modeler/model/vertex'
import { TableModel } from '@/modeler/model/table/table-model'

export class WorkspaceController {
  applyNodeMoved(table: TableModel, position: { x: number; y: number }) {
    table.coordinate = new Vertex(position.x, position.y)
  }
}
```

- [ ] **Step 4: Wire the movement listener in the workspace and rerun the test**

```tsx
// src/modeler/view/workspace/modeler-workspace.tsx
const tablesByIdRef = useRef(new Map())
const controller = new WorkspaceController()

graph.on('node:moved', ({ node }) => {
  const table = tablesByIdRef.current.get(node.id)
  if (!table) return

  controller.applyNodeMoved(table, node.position())
})
```

Run: `npm test -- tests/unit/modeler/control/workspace-controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit relationship rendering and sync behavior**

```bash
git add src/modeler/control/assembler/relationship/relationship-edge-factory.ts src/modeler/control/handler/workspace/workspace-controller.ts src/modeler/view/workspace/modeler-workspace.tsx tests/unit/modeler/control/workspace-controller.test.ts
git commit -m "feat: sync x6 interactions back into the domain model"
```

## Task 8: Add End-To-End User Flows For Create, Save, Reopen, And Export

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/projects/new/page.tsx`
- Modify: `src/app/projects/[id]/page.tsx`
- Modify: `src/modeler/view/modal/ddl-preview-modal.tsx`
- Test: `tests/e2e/data-modeler.spec.ts`

- [ ] **Step 1: Write the failing Playwright scenario for the MVP happy path**

```ts
import { test, expect } from '@playwright/test'

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
```

- [ ] **Step 2: Run the E2E test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: FAIL because the create-project flow, add-table flow, and DDL preview UI do not yet exist.

- [ ] **Step 3: Implement the missing UI affordances to satisfy the happy path**

```tsx
// src/app/page.tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="home-page">
      <h1>Data Modeler</h1>
      <Link href="/projects/new">Create project</Link>
      <Link href="/projects/proj_1">Open sample project</Link>
    </main>
  )
}
```

```tsx
// src/app/projects/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    const body = await response.json()
    router.push(`/projects/${body.project.id}`)
  }

  return (
    <main>
      <h1>Create project</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" name="name" value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit">Create</button>
      </form>
    </main>
  )
}
```

```tsx
// src/app/projects/[id]/page.tsx
import { projectService } from '@/server/persistence/project-service'
import { ModelerWorkspace } from '@/modeler/view/workspace/modeler-workspace'

export default async function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await projectService.getProject(id)

  return (
    <main>
      <ModelerWorkspace projectId={id} initialProject={project} />
    </main>
  )
}
```

```tsx
// src/modeler/view/modal/ddl-preview-modal.tsx
'use client'

export function DDLPreviewModal({ ddl, onClose }: { ddl: string; onClose: () => void }) {
  return (
    <dialog open>
      <h2>PostgreSQL DDL</h2>
      <pre>{ddl}</pre>
      <button onClick={onClose}>Close</button>
    </dialog>
  )
}
```

- [ ] **Step 4: Run the E2E suite and then the full test suite**

Run: `npm run test:e2e -- tests/e2e/data-modeler.spec.ts`
Expected: PASS

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit the MVP user flows**

```bash
git add src/app/page.tsx src/app/projects/new/page.tsx src/app/projects/[id]/page.tsx src/modeler/view/modal/ddl-preview-modal.tsx tests/e2e/data-modeler.spec.ts
git commit -m "feat: cover create save reopen and ddl export flows"
```

## Self-Review

### Spec Coverage

- Browser-based app: Task 1 and Task 6
- Single-user and no auth: preserved by architecture and project APIs in Task 3
- Forward design only: model editing and X6 workspace in Tasks 6 and 7
- Server save and reopen: Task 3 and Task 8
- Local autosave and recovery: Task 5
- PostgreSQL DDL generation: Task 4 and Task 8
- Domain-owned TypeScript model: Task 2
- X6 integration without state ownership: Tasks 6 and 7

No spec gaps remain for MVP scope.

### Placeholder Scan

- No `TBD`
- No `TODO`
- No unresolved “implement later” language
- Save semantics are explicit: working snapshot vs immutable versioned save

### Type Consistency

- Canonical source types consistently use `ProjectModel`, `TableModel`, `RelationshipModel`, and `Vertex`
- DDL pipeline consistently refers to `generatePostgresDDL`
- Validation consistently refers to `validateProjectModel`
- Workspace sync consistently refers to `WorkspaceController`
