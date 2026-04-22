'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Graph as X6Graph } from '@antv/x6'
import { createProjectLocalStore } from '@/lib/local/indexeddb-project-store'
import { createRelationshipEdgeDefinition } from '@/modeler/control/assembler/relationship/relationship-edge-factory'
import {
  createTableNodeDefinition,
  getTableNodeMetrics,
  registerTableNodeShape,
} from '@/modeler/control/assembler/table/table-node-factory'
import { ConfigureRelationshipFormHandler } from '@/modeler/control/handler/form/relationship/configure-relationship-form-handler'
import { CreateTableFormHandler } from '@/modeler/control/handler/form/table/create-table-form-handler'
import { EditAttributesFormHandler } from '@/modeler/control/handler/form/table/edit-attributes-form-handler'
import { EditTableDetailsFormHandler } from '@/modeler/control/handler/form/table/edit-table-details-form-handler'
import { TableCollisionGuard } from '@/modeler/control/util/table-collision-guard'
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

type RelationshipDragState = {
  sourceTableId: string
  sourceX: number
  sourceY: number
  currentX: number
  currentY: number
}

type CanvasPoint = {
  x: number
  y: number
}

type ViewportTransform = {
  sx: number
  sy: number
  tx: number
  ty: number
}

const RELATIONSHIP_HANDLE_OFFSET = 18

function getDefaultTableCoordinate(index: number) {
  return {
    x: 72 + (index % 2) * 320,
    y: 72 + Math.floor(index / 2) * 220,
  }
}

function normalizeTables(tables: EditorTableSnapshot[]) {
  return tables.map((table, index) => ({
    ...table,
    schema: table.schema?.trim() ? table.schema : 'public',
    coordinate: table.coordinate ?? getDefaultTableCoordinate(index),
    attributes: [...(table.attributes ?? [])]
      .map((attribute, attributeIndex) => ({
        ...attribute,
        displayOrder: attribute.displayOrder ?? attributeIndex,
      }))
      .sort((left, right) => left.displayOrder - right.displayOrder),
  }))
}

