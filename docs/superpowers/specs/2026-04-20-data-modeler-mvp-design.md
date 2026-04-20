# Data Modeler MVP Design

## Context

This project starts from an empty repository and targets a browser-based data modeling tool. The original specification emphasizes a front end built with TypeScript, HTML5, object-oriented classes, SVG-based workspace rendering, a back end, and a database. It also defines a rich domain model centered around tables, relationships, and SVG-linked objects.

The agreed product scope for the MVP is:

- Browser-based application
- Single-user first
- No authentication in v1
- Forward design only
- Save and reopen projects on the server
- Generate PostgreSQL DDL
- Preserve future evolution path to multi-user

The goal of this design is to convert the initial conceptual specification into a practical, maintainable web architecture that can be implemented incrementally.

## Product Goal

Deliver a web application where a user can:

1. Create and edit a logical/physical data model in the browser
2. Manage tables, attributes, and relationships visually
3. Save and reopen projects from the server
4. Recover in-progress work locally in the browser
5. Validate the model before export
6. Generate PostgreSQL DDL from the current model

## Scope Boundaries

### In Scope for MVP

- Project creation, listing, opening, and saving
- SVG/diagram workspace in the browser
- Table creation and editing
- Relationship creation and editing
- Logical and physical names for tables and attributes
- Primary key and foreign key metadata
- Attribute metadata including nullability, definition, example, domain, datatype, and size
- Workspace positioning and editing interactions
- PostgreSQL DDL generation
- Versioned project snapshots on the server
- Local autosave and crash recovery in the browser

### Out of Scope for MVP

- Multi-user collaboration
- Authentication and authorization
- Reverse engineering from SQL
- Additional SQL dialects beyond PostgreSQL
- Real-time collaboration
- Advanced collaboration features such as comments, sharing, review workflows, and locking
- Fine-grained role management

## Architectural Decision Summary

### Selected Stack

- Front end and application shell: Next.js App Router with TypeScript
- Diagram editor engine: AntV X6
- Database: Supabase Postgres
- Server-side API: Next.js Route Handlers
- Local browser persistence: IndexedDB
- Testing: Vitest, Testing Library, Playwright

### Why This Stack

#### Next.js

Next.js provides a strong full-stack base for a single deployable web application. It supports the application shell, routing, server-rendered pages where useful, and route handlers for API endpoints without introducing a separate backend service too early.

#### Supabase Postgres

Supabase gives the project a managed Postgres database with a clear future path to Auth and Row Level Security when the application becomes multi-user. For the MVP it is used primarily as managed Postgres, not as the direct browser-facing persistence layer.

#### X6

The editor should not be built entirely from scratch in the MVP. X6 provides graph editing infrastructure, SVG/HTML rendering, selection, drag, connection, viewport management, and extensibility, while still allowing a domain-driven architecture. This preserves flexibility without forcing the team to build editor infrastructure from zero.

#### Domain-Owned Model

The application's canonical model must remain our own TypeScript domain model. X6 is an interaction and rendering engine, not the source of truth. This prevents lock-in and keeps DDL generation, validation, persistence, and future engine changes under product control.

## High-Level Architecture

The MVP is a modular monolith with three logical layers:

1. Front end application layer
2. Back end application/API layer
3. Database layer

### Front End Application Layer

Responsibilities:

- Application layout and navigation
- Project list and project editor screens
- Toolbar, panels, dialogs, and forms
- Modeler workspace host
- Local persistence coordination
- Triggering save, load, and DDL generation flows

Technology:

- Next.js Client Components for the interactive editor shell
- React for forms, panels, and composition
- X6 mounted inside a client-side workspace component

### Back End Application/API Layer

Responsibilities:

- Project CRUD APIs
- Snapshot persistence
- Version creation
- Model validation before persistence or DDL generation
- PostgreSQL DDL generation
- Serialization/deserialization between API payloads and storage model

Technology:

- Next.js Route Handlers
- Server-side TypeScript services

### Database Layer

Responsibilities:

- Store project metadata
- Store project snapshots and versions
- Store datatype catalogs or configuration as needed
- Support future ownership and multi-user features

Technology:

- Supabase Postgres

## Front End Design

### Application Shell

The shell is responsible for standard product screens and controls:

- Home/dashboard with project list
- Project creation flow
- Editor screen
- DDL preview/export screen or modal

React and Next.js are appropriate here because these concerns are conventional UI concerns rather than diagram engine concerns.

## Modeler Workspace

The modeler workspace is the heart of the product. It is a dedicated client-side module hosted inside a React component but architected independently from React state.

### Principle

React should not own the detailed state transitions of tables, attributes, relationships, connection anchors, and geometric updates. Those behaviors should live in a modeler engine module written in TypeScript and organized around the domain.

### Workspace Composition

- `ModelerWorkspace` React component mounts the workspace container
- `WorkspaceController` boots the editor engine
- `X6 Graph` provides diagram surface and interaction primitives
- domain objects remain the source of truth
- adapter layer synchronizes domain state and X6 cells

