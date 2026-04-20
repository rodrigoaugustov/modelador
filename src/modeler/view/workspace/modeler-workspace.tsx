'use client'

import { useEffect, useRef } from 'react'
import { WorkspaceController } from '@/modeler/control/handler/workspace/workspace-controller'
import type { TableModel } from '@/modeler/model/table/table-model'
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
      tables: unknown[]
      relationships: unknown[]
    }
  }
}

export function ModelerWorkspace({ projectId, initialProject }: ModelerWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const tablesByIdRef = useRef<Map<string, TableModel>>(new Map())

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

  return (
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
        <div ref={canvasRef} data-testid="modeler-canvas" className="modeler-canvas" />
      </section>
      <PropertyPanel />
    </div>
  )
}