function normalizeRelationships(relationships: EditorRelationshipSnapshot[]) {
  return relationships.map((relationship) => ({
    ...relationship,
    attributeMappings:
      relationship.attributeMappings?.length > 0
        ? relationship.attributeMappings
        : relationship.primaryAttributeId && relationship.secondaryAttributeId
          ? [
              {
                id: `map_${relationship.id}_0`,
                primaryAttributeId: relationship.primaryAttributeId,
                secondaryAttributeId: relationship.secondaryAttributeId,
              },
            ]
          : [],
    lineStyle: relationship.lineStyle ?? 'orthogonal',
    vertices: relationship.vertices ?? [],
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

function resolveRelationshipTypeLabel(type: EditorRelationshipSnapshot['relationshipType']) {
  return RelationshipModel.resolveTypeLabel(type)
}

function getTableCanvasMetrics(table: EditorTableSnapshot) {
  return getTableNodeMetrics({
    primaryKeyCount: table.attributes.filter((attribute) => attribute.isPrimaryKey).length,
    attributeCount: table.attributes.filter((attribute) => !attribute.isPrimaryKey).length,
  })
}

type LiveCoordinateState = Record<string, { x: number; y: number }>

function formatSnapshotAttributeTokens(
  attribute: Pick<EditorTableSnapshot['attributes'][number], 'isForeignKey' | 'isNull'>,
) {
  return [attribute.isForeignKey ? '[FK]' : null, attribute.isNull === false ? '[Not Null]' : null]
    .filter(Boolean)
    .join(' ')
}

function getOrderedSnapshotAttributes(table: EditorTableSnapshot) {
  return [...table.attributes].sort((left, right) => left.displayOrder - right.displayOrder)
}

function getSnapshotTableSections(table: EditorTableSnapshot, viewMode: ViewMode) {
  const orderedAttributes = getOrderedSnapshotAttributes(table)
  const toRow = (attribute: EditorTableSnapshot['attributes'][number]) => {
    const name = resolveAttributeSnapshotName(attribute, viewMode)
    const tokenSuffix = formatSnapshotAttributeTokens(attribute)
    const sizeSuffix = attribute.size ? `(${attribute.size})` : ''

    return {
      id: attribute.id,
      name: tokenSuffix ? `${name} ${tokenSuffix}` : name,
      typeLabel: `${attribute.dataType?.toUpperCase() ?? 'TEXT'}${sizeSuffix}`,
    }
  }

  return {
    primaryKeyRows: orderedAttributes.filter((attribute) => attribute.isPrimaryKey).map(toRow),
    attributeRows: orderedAttributes.filter((attribute) => !attribute.isPrimaryKey).map(toRow),
  }
}

function getRelationshipHandlePoint(table: EditorTableSnapshot, direction: 'in' | 'out') {
  const { width, height } = getTableCanvasMetrics(table)

  return {
    x:
      direction === 'out'
        ? table.coordinate.x + width + RELATIONSHIP_HANDLE_OFFSET
        : table.coordinate.x - RELATIONSHIP_HANDLE_OFFSET,
    y: table.coordinate.y + height / 2,
  }
}

function projectGraphPointToCanvas(
  point: CanvasPoint,
  graph: X6Graph | null,
  frameRect: DOMRect | null,
  viewport: ViewportTransform,
) {
  if (graph && frameRect && typeof graph.localToClient === 'function') {
    const projectedPoint = graph.localToClient(point)

    return {
      x: projectedPoint.x - frameRect.left,
      y: projectedPoint.y - frameRect.top,
    }
  }

  return {
    x: point.x * viewport.sx + viewport.tx,
    y: point.y * viewport.sy + viewport.ty,
  }
}

function resolveRelationshipSummary(
  relationship: EditorRelationshipSnapshot,
  tables: EditorTableSnapshot[],
  viewMode: ViewMode,
) {
  const primaryTable = tables.find((table) => table.id === relationship.primaryTableId)
  const secondaryTable = tables.find((table) => table.id === relationship.secondaryTableId)

  const primaryName = primaryTable ? resolveSnapshotName(primaryTable, viewMode) : relationship.primaryTableId
  const secondaryName = secondaryTable ? resolveSnapshotName(secondaryTable, viewMode) : relationship.secondaryTableId

  return `${primaryName} → ${secondaryName}`
}

function synchronizeForeignKeyFlags(
  tables: EditorTableSnapshot[],
  relationships: EditorRelationshipSnapshot[],
) {
  const foreignKeyAttributeIds = new Set(
    relationships.flatMap((relationship) =>
      relationship.attributeMappings.map((mapping) => mapping.secondaryAttributeId),
    ),
  )

  return tables.map((table) => ({
    ...table,
    attributes: [...table.attributes]
      .sort((left, right) => left.displayOrder - right.displayOrder)
      .map((attribute) => ({
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
      relationship.attributeMappings.length > 0 &&
      relationship.attributeMappings.every(
        (mapping) =>
          attributeIds.has(mapping.primaryAttributeId) && attributeIds.has(mapping.secondaryAttributeId),
      ),
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

  domainTable.isSelected = false

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
    attributeMappings: relationship.attributeMappings,
    relationshipType: relationship.relationshipType,
    onDelete: relationship.onDelete,
    onUpdate: relationship.onUpdate,
    enforceConstraint: relationship.enforceConstraint,
    lineStyle: relationship.lineStyle,
    vertices: relationship.vertices,
  })
}

export function ModelerWorkspace({ projectId, initialProject }: ModelerWorkspaceProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const canvasFrameRef = useRef<HTMLDivElement | null>(null)
  const tablesByIdRef = useRef<Map<string, TableModel>>(new Map())
  const tablesSnapshotRef = useRef<EditorTableSnapshot[]>(normalizeTables(initialProject.model.tables))
  const liveCoordinatesRef = useRef<LiveCoordinateState>({})
  const lastPersistedSnapshotRef = useRef<string | null>(null)
  const skipNextGraphSyncRef = useRef(false)
  const relationshipVerticesFlushRef = useRef<number | null>(null)
  const pendingRelationshipVerticesRef = useRef<Record<string, Array<{ x: number; y: number }>>>({})
  const isVertexDraggingRef = useRef(false)
  const graphRef = useRef<X6Graph | null>(null)
  const localStore = useMemo(() => createProjectLocalStore(), [])
  const createTableFormHandler = useMemo(() => new CreateTableFormHandler(), [])
  const configureRelationshipFormHandler = useMemo(() => new ConfigureRelationshipFormHandler(), [])
  const editAttributesFormHandler = useMemo(() => new EditAttributesFormHandler(), [])
  const editTableDetailsFormHandler = useMemo(() => new EditTableDetailsFormHandler(), [])
  const tableCollisionGuard = useMemo(() => new TableCollisionGuard(), [])
  const viewModeController = useMemo(() => new ViewModeController(), [])
  const [tables, setTables] = useState<EditorTableSnapshot[]>(() => normalizeTables(initialProject.model.tables))
  const [relationships, setRelationships] = useState<EditorRelationshipSnapshot[]>(() =>
    normalizeRelationships(initialProject.model.relationships ?? []),
  )
  const [viewMode, setViewMode] = useState<ViewMode>(initialProject.metadata?.viewMode ?? ViewMode.Logical)
  const [graphReady, setGraphReady] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null)
  const [isAddingTable, setIsAddingTable] = useState(false)
  const [isEditingAttributes, setIsEditingAttributes] = useState(false)
  const [isEditingTableDetails, setIsEditingTableDetails] = useState(false)
  const [isConfiguringRelationship, setIsConfiguringRelationship] = useState(false)
  const [tableDraft, setTableDraft] = useState<Omit<EditorTableSnapshot, 'id' | 'coordinate'> | null>(null)
  const [attributeDraftTable, setAttributeDraftTable] = useState<EditorTableSnapshot | null>(null)
  const [tableDetailsDraft, setTableDetailsDraft] = useState<EditorTableSnapshot | null>(null)
  const [relationshipDraft, setRelationshipDraft] = useState<EditorRelationshipSnapshot | null>(null)
  const [relationshipDrag, setRelationshipDrag] = useState<RelationshipDragState | null>(null)
  const [liveCoordinates, setLiveCoordinates] = useState<LiveCoordinateState>({})
  const [viewportTransform, setViewportTransform] = useState<ViewportTransform>({
    sx: 1,
    sy: 1,
    tx: 0,
    ty: 0,
  })
  const [ddl, setDdl] = useState<string | null>(null)
  const [ddlError, setDdlError] = useState<string | null>(null)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null
  const selectedRelationship = relationships.find((relationship) => relationship.id === selectedRelationshipId) ?? null

  const snapshot = useMemo<EditorProjectSnapshot>(
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
    tablesSnapshotRef.current = tables
  }, [tables])

  useEffect(() => {
    liveCoordinatesRef.current = liveCoordinates
  }, [liveCoordinates])

  useEffect(() => {
    const serializedSnapshot = JSON.stringify(snapshot)

    if (process.env.NODE_ENV === 'test') {
      return
    }

    if (lastPersistedSnapshotRef.current === null) {
      lastPersistedSnapshotRef.current = serializedSnapshot
      return
    }

    if (lastPersistedSnapshotRef.current === serializedSnapshot) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void persistSnapshot(snapshot)
    }, 450)

    return () => window.clearTimeout(timeoutId)
  }, [snapshot])

  useEffect(() => {
    return () => {
      if (relationshipVerticesFlushRef.current !== null) {
        window.clearTimeout(relationshipVerticesFlushRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!relationshipDrag) {
      return
    }

    function handleMouseMove(event: MouseEvent) {
      const frame = canvasFrameRef.current?.getBoundingClientRect()

      if (!frame) {
        return
      }

      setRelationshipDrag((currentDrag) =>
        currentDrag
          ? {
              ...currentDrag,
              currentX: event.clientX - frame.left,
              currentY: event.clientY - frame.top,
            }
          : currentDrag,
      )
    }

    function handleMouseUp() {
      setRelationshipDrag(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [relationshipDrag])

  useEffect(() => {
    if (!canvasRef.current || process.env.NODE_ENV === 'test') {
      return
    }

    let disposed = false
    let graphInstance: X6Graph | null = null
    let handleCanvasMouseDown: ((event: MouseEvent) => void) | null = null
    let handleCanvasMouseUp: (() => void) | null = null
    const controller = new WorkspaceController()

    void import('@antv/x6').then(({ Graph, Shape }) => {
      if (!canvasRef.current || disposed) {
        return
      }

      const flushPendingRelationshipVertices = () => {
        const pendingVertices = pendingRelationshipVerticesRef.current
        const pendingRelationshipIds = Object.keys(pendingVertices)

        if (pendingRelationshipIds.length === 0) {
          return
        }

        pendingRelationshipVerticesRef.current = {}

        setRelationships((currentRelationships) =>
          currentRelationships.map((relationship) =>
            pendingVertices[relationship.id]
              ? {
                  ...relationship,
                  vertices: pendingVertices[relationship.id],
                }
              : relationship,
          ),
        )
      }

      handleCanvasMouseDown = (event: MouseEvent) => {
        const target = event.target instanceof Element ? event.target : null

        if (target?.closest('.x6-edge-tool-vertex')) {
          isVertexDraggingRef.current = true
        }
      }

      handleCanvasMouseUp = () => {
        if (!isVertexDraggingRef.current) {
          return
        }

        isVertexDraggingRef.current = false

        if (relationshipVerticesFlushRef.current !== null) {
          window.clearTimeout(relationshipVerticesFlushRef.current)
          relationshipVerticesFlushRef.current = null
        }

        flushPendingRelationshipVertices()
      }

      canvasFrameRef.current?.addEventListener('mousedown', handleCanvasMouseDown, true)
      window.addEventListener('mouseup', handleCanvasMouseUp, true)

      registerTableNodeShape(Shape.HTML)

      graphInstance = new Graph({
        container: canvasRef.current,
        grid: {
          size: 1,
          visible: false,
        },
        panning: true,
        mousewheel: true,
        selecting: true,
        connecting: {
          snap: true,
          allowBlank: false,
          allowLoop: false,
          allowNode: false,
          allowEdge: false,
          allowMulti: false,
          highlight: true,
          connector: 'rounded',
          validateConnection(args: any) {
            const { sourceCell, targetCell, sourcePort, targetPort } = args
            return (
              !!sourceCell &&
              !!targetCell &&
              sourceCell.id !== targetCell.id &&
              sourcePort?.endsWith('__out') === true &&
              targetPort?.endsWith('__in') === true
            )
          },
        },
        background: {
          color: '#f7f9fb',
        },
      } as any)
      graphRef.current = graphInstance
      setGraphReady(true)
      const graphScale = graphInstance.scale()
      const graphTranslate = graphInstance.translate()
      setViewportTransform({
        sx: graphScale.sx,
        sy: graphScale.sy,
        tx: graphTranslate.tx,
        ty: graphTranslate.ty,
      })

      graphInstance.on?.('scale', ({ sx, sy }: { sx: number; sy: number }) => {
        setViewportTransform((currentTransform) => ({
          ...currentTransform,
          sx,
          sy,
        }))
      })

      graphInstance.on?.('translate', ({ tx, ty }: { tx: number; ty: number }) => {
        setViewportTransform((currentTransform) => ({
          ...currentTransform,
          tx,
          ty,
        }))
      })

      graphInstance.on?.('node:click', ({ node }: { node: { id: string } }) => {
        setSelectedRelationshipId(null)
        setSelectedTableId(node.id)
      })

      graphInstance.on?.('edge:click', ({ edge }: { edge: { id: string } }) => {
        setSelectedTableId(null)
        setSelectedRelationshipId(edge.id)
      })

      graphInstance.on?.('blank:click', () => {
        setSelectedRelationshipId(null)
        setSelectedTableId(null)
      })

      graphInstance.on?.(
        'edge:dblclick',
        ({
          edge,
          view,
          x,
          y,
          e,
        }: {
          edge: {
            insertVertex: (
              vertex: { x: number; y: number },
              index?: number,
              options?: { ui: boolean },
            ) => void
          }
          view: {
            getVertexIndex: (x: number, y: number) => number
          }
          x: number
          y: number
          e: MouseEvent & { target: EventTarget | null }
        },
      ) => {
        const target = e.target instanceof Element ? e.target : null

        if (target?.closest('.x6-edge-tool-vertex')) {
          return
        }

        edge.insertVertex({ x, y }, view.getVertexIndex(x, y), { ui: true })
      },
      )

      graphInstance.on?.(
        'edge:change:vertices',
        ({
          edge,
        }: {
          edge: {
            id: string
            getVertices: () => Array<{ x: number; y: number }> | null | undefined
          }
        },
      ) => {
        pendingRelationshipVerticesRef.current[edge.id] = edge.getVertices() ?? []

        if (isVertexDraggingRef.current) {
          return
        }

        if (relationshipVerticesFlushRef.current !== null) {
          window.clearTimeout(relationshipVerticesFlushRef.current)
        }

        relationshipVerticesFlushRef.current = window.setTimeout(() => {
          relationshipVerticesFlushRef.current = null
          flushPendingRelationshipVertices()
        }, 220)
      },
      )

      graphInstance.on?.('edge:mouseup', () => {
        if (relationshipVerticesFlushRef.current !== null) {
          window.clearTimeout(relationshipVerticesFlushRef.current)
          relationshipVerticesFlushRef.current = null
        }

        flushPendingRelationshipVertices()
        isVertexDraggingRef.current = false
      })

      graphInstance.on?.(
        'edge:connected',
        ({
          isNew,
          edge,
        }: {
          isNew: boolean
          edge: {
            remove: () => void
            getSourceCellId: () => string
            getTargetCellId: () => string
          }
        }) => {
          if (!isNew) {
            return
          }

          const sourceTableId = edge.getSourceCellId()
          const targetTableId = edge.getTargetCellId()
          const orderedTables = [
            tablesSnapshotRef.current.find((table) => table.id === sourceTableId),
            tablesSnapshotRef.current.find((table) => table.id === targetTableId),
          ].filter((table): table is EditorTableSnapshot => !!table)

          edge.remove()

          if (orderedTables.length < 2) {
            return
          }

          setSelectedTableId(null)
          setSelectedRelationshipId(null)
          setRelationshipDraft(configureRelationshipFormHandler.createDraftFromTables(orderedTables))
          setIsConfiguringRelationship(true)
        },
      )

      graphInstance.on?.('node:moving', ({ node }: { node: { id: string; position: () => { x: number; y: number } } }) => {
        const currentTableSnapshot = tablesSnapshotRef.current.find((currentTable) => currentTable.id === node.id)

        if (!currentTableSnapshot) {
          return
        }

        const requestedPosition = node.position()
        const movingMetrics = getTableCanvasMetrics(currentTableSnapshot)
        const resolvedPosition = tableCollisionGuard.resolve({
          moving: {
            x: requestedPosition.x,
            y: requestedPosition.y,
            ...movingMetrics,
          },
          occupied: tablesSnapshotRef.current
            .filter((currentTable) => currentTable.id !== node.id)
            .map((currentTable) => ({
              ...(liveCoordinatesRef.current[currentTable.id] ?? currentTable.coordinate),
              ...getTableCanvasMetrics(currentTable),
            })),
        })

        setLiveCoordinates((currentCoordinates) => ({
          ...currentCoordinates,
          [node.id]: resolvedPosition,
        }))
      })

      graphInstance.on?.('node:moved', ({ node }: { node: { id: string; position: () => { x: number; y: number } } }) => {
        const table = tablesByIdRef.current.get(node.id)
        const currentTableSnapshot = tablesSnapshotRef.current.find((currentTable) => currentTable.id === node.id)

        if (!table || !currentTableSnapshot) {
          return
        }

        const requestedPosition = node.position()
        const movingMetrics = getTableCanvasMetrics(currentTableSnapshot)
        const resolvedPosition = tableCollisionGuard.resolve({
          moving: {
            x: requestedPosition.x,
            y: requestedPosition.y,
            ...movingMetrics,
          },
          occupied: tablesSnapshotRef.current
            .filter((currentTable) => currentTable.id !== node.id)
            .map((currentTable) => ({
              ...currentTable.coordinate,
              ...getTableCanvasMetrics(currentTable),
            })),
        })

        controller.applyNodeMoved(table, resolvedPosition)
        skipNextGraphSyncRef.current =
          resolvedPosition.x === requestedPosition.x && resolvedPosition.y === requestedPosition.y
        setLiveCoordinates((currentCoordinates) => {
          const nextCoordinates = { ...currentCoordinates }
          delete nextCoordinates[node.id]
          return nextCoordinates
        })
        setTables((currentTables) =>
          currentTables.map((currentTable) =>
            currentTable.id === node.id
              ? {
                  ...currentTable,
                  coordinate: resolvedPosition,
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
      setViewportTransform({
        sx: 1,
        sy: 1,
        tx: 0,
        ty: 0,
      })
      isVertexDraggingRef.current = false
      if (handleCanvasMouseDown) {
        canvasFrameRef.current?.removeEventListener('mousedown', handleCanvasMouseDown, true)
      }
      if (handleCanvasMouseUp) {
        window.removeEventListener('mouseup', handleCanvasMouseUp, true)
      }
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
    const cells: Array<ReturnType<X6Graph['createNode']> | ReturnType<X6Graph['createEdge']>> = []

    for (const table of tables) {
      const domainTable = hydrateDomainTable({
        ...table,
        coordinate: table.coordinate ?? { x: 64, y: 64 },
      })
      domainTable.isSelected = table.id === selectedTableId

      cells.push(graphRef.current.createNode(createTableNodeDefinition(domainTable, viewMode)))
      nextTableMap.set(table.id, domainTable)
    }

    for (const relationship of relationships) {
      const domainRelationship = hydrateRelationship(relationship, nextTableMap)

      if (!domainRelationship) {
        continue
      }

      domainRelationship.isSelected = relationship.id === selectedRelationshipId

      cells.push(graphRef.current.createEdge(createRelationshipEdgeDefinition(domainRelationship)))
    }

    graphRef.current.resetCells(cells)
    tablesByIdRef.current = nextTableMap
  }, [graphReady, relationships, selectedRelationshipId, selectedTableId, tables, viewMode])

  async function persistSnapshot(nextSnapshot: EditorProjectSnapshot) {
    if (process.env.NODE_ENV === 'test') {
      return
    }

    lastPersistedSnapshotRef.current = JSON.stringify(nextSnapshot)
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

    if (!response.ok) {
      setDdl(null)
      setDdlError(body.error ?? 'Unable to generate DDL for the current model.')
      return
    }

    setDdlError(null)
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
    setSelectedRelationshipId((currentRelationshipId) =>
      nextRelationships.some((relationship) => relationship.id === currentRelationshipId) ? currentRelationshipId : null,
    )
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

    const nextRelationships = relationships.some((relationship) => relationship.id === relationshipDraft.id)
      ? relationships.map((relationship) =>
          relationship.id === relationshipDraft.id
            ? configureRelationshipFormHandler.applyPatch(relationship, relationshipDraft)
            : relationship,
        )
      : [...relationships, relationshipDraft]
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
    setSelectedTableId(null)
    setSelectedRelationshipId(relationshipDraft.id)
  }

  async function handleDeleteSelectedRelationship() {
    if (!selectedRelationship) {
      return
    }

    const nextRelationships = relationships.filter((relationship) => relationship.id !== selectedRelationship.id)
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
    setSelectedRelationshipId(nextRelationships.at(-1)?.id ?? null)
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
    setSelectedRelationshipId(null)
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

  async function handleSaveProject() {
    setIsSavingProject(true)
    setSaveFeedback(null)

    try {
      await persistSnapshot(snapshot)
      setSaveFeedback(`Projeto salvo em ${new Date().toLocaleTimeString()}.`)
    } catch {
      setSaveFeedback('Nao foi possivel salvar o projeto agora.')
    } finally {
      setIsSavingProject(false)
    }
  }

  const graphForHandles = graphRef.current
  const frameRectForHandles = canvasFrameRef.current?.getBoundingClientRect() ?? null

  return (
    <>
      <div className="modeler-layout">
        <ProjectSidebar
          project={initialProject.project}
          onSaveProject={() => void handleSaveProject()}
          isSavingProject={isSavingProject}
          saveFeedback={saveFeedback}
        />
        <section className="modeler-canvas-shell" aria-label="Modeler canvas workspace">
          <header className="modeler-canvas-toolbar">
            <div className="modeler-canvas-toolbar__heading">
              <h1 className="modeler-canvas-toolbar__title">Model Editor</h1>
              <p className="modeler-canvas-toolbar__meta">Project {projectId}</p>
            </div>
            <div className="modeler-toolbar" aria-label="Global actions">
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
              {!selectedRelationship && tables.length >= 2 ? (
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
                <button
                className="modeler-toolbar__switch"
                type="button"
                role="switch"
                aria-checked={viewMode === ViewMode.Physical}
                aria-label={viewMode === ViewMode.Physical ? 'Physical mode' : 'Logical mode'}
                onClick={() => void handleToggleViewMode()}
              >
                <span className="modeler-toolbar__switch-track" aria-hidden="true">
                  <span className="modeler-toolbar__switch-thumb" />
                </span>
                <span className="modeler-toolbar__switch-label">
                  {viewMode === ViewMode.Physical ? 'Physical mode' : 'Logical mode'}
                </span>
              </button>
              <button
                className="modeler-toolbar__button modeler-toolbar__button--ghost"
                type="button"
                onClick={() => void handleGenerateDDL()}
              >
                Generate DDL
              </button>
            </div>
          </header>
          <div ref={canvasFrameRef} className="modeler-canvas-frame">
            <div ref={canvasRef} data-testid="modeler-canvas" className="modeler-canvas" />
            <div className="relationship-handle-layer">
              {relationshipDrag ? (
                <svg className="relationship-drag-preview" preserveAspectRatio="none">
                  <line
                    x1={relationshipDrag.sourceX}
                    y1={relationshipDrag.sourceY}
                    x2={relationshipDrag.currentX}
                    y2={relationshipDrag.currentY}
                  />
                </svg>
              ) : null}
              {tables.map((table) => {
                const liveCoordinate = liveCoordinates[table.id]
                const tableWithCoordinate = liveCoordinate
                  ? {
                      ...table,
                      coordinate: liveCoordinate,
                    }
                  : table
                const sourcePoint = projectGraphPointToCanvas(
                  getRelationshipHandlePoint(tableWithCoordinate, 'out'),
                  graphForHandles,
                  frameRectForHandles,
                  viewportTransform,
                )
                const targetPoint = projectGraphPointToCanvas(
                  getRelationshipHandlePoint(tableWithCoordinate, 'in'),
                  graphForHandles,
                  frameRectForHandles,
                  viewportTransform,
                )
                const label = resolveSnapshotName(table, viewMode)
                const showSourceHandle =
                  selectedTableId === table.id || relationshipDrag?.sourceTableId === table.id
                const showTargetHandle =
                  !!relationshipDrag && relationshipDrag.sourceTableId !== table.id

                return (
                  <div key={`${table.id}-handles`}>
                    {showTargetHandle ? (
                      <button
                        type="button"
                        className="relationship-handle relationship-handle--in"
                        aria-label={`Create relationship to ${label}`}
                        style={{
                          left: `${targetPoint.x - 10}px`,
                          top: `${targetPoint.y - 10}px`,
                        }}
                        onMouseUp={(event) => {
                          event.preventDefault()
                          event.stopPropagation()

                          if (!relationshipDrag || relationshipDrag.sourceTableId === table.id) {
                            return
                          }

                          const orderedTables = [
                            tables.find((item) => item.id === relationshipDrag.sourceTableId),
                            table,
                          ].filter((item): item is EditorTableSnapshot => !!item)

                          if (orderedTables.length < 2) {
                            setRelationshipDrag(null)
                            return
                          }

                          setSelectedTableId(null)
                          setSelectedRelationshipId(null)
                          setRelationshipDraft(configureRelationshipFormHandler.createDraftFromTables(orderedTables))
                          setIsConfiguringRelationship(true)
                          setRelationshipDrag(null)
                        }}
                      />
                    ) : null}
                    {showSourceHandle ? (
                      <button
                        type="button"
                        className="relationship-handle relationship-handle--out"
                        aria-label={`Create relationship from ${label}`}
                        style={{
                          left: `${sourcePoint.x - 10}px`,
                          top: `${sourcePoint.y - 10}px`,
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setRelationshipDrag({
                            sourceTableId: table.id,
                            sourceX: sourcePoint.x,
                            sourceY: sourcePoint.y,
                            currentX: sourcePoint.x,
                            currentY: sourcePoint.y,
                          })
                        }}
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
            {process.env.NODE_ENV === 'test' && tables.length > 0 ? (
              <div className="schema-card-layer">
                {tables.map((table) => (
                  (() => {
                    const { primaryKeyRows, attributeRows } = getSnapshotTableSections(table, viewMode)

                    return (
                      <article
                        key={table.id}
                        className="schema-card"
                        data-selected={selectedTableId === table.id ? 'true' : 'false'}
                        onClick={() => {
                          setSelectedRelationshipId(null)
                          setSelectedTableId(table.id)
                        }}
                      >
                        <div className="schema-card__header">{resolveSnapshotName(table, viewMode)}</div>
                        <div className="schema-card__body">
                          {primaryKeyRows.length > 0 ? (
                            <section className="schema-card__section schema-card__section--keys">
                              <div className="schema-card__section-title">Primary keys</div>
                              <div className="schema-card__rows">
                                {primaryKeyRows.map((row) => (
                                  <div key={row.id} className="schema-card__row">
                                    <span className="schema-card__row-name">{row.name}</span>
                                    <span className="schema-card__row-type">{row.typeLabel}</span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          ) : null}
                          {attributeRows.length > 0 ? (
                            <section className="schema-card__section schema-card__section--columns">
                              <div className="schema-card__section-title">Attributes</div>
                              <div className="schema-card__rows">
                                {attributeRows.map((row) => (
                                  <div key={row.id} className="schema-card__row">
                                    <span className="schema-card__row-name">{row.name}</span>
                                    <span className="schema-card__row-type">{row.typeLabel}</span>
                                  </div>
                                ))}
                              </div>
                            </section>
                          ) : null}
                          {primaryKeyRows.length === 0 && attributeRows.length === 0 ? (
                            <div className="schema-card__empty">No columns yet</div>
                          ) : null}
                        </div>
                      </article>
                    )
                  })()
                ))}
              </div>
            ) : null}
            {process.env.NODE_ENV === 'test' && relationships.length > 0 ? (
              <div className="relationship-card-layer">
                {relationships.map((relationship) => (
                  <article
                    key={relationship.id}
                    className="relationship-card"
                    data-selected={selectedRelationshipId === relationship.id ? 'true' : 'false'}
                    onClick={() => {
                      setSelectedTableId(null)
                      setSelectedRelationshipId(relationship.id)
                    }}
                  >
                    <div className="relationship-card__header">
                      {resolveRelationshipSummary(relationship, tables, viewMode)}
                    </div>
                    <div className="relationship-card__body">
                      {resolveRelationshipTypeLabel(relationship.relationshipType)} · on delete {relationship.onDelete}
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
        <PropertyPanel
          badge={selectedRelationship ? 'RELATIONSHIP' : selectedTable ? 'TABLE' : 'INSPECTOR'}
          title={
            selectedRelationship ? 'Relationship Properties' : selectedTable ? 'Table Properties' : 'Selection'
          }
        >
          {selectedTable ? (
            <>
              <p className="modeler-panel__copy">
                {resolveSnapshotName(selectedTable, viewMode)} in schema {selectedTable.schema} with{' '}
                {selectedTable.attributes.length} attribute{selectedTable.attributes.length === 1 ? '' : 's'}.
              </p>
              <div className="modeler-toolbar">
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
                <button
                  className="modeler-toolbar__button modeler-toolbar__button--danger"
                  type="button"
                  onClick={() => void handleDeleteSelectedTable()}
                >
                  Delete table
                </button>
              </div>
            </>
          ) : null}
          {selectedRelationship ? (
            <>
              <p className="modeler-panel__copy">
                {resolveRelationshipSummary(selectedRelationship, tables, viewMode)} using{' '}
                {selectedRelationship.lineStyle ?? 'orthogonal'} routing.
              </p>
              <div className="modeler-toolbar">
                <button
                  className="modeler-toolbar__button modeler-toolbar__button--ghost"
                  type="button"
                  onClick={() => {
                    setRelationshipDraft(structuredClone(selectedRelationship))
                    setIsConfiguringRelationship(true)
                  }}
                >
                  Edit relationship
                </button>
                <button
                  className="modeler-toolbar__button modeler-toolbar__button--danger"
                  type="button"
                  onClick={() => void handleDeleteSelectedRelationship()}
                >
                  Delete relationship
                </button>
              </div>
            </>
          ) : null}
          {!selectedRelationship && !selectedTable ? (
            <p className="modeler-panel__copy">
              Select a table or relationship to edit its metadata, naming, and PostgreSQL details.
            </p>
          ) : null}
          {ddlError ? (
            <p className="modeler-panel__copy" role="alert">
              {ddlError}
            </p>
          ) : null}
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
          onChange={(updater) =>
            setAttributeDraftTable((currentDraft) => (currentDraft ? updater(currentDraft) : currentDraft))
          }
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
          title={selectedRelationship ? 'Edit Relationship' : 'Configure Relationship'}
          submitLabel={selectedRelationship ? 'Save Relationship' : 'Create Relationship'}
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
