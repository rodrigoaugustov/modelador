'use client'

import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (!canvasRef.current || process.env.NODE_ENV === 'test') {
      return
    }

    let disposed = false
    let graphInstance: { dispose: () => void } | null = null

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