### Editor Flow

1. Open project
2. Load canonical project model
3. Rebuild domain objects in memory
4. Build X6 graph from domain objects
5. Attach interaction handlers
6. Update domain state on interactions
7. Persist locally and remotely through autosave policies

## Domain Model Design

The original specification defines a rich OOP model. We should preserve its intent while clarifying boundaries between domain, rendering, and application concerns.

### Core Domain Classes

- `Vertex`
- `SVGModel`
- `TableModel`
- `RelationshipModel`
- `TableTextAreaModel`
- `TableNameText`
- `TableAttributeText`

### `Vertex`

Represents a 2D coordinate with `x` and `y`. It is used across table placement, relationship routing, anchors, and workspace geometry.

### `SVGModel`

Acts as the base class for diagram-linked domain entities. It contains:

- identification
- coordinate
- cssClass
- visualElementRef

Important clarification:

The original spec tightly couples the model to SVG elements. In the MVP, this should be represented as a visual reference abstraction rather than direct raw DOM ownership everywhere. The object may keep a reference to the rendered element or cell identity, but rendering updates should be coordinated through a dedicated adapter/assembler layer.

### `TableModel`

Owns the semantic and visual state of a table:

- table text areas
- logical and physical names
- primary key list
- attribute list
- relationship lists
- root points and internal angles for edge anchoring
- selection state
- drag state

### `RelationshipModel`

Owns the semantic and visual state of a relationship:

- source/primary table
- target/secondary table
- relationship cardinality and metadata
- route segments
- anchors and bend points
- selection state

### `TableTextAreaModel`

Represents structural zones inside a table visualization:

- mask area
- name area
- primary key area
- attribute area

It remains composed by `TableModel` and exists to support layout and positioning logic.

### `TableNameText`

Represents logical and physical table names displayed inside the table.

### `TableAttributeText`

Represents attribute metadata, including:

- logicalName
- physicalName
- isNull
- definition
- example
- domain
- dataType
- size
- isPrimaryKey
- isForeignKey

## Domain vs Editor Engine Boundary

This boundary is critical.

### Source of Truth

The canonical project model must live in our domain layer, not in X6's graph state.

### X6 Responsibility

X6 is responsible for:

- rendering nodes and edges
- pointer and drag infrastructure
- selection behavior
- viewport, zoom, and pan
- edge connection interactions
- graph event hooks

### Adapter Responsibility

An adapter layer translates:

- `TableModel` -> X6 node
- `RelationshipModel` -> X6 edge
- X6 interaction events -> domain mutations

This boundary ensures that:

- DDL generation is independent from the visual engine
- validation is independent from rendering
- persistence format remains stable
- future replacement of the editor engine remains possible

## Proposed Source Tree

The original spec mixes `scr` and `src`. We will standardize on `src`.

Recommended structure:

```text
src/
  app/
  modeler/
    control/
      action/
      assembler/
        form/
          relationship/
          table/
        relationship/
        table/
      config/
      handler/
        form/
        relationship/
        table/
        workspace/
      util/
    enum/
    model/
      relationship/
        segment/
      table/
        text/
    util/
      collection/
      date/
      exception/
    view/
      img/
      modal/
      panel/
      style/
  server/
    api/
    ddl/
    persistence/
    validation/
  lib/
supabase/
```

### Directory Intent

- `src/modeler`: product-specific modeler engine
- `src/server`: backend services and business logic
- `src/app`: Next.js routes and page entry points
- `supabase`: SQL migrations and related infrastructure

## Persistence Design

The application must persist both canonical project state and version history.

## Canonical Project Format

A project should be stored primarily as structured JSON representing the semantic model and diagram layout.

Recommended top-level structure:

```json
{
  "project": {
    "id": "proj_123",
    "name": "Sales Model",
    "description": "Core sales schema"
  },
  "model": {
    "tables": [],
    "relationships": []
  },
  "diagram": {
    "viewport": {
      "x": 0,
      "y": 0,
      "zoom": 1
    }
  },
  "metadata": {
    "viewMode": "logical",
    "postgresVersion": "default"
  }
}
```

### Why JSON as Canonical Storage

- easy to version
- easy to validate
- easy to send over API
- easy to migrate over time
- independent from X6 internal graph format

## Server Persistence Model

Recommended initial tables:

### `projects`

- `id`
- `name`
- `description`
- `current_version`
- `created_at`
- `updated_at`

### `project_versions`

- `id`
- `project_id`
- `version_number`
- `snapshot_json`
- `created_at`

### `data_types`

- `id`
- `code`
- `label`
- `dialect`
- `is_active`

This allows:

- listing projects quickly
- opening latest version
- retaining edit history
- supporting configurable datatype catalogs

## Local Browser Persistence

The front end also needs temporary storage for resilience and recovery.

### Recommended Approach

Use IndexedDB for:

- autosave snapshots
- restore after browser refresh
- local recovery when remote save fails
- staging unsynced changes temporarily

### Why IndexedDB

