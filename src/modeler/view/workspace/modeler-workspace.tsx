'use client'

import { useEffect, useRef } from 'react'
import { useMemo, useState } from 'react'
import { createProjectLocalStore } from '@/lib/local/indexeddb-project-store'
import { createTableNodeDefinition } from '@/modeler/control/assembler/table/table-node-factory'
import { TableSelectionController } from '@/modeler/control/handler/table/table-selection-controller'
import { WorkspaceController } from '@/modeler/control/handler/workspace/workspace-controller'
import { TableModel } from '@/modeler/model/table/table-model'
import { TableAttributeText } from '@/modeler/model/table/text/table-attribute-text'
import type { EditorProjectSnapshot, EditorTableSnapshot } from '@/modeler/types/editor-snapshot'
import { DDLPreviewModal } from '@/modeler/view/modal/ddl-preview-modal'
import { ProjectSidebar } from '@/modeler/view/panel/project-sidebar'
import { PropertyPanel } from '@/modeler/view/panel/property-panel'

type ModelerWorkspaceProps = {
  projectId: string
  initialProject: EditorProjectSnapshot
}

function normalizeTables(tables: EditorTableSnapshot[]) {
  return tables.map((table, index) => ({
    ...table,
    coordinate: table.coordinate ?? {
      x: 64 + index * 32,
      y: 64 + index * 24,
    },
    attributes: table.attributes ?? [],
  }))
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

  for (const attribute of table.attributes) {
    applyAttributeSnapshot(domainTable, attribute)
  }

  return domainTable
}

export function ModelerWorkspace({ projectId, initialProject }: ModelerWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const tablesByIdRef = useRef<Map<string, TableModel>>(new Map())
  const skipNextGraphSyncRef = useRef(false)
  const graphRef = useRef<{
    clearCells: () => void
    addNode: (metadata: unknown) => void
    dispose: () => void
    on?: (eventName: string, handler: (event: { node: { id: string; position: () => { x: number; y: number } } }) => void) => void
  } | null>(null)
  const localStore = useMemo(() => createProjectLocalStore(), [])
  const [tables, setTables] = useState(() => normalizeTables(initialProject.model.tables))
  const [graphReady, setGraphReady] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [isAddingTable, setIsAddingTable] = useState(false)
  const [logicalTableName, setLogicalTableName] = useState('')
  const [ddl, setDdl] = useState<string | null>(null)

  const snapshot = useMemo(
    () => ({
      ...initialProject,
      model: {
        ...initialProject.model,
        tables,
      },
    }),
    [initialProject, tables],
  )

  useEffect(() => {
    if (!canvasRef.current || process.env.NODE_ENV === 'test') {
      return
    }

    let disposed = false
    let graphInstance: { dispose: () => void } | null = null
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
    graphRef.current.clearCells()

    for (const table of tables) {
      const domainTable = hydrateDomainTable({
        ...table,
        coordinate: table.coordinate ?? { x: 64, y: 64 },
      })

      graphRef.current.addNode(createTableNodeDefinition(domainTable))
      nextTableMap.set(table.id, domainTable)
    }

    tablesByIdRef.current = nextTableMap
  }, [graphReady, tables])

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
    const nextTables = [
      ...tables,
      {
        id: `table_${crypto.randomUUID()}`,
        logicalName: logicalTableName,
        physicalName: null,
        attributes: [],
        coordinate: {
          x: 64 + tables.length * 32,
          y: 64 + tables.length * 24,
        },
      },
    ]

    const nextSnapshot = {
      ...snapshot,
      model: {
        ...snapshot.model,
        tables: nextTables,
      },
    }

    setTables(nextTables)
    setLogicalTableName('')
    setIsAddingTable(false)
    await persistSnapshot(nextSnapshot)
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
                  <div className="schema-card__header">{table.logicalName}</div>
                  <div className="schema-card__body">
                    {table.attributes.map((attribute) => (
                      <div key={attribute.id}>
                        {attribute.logicalName} {attribute.dataType?.toUpperCase() ?? 'TEXT'}
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
          {isAddingTable ? (
            <form
              className="property-form"
              onSubmit={(event) => {
                event.preventDefault()
                void handleSaveTable()
              }}
            >
              <label htmlFor="logical-table-name">Logical table name</label>
              <input
                id="logical-table-name"
                name="logical-table-name"
                value={logicalTableName}
                onChange={(event) => setLogicalTableName(event.target.value)}
              />
              <div className="modeler-toolbar">
                <button className="modeler-toolbar__button" type="submit">
                  Save table
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="modeler-panel__copy">
                Select a table or relationship to edit its metadata, naming, and PostgreSQL details.
              </p>
              <div className="modeler-toolbar">
                <button className="modeler-toolbar__button" type="button" onClick={() => setIsAddingTable(true)}>
                  Add table
                </button>
                <button className="modeler-toolbar__button modeler-toolbar__button--ghost" type="button" onClick={() => void handleGenerateDDL()}>
                  Generate DDL
                </button>
              </div>
            </>
          )}
        </PropertyPanel>
      </div>
      {ddl ? <DDLPreviewModal ddl={ddl} onClose={() => setDdl(null)} /> : null}
    </>
  )
}
