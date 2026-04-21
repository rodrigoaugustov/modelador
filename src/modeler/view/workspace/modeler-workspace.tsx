'use client'

import { useEffect, useRef } from 'react'
import { useMemo, useState } from 'react'
import { createProjectLocalStore } from '@/lib/local/indexeddb-project-store'
import { createRelationshipEdgeDefinition } from '@/modeler/control/assembler/relationship/relationship-edge-factory'
import { createTableNodeDefinition } from '@/modeler/control/assembler/table/table-node-factory'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'
import { CreateTableFormHandler } from '@/modeler/control/handler/form/table/create-table-form-handler'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'
import { EditTableDetailsFormHandler } from '@/modeler/control/handler/form/table/edit-table-details-form-handler'
import { TableSelectionController } from '@/modeler/control/handler/table/table-selection-controller'
import { ViewModeController } from '@/modeler/control/handler/workspace/view-mode-controller'
import { WorkspaceController } from '@/modeler/control/handler/workspace/workspace-controller'
import { ViewMode } from '@/modeler/enum/view-mode'
import { RelationshipModel } from '@/modeler/model/relationship/relationship-model'
import { TableModel } from '@/modeler/model/table/table-model'
import { TableAttributeText } from '@/modeler/model/table/text/table-attribute-text'
import type {
  EditorProjectSnapshot,
  EditorRelationshipSnapshot,
  EditorTableSnapshot,
} from '@/modeler/types/editor-snapshot'
import { ConfigureRelationshipModal } from '@/modeler/view/modal/configure-relationship-modal'
import { CreateTableModal } from '@/modeler/view/modal/create-table-modal'
import { DDLPreviewModal } from '@/modeler/view/modal/ddl-preview-modal'
import { EditAttributesModal } from '@/modeler/view/modal/edit-attributes-modal'
import { EditTableDetailsModal } from '@/modeler/view/modal/edit-table-details-modal'
import { ProjectSidebar } from '@/modeler/view/panel/project-sidebar'
import { PropertyPanel } from '@/modeler/view/panel/property-panel'

type ModelerWorkspaceProps = {
  projectId: string
  initialProject: EditorProjectSnapshot
}

function getDefaultTableCoordinate(index: number) {
  return {
    x: 72 + (index % 3) * 320,
    y: 72 + Math.floor(index / 3) * 220,
  }
}

function normalizeTables(tables: EditorTableSnapshot[]) {
  return tables.map((table, index) => ({
    ...table,
    coordinate: table.coordinate ?? getDefaultTableCoordinate(index),
    attributes: table.attributes ?? [],
  }))
}

function resolveSnapshotName(
  table: Pick<EditorTableSnapshot, 'logicalName' | 'physicalName'>,
  viewMode: ViewMode,
) {
  return viewMode === ViewMode.Physical
    ? table.physicalName ?? table.logicalName
    : table.logicalName ?? table.physicalName ?? 'unnamed'
}

function resolveAttributeSnapshotName(
  attribute: Pick<EditorTableSnapshot['attributes'][number], 'logicalName' | 'physicalName'>,
  viewMode: ViewMode,
) {
  return viewMode === ViewMode.Physical
    ? attribute.physicalName ?? attribute.logicalName
    : attribute.logicalName ?? attribute.physicalName ?? 'unnamed'
}

function synchronizeForeignKeyFlags(
  tables: EditorTableSnapshot[],
  relationships: EditorRelationshipSnapshot[],
) {
  const foreignKeyAttributeIds = new Set(relationships.map((relationship) => relationship.secondaryAttributeId))

  return tables.map((table) => ({
    ...table,
    attributes: table.attributes.map((attribute) => ({
      ...attribute,
      isForeignKey: foreignKeyAttributeIds.has(attribute.id),
    })),
  }))
}

function pruneRelationships(
  tables: EditorTableSnapshot[],
  relationships: EditorRelationshipSnapshot[],
) {
  const tableIds = new Set(tables.map((table) => table.id))
  const attributeIds = new Set(tables.flatMap((table) => table.attributes.map((attribute) => attribute.id)))

  return relationships.filter(
    (relationship) =>
      tableIds.has(relationship.primaryTableId) &&
      tableIds.has(relationship.secondaryTableId) &&
      attributeIds.has(relationship.primaryAttributeId) &&
      attributeIds.has(relationship.secondaryAttributeId),
  )
}