The original requirement asked for temporary complex local storage analogous to SQLite. IndexedDB is the most appropriate browser-native solution for structured local persistence of complex data.

### Recovery Policy

- local autosave writes frequently with debounce/throttling
- server save runs in parallel on a slower debounce
- when opening a project, the app checks for an unsynced newer local snapshot and offers recovery

## API Design

The MVP uses Next.js Route Handlers as the backend interface.

Recommended endpoints:

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `POST /api/projects/:id/ddl`

### Endpoint Responsibilities

#### `GET /api/projects`

Return project list with summary fields.

#### `POST /api/projects`

Create a new empty project with initial version.

#### `GET /api/projects/:id`

Return the latest canonical project snapshot required to rebuild the workspace.

#### `PUT /api/projects/:id`

Persist the current working project state. For MVP semantics:

- autosave updates the latest working snapshot for the project
- explicit user save creates a new immutable `project_versions` record and updates `projects.current_version`
- failed version creation must not discard the working snapshot

#### `POST /api/projects/:id/ddl`

Validate current project model and return generated PostgreSQL DDL.

## DDL Generation Design

DDL generation should be a dedicated server-side pipeline, never a side effect of the visual editor.

### Pipeline

1. Validate model semantics
2. Map canonical model into a database-oriented intermediate representation
3. Generate PostgreSQL DDL text

### Recommended Modules

- `ModelValidator`
- `PostgresDDLMapper`
- `PostgresDDLGenerator`

### Why a Two-Step Generation Pipeline

If the editor emits SQL directly from UI state, the system becomes tightly coupled and difficult to extend. An intermediate representation keeps DDL generation independent from the workspace rendering model.

This also creates a clean path to future support for:

- different naming strategies
- multiple SQL dialects
- richer validation rules
- additional exporters

## Validation Strategy

The system must reject invalid or incomplete models before generating DDL and should surface warnings during editing.

### Core Validation Rules

- table must have a valid name
- attribute must have a valid name
- duplicate attribute names within a table are invalid
- duplicate table names are invalid
- primary key configuration must be coherent
- foreign key relationships must reference valid targets
- selected datatypes must be valid for PostgreSQL catalog
- incompatible size/type combinations must be rejected or warned

### Validation Layers

- client-side validation for fast feedback
- server-side validation as authoritative gate before save and DDL generation

## Error Handling

The system should be resilient without overcomplicating the MVP.

### Client-Side Error Cases

- network failure while saving
- failed project load
- invalid user input in forms
- editor sync failure between domain and graph

### Server-Side Error Cases

- malformed project payload
- invalid project state
- database failure
- DDL generation failure

### User Experience Expectations

- never silently drop changes
- keep local recovery data when remote save fails
- display clear validation errors
- preserve editor usability when non-fatal saves fail

## Future Multi-User Evolution

The MVP is intentionally single-user without auth, but future multi-user support should be anticipated.

### Future Additions

- Supabase Auth
- `owner_user_id` on projects
- Row Level Security
- project sharing model
- collaborative editing or locking

### Design Choices That Preserve This Path

- canonical project JSON independent from UI engine
- API-based server persistence instead of direct unrestricted browser writes
- explicit project and version tables
- isolated authentication boundary around backend handlers

## Testing Strategy

Testing should focus on confidence in the domain and export pipeline first, then UI flows.

### Unit Tests

- domain models
- geometry helpers
- validation rules
- serialization/deserialization
- DDL generation

### Integration Tests

- API routes
- persistence services
- database interactions

### Component Tests

- project list UI
- forms and panels
- DDL preview UI

### End-to-End Tests

- create project
- add tables
- add attributes
- connect relationships
- save
- reopen
- generate PostgreSQL DDL

## Delivery Strategy

Because the MVP is broad, implementation should proceed in increments while preserving a working baseline.

### Recommended Build Sequence

1. App foundation and persistence skeleton
2. Domain model and serialization layer
3. X6 workspace integration
4. Table editing flows
5. Relationship editing flows
6. Validation and DDL generation
7. Hardening, recovery flows, and test coverage

## Key Trade-Offs

### Why Not Build the SVG Editor Entirely from Scratch

Building the full editor from scratch would consume significant effort in generic diagram infrastructure such as selection, viewporting, connection behavior, routing, and interaction edge cases. That work is not core product differentiation for the MVP.

### Why Not Let X6 Own All State

If X6 becomes the canonical data model, the project becomes harder to validate, persist, version, and export safely. The product must own the semantic model.

### Why Not Use Supabase Browser Writes Directly

Even in a single-user MVP, the browser should not be treated as the privileged persistence client. Routing persistence through backend handlers produces a clearer future path to auth, authorization, and richer validation.

## Final Recommendation

Implement the MVP as a Next.js application backed by Supabase Postgres, using X6 as the diagram interaction engine and a domain-owned TypeScript model as the canonical source of truth.

This design best balances:

- speed of MVP delivery
- maintainability
- alignment with the original object-oriented specification
- server persistence requirements
- PostgreSQL DDL generation
- future migration path to multi-user architecture
