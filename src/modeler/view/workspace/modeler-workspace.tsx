'use client'

import { useEffect, useRef } from 'react'
import { useMemo, useState } from 'react'
import { createProjectLocalStore } from '@/lib/local/indexeddb-project-store'
import { WorkspaceController } from '@/modeler/control/handler/workspace/workspace-controller'
import type { TableModel } from '@/modeler/model/table/table-model'
import { DDLPreviewModal } from '@/modeler/view/modal/ddl-preview-modal'
import { ProjectSidebar } from '@/modeler/view/panel/project-sidebar'
import { PropertyPanel } from '@/modeler/view/panel/property-panel'

type ModelerWorkspaceProps = {
  projectId: string
  initialProject: {
    project: {
      id: string
      name: string
    }
    model: {
      tables: Array<{
        id: string
        logicalName: string
        physicalName: string | null
        attributes?: unknown[]
      }>
      relationships: unknown[]
    }
  }
}

export function ModelerWorkspace({ projectId, initialProject }: ModelerWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const tablesByIdRef = useRef<Map<string, TableModel>>(new Map())
  const localStore = useMemo(() => createProjectLocalStore(), [])
  const [tables, setTables] = useState(initialProject.model.tables)
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

      graphInstance.on?.('node:moved', ({ node }: { node: { id: string; position: () => { x: number; y: number } } }) => {
        const table = tablesByIdRef.current.get(node.id)

        if (!table) {
          return
        }

        controller.applyNodeMoved(table, node.position())
      })
    })

    return () => {
      disposed = true
      graphInstance?.dispose()
    }
  }, [])

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
        <div ref={canvasRef} data-testid="modeler-canvas" className="modeler-canvas">
          <div className="schema-card-layer">
            {tables.map((table) => (
              <article key={table.id} className="schema-card">
                <div className="schema-card__header">{table.logicalName}</div>
                <div className="schema-card__body">Logical table ready for PostgreSQL DDL generation.</div>
              </article>
            ))}
          </div>
        </div>
      </section>
        <PropertyPanel>
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