function applyAttributeSnapshot(table: TableModel, attribute: EditorTableSnapshot['attributes'][number]) {
  const targetArea = attribute.isPrimaryKey ? table.primaryKeyArea : table.attributeArea
  const attributeModel = new TableAttributeText(targetArea, 'table-attribute-text', attribute.id)

  attributeModel.logicalName = attribute.logicalName
  attributeModel.physicalName = attribute.physicalName
  attributeModel.dataType = attribute.dataType
  attributeModel.size = attribute.size
  attributeModel.isNull = attribute.isNull
  attributeModel.isPrimaryKey = attribute.isPrimaryKey
  attributeModel.isForeignKey = attribute.isForeignKey
  attributeModel.definition = attribute.definition
  attributeModel.example = attribute.example
  attributeModel.domain = attribute.domain

  if (attribute.isPrimaryKey) {
    table.tablePrimaryKeyList.set(attribute.id, attributeModel)
    return
  }

  table.tableAttributeList.set(attribute.id, attributeModel)
}

function hydrateDomainTable(table: EditorTableSnapshot) {
  const domainTable = TableModel.create({
    id: table.id,
    name: table.logicalName,
    x: table.coordinate.x,
    y: table.coordinate.y,
  })
  domainTable.tableName.physicalName = table.physicalName

  for (const attribute of table.attributes) {
    applyAttributeSnapshot(domainTable, attribute)
  }

  return domainTable
}

function hydrateRelationship(
  relationship: EditorRelationshipSnapshot,
  tablesById: Map<string, TableModel>,
) {
  const primaryTable = tablesById.get(relationship.primaryTableId)
  const secondaryTable = tablesById.get(relationship.secondaryTableId)

  if (!primaryTable || !secondaryTable) {
    return null
  }

  primaryTable.relationshipAsPrimaryTableList.set(relationship.id, secondaryTable.identification)
  secondaryTable.relationshipAsSecondaryTableList.set(relationship.id, primaryTable.identification)

  return RelationshipModel.create({
    id: relationship.id,
    primaryTable,
    secondaryTable,
    primaryAttributeId: relationship.primaryAttributeId,
    secondaryAttributeId: relationship.secondaryAttributeId,
    relationshipType: relationship.relationshipType,
    onDelete: relationship.onDelete,
    onUpdate: relationship.onUpdate,
    enforceConstraint: relationship.enforceConstraint,
  })
}

export function ModelerWorkspace({ projectId, initialProject }: ModelerWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const tablesByIdRef = useRef<Map<string, TableModel>>(new Map())
  const skipNextGraphSyncRef = useRef(false)
  const graphRef = useRef<{
    resetCells: (cells: unknown[]) => void
    clearCells: () => void
    addNode: (metadata: unknown) => void
    addEdge: (metadata: unknown) => void
    createNode: (metadata: unknown) => unknown
    createEdge: (metadata: unknown) => unknown
    dispose: () => void
    on?: (eventName: string, handler: (event: { node: { id: string; position: () => { x: number; y: number } } }) => void) => void
  } | null>(null)
  const localStore = useMemo(() => createProjectLocalStore(), [])
  const createTableFormHandler = useMemo(() => new CreateTableFormHandler(), [])
  const configureRelationshipFormHandler = useMemo(() => new ConfigureRelationshipFormHandler(), [])
  const editAttributesFormHandler = useMemo(() => new EditAttributesFormHandler(), [])
  const editTableDetailsFormHandler = useMemo(() => new EditTableDetailsFormHandler(), [])
  const viewModeController = useMemo(() => new ViewModeController(), [])
  const [tables, setTables] = useState(() => normalizeTables(initialProject.model.tables))
  const [relationships, setRelationships] = useState(() => initialProject.model.relationships ?? [])
  const [viewMode, setViewMode] = useState<ViewMode>(initialProject.metadata?.viewMode ?? ViewMode.Logical)
  const [graphReady, setGraphReady] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [isAddingTable, setIsAddingTable] = useState(false)
  const [isEditingAttributes, setIsEditingAttributes] = useState(false)
  const [isEditingTableDetails, setIsEditingTableDetails] = useState(false)
  const [isConfiguringRelationship, setIsConfiguringRelationship] = useState(false)
  const [tableDraft, setTableDraft] = useState<Omit<EditorTableSnapshot, 'id' | 'coordinate'> | null>(null)
  const [attributeDraftTable, setAttributeDraftTable] = useState<EditorTableSnapshot | null>(null)
  const [tableDetailsDraft, setTableDetailsDraft] = useState<EditorTableSnapshot | null>(null)
  const [relationshipDraft, setRelationshipDraft] = useState<EditorRelationshipSnapshot | null>(null)
  const [ddl, setDdl] = useState<string | null>(null)
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null

  const snapshot = useMemo(
    () => ({
      ...initialProject,
      model: {
        ...initialProject.model,
        tables,
        relationships,
      },
      metadata: {
        ...(initialProject.metadata ?? { postgresVersion: 'default' }),
        viewMode,
      },
    }),
    [initialProject, relationships, tables, viewMode],
  )

  useEffect(() => {
    if (!canvasRef.current || process.env.NODE_ENV === 'test') {
      return
    }

    let disposed = false
    let graphInstance: typeof graphRef.current = null
    const controller = new WorkspaceController()
    const selectionController = new TableSelectionController()

    void import('@antv/x6').then(({ Graph }) => {
      if (!canvasRef.current || disposed) {
        return
      }

      graphInstance = new Graph({
        container: canvasRef.current,
        grid: true,
        panning: true,
        mousewheel: true,
        selecting: true,
        background: {
          color: '#f7f9fb',
        },
      })
      graphRef.current = graphInstance
      setGraphReady(true)

      graphInstance.on?.('node:click', ({ node }: { node: { id: string } }) => {
        setSelectedTableId((currentSelection) =>
          selectionController.selectTable(
            {
              selectedTableId: currentSelection,
              selectedRelationshipId: null,
            },
            node.id,
          ).selectedTableId,
        )
      })

      graphInstance.on?.('node:moved', ({ node }: { node: { id: string; position: () => { x: number; y: number } } }) => {
        const table = tablesByIdRef.current.get(node.id)

        if (!table) {
          return
        }

        controller.applyNodeMoved(table, node.position())
        skipNextGraphSyncRef.current = true
        setTables((currentTables) =>
          currentTables.map((currentTable) =>
            currentTable.id === node.id
              ? {
                  ...currentTable,
                  coordinate: node.position(),
                }
              : currentTable,
          ),
        )
      })
    })

    return () => {
      disposed = true
      graphRef.current = null
      setGraphReady(false)
      graphInstance?.dispose()
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV === 'test' || !graphReady || !graphRef.current) {
      return
    }

    if (skipNextGraphSyncRef.current) {
      skipNextGraphSyncRef.current = false
      return
    }

    const nextTableMap = new Map<string, TableModel>()
    const cells: unknown[] = []

    for (const table of tables) {
      const domainTable = hydrateDomainTable({
        ...table,
        coordinate: table.coordinate ?? { x: 64, y: 64 },
      })

      cells.push(graphRef.current.createNode(createTableNodeDefinition(domainTable, viewMode)))
      nextTableMap.set(table.id, domainTable)
    }

    for (const relationship of relationships) {
      const domainRelationship = hydrateRelationship(relationship, nextTableMap)

      if (!domainRelationship) {
        continue
      }

      cells.push(graphRef.current.createEdge(createRelationshipEdgeDefinition(domainRelationship)))
    }

    graphRef.current.resetCells(cells)
    tablesByIdRef.current = nextTableMap
  }, [graphReady, relationships, tables, viewMode])

  async function persistSnapshot(nextSnapshot: typeof snapshot) {
    await localStore.save(projectId, nextSnapshot)

    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ snapshot: nextSnapshot }),
    })
  }

  async function handleSaveTable() {
    if (!tableDraft) {
      return
    }

    const tableId = `table_${crypto.randomUUID()}`
    const nextTables = [
      ...tables,
      {
        id: tableId,
        logicalName: tableDraft.logicalName,
        physicalName: tableDraft.physicalName,
        schema: tableDraft.schema,
        attributes: tableDraft.attributes.map((attribute, index) => ({
          ...attribute,
          id: `${tableId}_attr_${index}`,
        })),
        coordinate: getDefaultTableCoordinate(tables.length),
      },
    ]

    const nextSnapshot = {
      ...snapshot,
      model: {
        ...snapshot.model,
        tables: nextTables,
      },
    }

    await persistSnapshot(nextSnapshot)
    setTables(nextTables)
    setIsAddingTable(false)
    setTableDraft(null)
    setSelectedTableId(tableId)
  }

  async function handleGenerateDDL() {
    const response = await fetch(`/api/projects/${projectId}/ddl`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ snapshot }),
    })

    const body = await response.json()
    setDdl(body.ddl)
  }

  async function handleApplyAttributeChanges() {
    if (!attributeDraftTable) {
      return
    }

    const nextTables = tables.map((table) => (table.id === attributeDraftTable.id ? attributeDraftTable : table))
    const nextRelationships = pruneRelationships(nextTables, relationships)
    const nextTablesWithFlags = synchronizeForeignKeyFlags(nextTables, nextRelationships)
    const nextSnapshot = {
      ...snapshot,
      model: {
        ...snapshot.model,
        tables: nextTablesWithFlags,
        relationships: nextRelationships,
      },
    }

    await persistSnapshot(nextSnapshot)
    setTables(nextTablesWithFlags)
    setRelationships(nextRelationships)
    setIsEditingAttributes(false)
    setAttributeDraftTable(null)
  }

  async function handleApplyTableDetails() {
    if (!tableDetailsDraft) {
      return
    }

    const nextTables = tables.map((table) =>
      table.id === tableDetailsDraft.id
        ? editTableDetailsFormHandler.apply(table, {
            logicalName: tableDetailsDraft.logicalName,
            physicalName: tableDetailsDraft.physicalName,
            schema: tableDetailsDraft.schema,
          })
        : table,
    )
    const nextSnapshot = {
      ...snapshot,
      model: {
        ...snapshot.model,
        tables: nextTables,
      },
    }

    await persistSnapshot(nextSnapshot)
    setTables(nextTables)
    setIsEditingTableDetails(false)
    setTableDetailsDraft(null)
  }

  async function handleCreateRelationship() {
    if (!relationshipDraft) {
      return
    }

    const nextRelationships = [...relationships, relationshipDraft]
    const nextTables = synchronizeForeignKeyFlags(tables, nextRelationships)
    const nextSnapshot = {
      ...snapshot,
      model: {
        ...snapshot.model,
        tables: nextTables,
        relationships: nextRelationships,
      },
    }

    await persistSnapshot(nextSnapshot)
    setTables(nextTables)
    setRelationships(nextRelationships)
    setIsConfiguringRelationship(false)
    setRelationshipDraft(null)
  }

  async function handleDeleteSelectedTable() {
    if (!selectedTable) {
      return
    }

    const nextTables = tables.filter((table) => table.id !== selectedTable.id)
    const nextRelationships = pruneRelationships(
      nextTables,
      relationships.filter(
        (relationship) =>
          relationship.primaryTableId !== selectedTable.id && relationship.secondaryTableId !== selectedTable.id,
      ),
    )
    const nextTablesWithFlags = synchronizeForeignKeyFlags(nextTables, nextRelationships)
    const nextSnapshot = {
      ...snapshot,
      model: {
        ...snapshot.model,
        tables: nextTablesWithFlags,
        relationships: nextRelationships,
      },
    }

    await persistSnapshot(nextSnapshot)
    setTables(nextTablesWithFlags)
    setRelationships(nextRelationships)
    setSelectedTableId(nextTablesWithFlags.at(-1)?.id ?? null)
  }

  async function handleToggleViewMode() {
    const nextViewMode = viewModeController.toggle(viewMode)
    const nextSnapshot = {
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        viewMode: nextViewMode,
      },
    }

    await persistSnapshot(nextSnapshot)
    setViewMode(nextViewMode)
  }

  return (
    <>
      <div className="modeler-layout">
        <ProjectSidebar project={initialProject.project} />
      <section className="modeler-canvas-shell" aria-label="Modeler canvas workspace">
        <header className="modeler-canvas-toolbar">
          <div>
            <h1 className="modeler-canvas-toolbar__title">Model Editor</h1>
            <p className="modeler-canvas-toolbar__meta">Project {projectId}</p>
          </div>
          <p className="modeler-canvas-toolbar__meta">Forward design for PostgreSQL</p>
        </header>
        <div className="modeler-canvas-frame">
          <div ref={canvasRef} data-testid="modeler-canvas" className="modeler-canvas" />
          {process.env.NODE_ENV === 'test' && tables.length > 0 ? (
            <div className="schema-card-layer">
              {tables.map((table) => (
                <article
                  key={table.id}
                  className="schema-card"
                  data-selected={selectedTableId === table.id ? 'true' : 'false'}
                  onClick={() => setSelectedTableId(table.id)}
                >
                  <div className="schema-card__header">{resolveSnapshotName(table, viewMode)}</div>
                  <div className="schema-card__body">
                    {table.attributes.map((attribute) => (
                      <div key={attribute.id}>
                        {resolveAttributeSnapshotName(attribute, viewMode)} {attribute.dataType?.toUpperCase() ?? 'TEXT'}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {tables.length === 0 ? (
            <div className="schema-card-layer">
              <article className="schema-card">
                <div className="schema-card__header">Start modeling</div>
                <div className="schema-card__body">Add your first table to populate the blueprint canvas.</div>
              </article>
            </div>
          ) : null}
        </div>
      </section>
        <PropertyPanel title={selectedTableId ? 'Table Properties' : 'Selection'}>
          <p className="modeler-panel__copy">
            Select a table or relationship to edit its metadata, naming, and PostgreSQL details.
          </p>
          <div className="modeler-toolbar">
            <button
              className="modeler-toolbar__button"
              type="button"
              onClick={() => {
                setTableDraft(createTableFormHandler.createDraft())
                setIsAddingTable(true)
              }}
            >
              Add table
            </button>
            <button
              className="modeler-toolbar__button modeler-toolbar__button--ghost"
              type="button"
              onClick={() => void handleToggleViewMode()}
            >
              {viewMode === ViewMode.Logical ? 'Switch to physical mode' : 'Switch to logical mode'}
            </button>
            {selectedTable ? (
              <button
                className="modeler-toolbar__button modeler-toolbar__button--ghost"
                type="button"
                onClick={() => {
                  setTableDetailsDraft(structuredClone(selectedTable))
                  setIsEditingTableDetails(true)
                }}
              >
                Edit table details
              </button>
            ) : null}
            {selectedTable ? (
              <button
                className="modeler-toolbar__button modeler-toolbar__button--ghost"
                type="button"
                onClick={() => {
                  setAttributeDraftTable(structuredClone(selectedTable))
                  setIsEditingAttributes(true)
                }}
              >
                Edit attributes
              </button>
            ) : null}
            {tables.length >= 2 ? (
              <button
                className="modeler-toolbar__button modeler-toolbar__button--ghost"
                type="button"
                onClick={() => {
                  const orderedTables = selectedTable
                    ? [selectedTable, ...tables.filter((table) => table.id !== selectedTable.id)]
                    : tables
                  setRelationshipDraft(configureRelationshipFormHandler.createDraftFromTables(orderedTables))
                  setIsConfiguringRelationship(true)
                }}
              >
                Configure relationship
              </button>
            ) : null}
            {selectedTable ? (
              <button
                className="modeler-toolbar__button modeler-toolbar__button--danger"
                type="button"
                onClick={() => void handleDeleteSelectedTable()}
              >
                Delete table
              </button>
            ) : null}
            <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={() => void handleGenerateDDL()}>
              Generate DDL
            </button>
          </div>
        </PropertyPanel>
      </div>
      {isAddingTable && tableDraft ? (
        <CreateTableModal
          draft={tableDraft}
          onClose={() => {
            setIsAddingTable(false)
            setTableDraft(null)
          }}
          onChange={setTableDraft}
          onSubmit={() => void handleSaveTable()}
        />
      ) : null}
      {isEditingAttributes && attributeDraftTable ? (
        <EditAttributesModal
          table={attributeDraftTable}
          onClose={() => {
            setIsEditingAttributes(false)
            setAttributeDraftTable(null)
          }}
          onChange={setAttributeDraftTable}
          onAddColumn={() =>
            setAttributeDraftTable((currentDraft) =>
              currentDraft
                ? {
                    ...currentDraft,
                    attributes: editAttributesFormHandler.addAttribute(currentDraft.attributes),
                  }
                : currentDraft,
            )
          }
          onRemoveAttribute={(attributeId) =>
            setAttributeDraftTable((currentDraft) =>
              currentDraft
                ? {
                    ...currentDraft,
                    attributes: editAttributesFormHandler.removeAttribute(currentDraft.attributes, attributeId),
                  }
                : currentDraft,
            )
          }
          onApply={() => void handleApplyAttributeChanges()}
        />
      ) : null}
      {isEditingTableDetails && tableDetailsDraft ? (
        <EditTableDetailsModal
          table={tableDetailsDraft}
          onClose={() => {
            setIsEditingTableDetails(false)
            setTableDetailsDraft(null)
          }}
          onChange={setTableDetailsDraft}
          onApply={() => void handleApplyTableDetails()}
        />
      ) : null}
      {isConfiguringRelationship && relationshipDraft ? (
        <ConfigureRelationshipModal
          draft={relationshipDraft}
          tables={tables}
          onClose={() => {
            setIsConfiguringRelationship(false)
            setRelationshipDraft(null)
          }}
          onChange={setRelationshipDraft}
          onSubmit={() => void handleCreateRelationship()}
        />
      ) : null}
      {ddl ? <DDLPreviewModal ddl={ddl} onClose={() => setDdl(null)} /> : null}
    </>
  )
}
