import { useState, useRef, useEffect, useCallback, useMemo, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PanelRight, ChevronsUpDown, ChevronRight, ChevronDown, FileCode2, Minus, Plus } from 'lucide-react'
import { getProject } from '@/projects'
import { ClusterNodeCard } from '@/sections/project-graph/components/ClusterNodeCard'
import type { ClusterNode } from '@/sections/project-graph/components/clusterUtils'

type GraphNode = {
  id: string
  type: 'project' | 'page' | 'app' | 'table' | 'code' | 'analytics' | 'package'
  label: string
  meta: Record<string, unknown>
  source?: string
  alertCount?: number
}

type GraphEdge = {
  id: string
  source: string
  target: string
  type: string
}

type NodePosition = { x: number; y: number; w: number; h: number }
type LayoutMode = 'stratified' | 'crossSection'
type ScopeMode = 'project' | 'code'
type LaneTone = 'page' | 'app' | 'collection' | 'client' | 'server'
type LaneDef = { id: string; label: string; y: number; top: number; bottom: number; tone: LaneTone; dashed?: boolean }
type GuideDef = {
  id: string
  label: string
  x: number
  tone: 'page' | 'app' | 'collection' | 'code'
  side: 'left' | 'right' | 'center'
}
type RenderEdge = { source: string; target: string; relation: 'code' | 'data' | 'host' }
type InspectorSelection =
  | { kind: 'project' }
  | { kind: 'extensionType'; subGraph: string }
  | { kind: 'extensionInstance'; groupId: string }
  | { kind: 'file'; nodeId: string }

const MIN_CANVAS_W = 980
const MIN_CANVAS_H = 880
const CANVAS_PAD_X = 260
const CANVAS_PAD_Y = 220
const STRATIFIED_H = 122
const CROSS_GUIDE_SPAN_FROM_CENTER = 560

const EXTENSIONS_W = 180
const EXTENSIONS_H = 64
const CODE_W = 180
const CODE_H = 72
const COLLECTION_W = 180
const COLLECTION_H = 68
const APP_W = 180
const APP_H = 68
const PAGE_W = 150
const PAGE_H = 62
const CROSS_GUIDE_GAP = 86

const STRATIFIED_LABELS: Array<{ id: string; label: string; tone: LaneTone }> = [
  { id: 'pages-top', label: 'Pages', tone: 'page' },
  { id: 'apps-top', label: 'Apps', tone: 'app' },
  { id: 'collections-top', label: 'Collections', tone: 'collection' },
  { id: 'client', label: 'Client Code', tone: 'client' },
  { id: 'server', label: 'Server Code', tone: 'server' },
  { id: 'collections-bottom', label: 'Collections', tone: 'collection' },
  { id: 'apps-bottom', label: 'Apps', tone: 'app' },
  { id: 'pages-bottom', label: 'Pages', tone: 'page' },
]

const LANE_TONE_STYLES: Record<LaneTone, { label: string; sep: string }> = {
  page: {
    label: 'fill-indigo-500 dark:fill-indigo-400',
    sep: 'stroke-indigo-200 dark:stroke-indigo-800',
  },
  app: {
    label: 'fill-cyan-500 dark:fill-cyan-400',
    sep: 'stroke-cyan-200 dark:stroke-cyan-800',
  },
  collection: {
    label: 'fill-emerald-500 dark:fill-emerald-400',
    sep: 'stroke-emerald-200 dark:stroke-emerald-800',
  },
  client: {
    label: 'fill-violet-400 dark:fill-violet-300',
    sep: 'stroke-violet-200 dark:stroke-violet-800',
  },
  server: {
    label: 'fill-violet-600 dark:fill-violet-500',
    sep: 'stroke-violet-300 dark:stroke-violet-700',
  },
}

const GUIDE_TONE_STYLES: Record<GuideDef['tone'], { label: string; sep: string }> = {
  page: {
    label: 'fill-indigo-500 dark:fill-indigo-400',
    sep: 'stroke-indigo-200 dark:stroke-indigo-800',
  },
  app: {
    label: 'fill-cyan-500 dark:fill-cyan-400',
    sep: 'stroke-cyan-200 dark:stroke-cyan-800',
  },
  collection: {
    label: 'fill-emerald-500 dark:fill-emerald-400',
    sep: 'stroke-emerald-200 dark:stroke-emerald-800',
  },
  code: {
    label: 'fill-violet-500 dark:fill-violet-400',
    sep: 'stroke-violet-200 dark:stroke-violet-800',
  },
}

const NODE_CARD_TONES: Record<GraphNode['type'], { border: string; source: string; ring: string }> = {
  project: {
    border: 'border-l-slate-400 dark:border-l-slate-500',
    source: 'text-slate-400 dark:text-slate-500',
    ring: 'ring-slate-400',
  },
  page: {
    border: 'border-l-indigo-500',
    source: 'text-indigo-400/70 dark:text-indigo-500/60',
    ring: 'ring-indigo-500',
  },
  app: {
    border: 'border-l-cyan-500',
    source: 'text-cyan-400/70 dark:text-cyan-500/60',
    ring: 'ring-cyan-500',
  },
  table: {
    border: 'border-l-emerald-500',
    source: 'text-emerald-400/70 dark:text-emerald-500/60',
    ring: 'ring-emerald-500',
  },
  code: {
    border: 'border-l-violet-500',
    source: 'text-violet-400/70 dark:text-violet-500/60',
    ring: 'ring-violet-500',
  },
  analytics: {
    border: 'border-l-amber-500',
    source: 'text-amber-400/70 dark:text-amber-500/60',
    ring: 'ring-amber-500',
  },
  package: {
    border: 'border-l-fuchsia-500',
    source: 'text-fuchsia-400/70 dark:text-fuchsia-500/60',
    ring: 'ring-fuchsia-500',
  },
}

function getNodeKind(node: GraphNode | undefined): string {
  return String((node?.meta as { kind?: string } | undefined)?.kind ?? '')
}

function getNodeFileType(node: GraphNode | undefined): string {
  return String((node?.meta as { fileType?: string } | undefined)?.fileType ?? '')
}

function distributeX(count: number, spacing: number): number[] {
  if (count <= 0) return []
  const offset = ((count - 1) * spacing) / 2
  return Array.from({ length: count }, (_, index) => index * spacing - offset)
}

function edgeRelation(edgeType: string): RenderEdge['relation'] {
  if (edgeType === 'reads' || edgeType === 'manages') return 'data'
  if (edgeType === 'hosts') return 'host'
  return 'code'
}

export function CodeNavigationPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const project = projectId ? getProject(projectId) : undefined

  const [paneOpen, setPaneOpen] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [highlightChain, setHighlightChain] = useState(false)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('stratified')
  const [scopeMode, setScopeMode] = useState<ScopeMode>('code')
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set())
  const [collapsedSubgraphs, setCollapsedSubgraphs] = useState<Set<string>>(new Set())
  const [inspectorSelection, setInspectorSelection] = useState<InspectorSelection>({ kind: 'project' })
  const [lastEditNote, setLastEditNote] = useState('')
  const [canvasTransform, setCanvasTransform] = useState({ x: 40, y: 24, scale: 0.78 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({
    isDragging: false,
    hasDragged: false,
    startX: 0,
    startY: 0,
    startTX: 0,
    startTY: 0,
  })

  if (!project || !project.name.startsWith('Code:')) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Code navigation is only available for code projects.</p>
      </div>
    )
  }

  const data = project.data as {
    project: GraphNode
    nodes: GraphNode[]
    edges: GraphEdge[]
  }

  const nodeById = new Map<string, GraphNode>([data.project, ...data.nodes].map((node) => [node.id, node]))
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) ?? null : null
  const codeNodes = data.nodes.filter((node) => node.type === 'code')
  const nonCodeNodes = data.nodes.filter((node) => node.type !== 'code')
  const groupedNodes = codeNodes.filter((node) => getNodeKind(node) === 'scheduledJobGroup')
  const groupedIds = new Set(groupedNodes.map((node) => node.id))
  const memberNodes = codeNodes.filter((node) => {
    const kind = getNodeKind(node)
    return kind === 'builderFile' || kind === 'handlerFile'
  })
  const memberIds = new Set(memberNodes.map((node) => node.id))
  const extensionsRoot = codeNodes.find((node) => getNodeKind(node) === 'extensionsRoot') ?? null

  const membersByGroupId = useMemo(() => {
    const next = new Map<string, GraphNode[]>()
    groupedNodes.forEach((group) => next.set(group.id, []))
    data.edges.forEach((edge) => {
      if (edge.type !== 'contains') return
      if (!groupedIds.has(edge.source)) return
      const targetNode = nodeById.get(edge.target)
      if (!targetNode || !memberIds.has(targetNode.id)) return
      next.get(edge.source)?.push(targetNode)
    })
    next.forEach((members, groupId) => {
      members.sort((a, b) => {
        const kindA = getNodeKind(a)
        const kindB = getNodeKind(b)
        if (kindA === kindB) return a.label.localeCompare(b.label)
        if (kindA === 'builderFile') return -1
        if (kindB === 'builderFile') return 1
        return a.label.localeCompare(b.label)
      })
      next.set(groupId, members)
    })
    return next
  }, [data.edges, groupedIds, groupedNodes, memberIds, nodeById])
  const groupByMemberId = useMemo(() => {
    const next = new Map<string, string>()
    membersByGroupId.forEach((members, groupId) => {
      members.forEach((member) => next.set(member.id, groupId))
    })
    return next
  }, [membersByGroupId])
  const groupIdsBySubGraph = useMemo(() => {
    const next = new Map<string, string[]>()
    groupedNodes.forEach((group) => {
      const subGraph = String((group.meta as { subGraph?: string } | undefined)?.subGraph ?? '').trim() || 'UNGROUPED'
      if (!next.has(subGraph)) next.set(subGraph, [])
      next.get(subGraph)?.push(group.id)
    })
    next.forEach((ids, subGraph) => next.set(subGraph, ids.sort((a, b) => {
      const nodeA = nodeById.get(a)
      const nodeB = nodeById.get(b)
      return String(nodeA?.label ?? '').localeCompare(String(nodeB?.label ?? ''))
    })))
    return next
  }, [groupedNodes, nodeById])
  const subGraphByGroupId = useMemo(() => {
    const next = new Map<string, string>()
    groupedNodes.forEach((group) => {
      const subGraph = String((group.meta as { subGraph?: string } | undefined)?.subGraph ?? '').trim() || 'UNGROUPED'
      next.set(group.id, subGraph)
    })
    return next
  }, [groupedNodes])

  const visibleCodeNodeIds = useMemo(() => {
    const next: string[] = []
    if (extensionsRoot) next.push(extensionsRoot.id)
    groupedNodes.forEach((group) => {
      const groupMembers = membersByGroupId.get(group.id) ?? []
      if (expandedGroupIds.has(group.id) && groupMembers.length > 0) {
        next.push(...groupMembers.map((member) => member.id))
      } else {
        next.push(group.id)
      }
    })
    return next
  }, [extensionsRoot, groupedNodes, membersByGroupId, expandedGroupIds])

  const visibleNodeIds =
    scopeMode === 'code' ? visibleCodeNodeIds : [...visibleCodeNodeIds, ...nonCodeNodes.map((node) => node.id)]
  const visibleNodeSet = new Set(visibleNodeIds)

  const laneWeight = (id: string) => (id === 'client' || id === 'server' ? 3 : 1)
  const stratifiedTotalHeight = STRATIFIED_H * STRATIFIED_LABELS.reduce((sum, lane) => sum + laneWeight(lane.id), 0)
  const stratifiedTop = -stratifiedTotalHeight / 2
  const stratifiedBottom = stratifiedTotalHeight / 2
  const stratifiedTotalUnits = STRATIFIED_LABELS.reduce((sum, lane) => sum + laneWeight(lane.id), 0)
  const stratifiedUnitHeight = (stratifiedBottom - stratifiedTop) / stratifiedTotalUnits
  let stratifiedCursor = stratifiedTop
  const stratifiedLanes: LaneDef[] = STRATIFIED_LABELS.map((lane) => {
    const height = stratifiedUnitHeight * laneWeight(lane.id)
    const top = stratifiedCursor
    const bottom = top + height
    stratifiedCursor = bottom
    return {
      ...lane,
      y: top + height / 2,
      top,
      bottom,
      dashed: lane.id !== 'client' && lane.id !== 'server',
    }
  })

  const leftGuides = [
    { key: 'pages-left', label: 'Pages', tone: 'page' as const },
    { key: 'apps-left', label: 'Apps', tone: 'app' as const },
    { key: 'collections-left', label: 'Collections', tone: 'collection' as const },
  ]
  const rightGuides = [
    { key: 'collections-right', label: 'Collections', tone: 'collection' as const },
    { key: 'apps-right', label: 'Apps', tone: 'app' as const },
    { key: 'pages-right', label: 'Pages', tone: 'page' as const },
  ]
  const leftGuideStart = -CROSS_GUIDE_SPAN_FROM_CENTER
  const rightGuideStart = CROSS_GUIDE_SPAN_FROM_CENTER - CROSS_GUIDE_GAP * (rightGuides.length - 1)

  const crossSectionGuides: GuideDef[] =
    scopeMode === 'code'
      ? [{ id: 'guide-code', label: 'Code', x: 0, tone: 'code', side: 'center' }]
      : [
          ...leftGuides.map((guide, index) => ({
            id: `guide-${guide.key}`,
            label: guide.label,
            x: leftGuideStart + index * CROSS_GUIDE_GAP,
            tone: guide.tone,
            side: 'left' as const,
          })),
          { id: 'guide-code-center', label: 'Code', x: 0, tone: 'code', side: 'center' },
          ...rightGuides.map((guide, index) => ({
            id: `guide-${guide.key}`,
            label: guide.label,
            x: rightGuideStart + index * CROSS_GUIDE_GAP,
            tone: guide.tone,
            side: 'right' as const,
          })),
        ]

  const crossSectionLanes: LaneDef[] = [
    { id: 'client', label: 'Client Code', y: -70, top: -140, bottom: 0, tone: 'client' },
    { id: 'server', label: 'Server Code', y: 70, top: 0, bottom: 140, tone: 'server' },
  ]

  const stratifiedLaneById = new Map(stratifiedLanes.map((lane) => [lane.id, lane]))
  const crossSectionLaneById = new Map(crossSectionLanes.map((lane) => [lane.id, lane]))
  const laneCenterY = (laneId: string) => {
    const laneMap = layoutMode === 'stratified' ? stratifiedLaneById : crossSectionLaneById
    return laneMap.get(laneId)?.y ?? 0
  }
  const toNodePos = (x: number, centerY: number, w: number, h: number): NodePosition => ({
    x: x - w / 2,
    y: centerY - h / 2,
    w,
    h,
  })
  const seamY = (laneCenterY('client') + laneCenterY('server')) / 2
  const guideX = (id: string, fallback: number) => crossSectionGuides.find((guide) => guide.id === id)?.x ?? fallback

  const clientCodeNodeIds = visibleCodeNodeIds.filter((nodeId) => {
    const node = nodeById.get(nodeId)
    if (!node || node.type !== 'code') return false
    return node.id !== extensionsRoot?.id && getNodeFileType(node) !== 'backend'
  })
  const serverCodeNodeIds = visibleCodeNodeIds.filter((nodeId) => {
    const node = nodeById.get(nodeId)
    if (!node || node.type !== 'code') return false
    return getNodeFileType(node) === 'backend'
  })
  const tablesNodeIds = scopeMode === 'project' ? nonCodeNodes.filter((node) => node.type === 'table').map((node) => node.id) : []
  const appsNodeIds = scopeMode === 'project' ? nonCodeNodes.filter((node) => node.type === 'app').map((node) => node.id) : []
  const pagesNodeIds = scopeMode === 'project' ? nonCodeNodes.filter((node) => node.type === 'page').map((node) => node.id) : []

  const positions: Record<string, NodePosition> = {}
  const assignRow = (nodeIds: string[], y: number, w: number, h: number, spacing: number) => {
    const xs = distributeX(nodeIds.length, spacing)
    nodeIds.forEach((nodeId, index) => {
      positions[nodeId] = toNodePos(xs[index], y, w, h)
    })
  }

  if (extensionsRoot) {
    positions[extensionsRoot.id] = toNodePos(0, 0, EXTENSIONS_W, EXTENSIONS_H)
  }

  if (layoutMode === 'stratified') {
    assignRow(clientCodeNodeIds, laneCenterY('client') + 58, CODE_W, CODE_H, 226)
    assignRow(serverCodeNodeIds, laneCenterY('server') + 58, CODE_W, CODE_H, 226)
    assignRow(tablesNodeIds, laneCenterY('collections-bottom') + 4, COLLECTION_W, COLLECTION_H, 220)
    assignRow(appsNodeIds, laneCenterY('apps-bottom') + 4, APP_W, APP_H, 220)
    assignRow(pagesNodeIds, laneCenterY('pages-bottom') + 4, PAGE_W, PAGE_H, 170)
  } else {
    assignRow(clientCodeNodeIds, laneCenterY('client') + 2, CODE_W, CODE_H, 230)
    assignRow(serverCodeNodeIds, laneCenterY('server') + 2, CODE_W, CODE_H, 230)

    const collectionX = guideX('guide-collections-right', rightGuideStart)
    const appX = guideX('guide-apps-right', rightGuideStart + CROSS_GUIDE_GAP)
    const pageX = guideX('guide-pages-right', rightGuideStart + CROSS_GUIDE_GAP * 2)

    tablesNodeIds.forEach((nodeId, index) => {
      positions[nodeId] = toNodePos(collectionX, seamY - 30 + index * 84, COLLECTION_W, COLLECTION_H)
    })
    appsNodeIds.forEach((nodeId, index) => {
      positions[nodeId] = toNodePos(appX, seamY + 30 + index * 84, APP_W, APP_H)
    })
    pagesNodeIds.forEach((nodeId, index) => {
      const y = index % 2 === 0 ? laneCenterY('client') - 46 : laneCenterY('server') + 106
      positions[nodeId] = toNodePos(pageX + Math.floor(index / 2) * 160, y, PAGE_W, PAGE_H)
    })
  }

  const subgraphGroupEntries = useMemo(() => {
    return groupedNodes
      .map((group) => {
        const subGraphLabel = String((group.meta as { subGraph?: string } | undefined)?.subGraph ?? '').trim()
        if (!subGraphLabel) return null
        const groupMembers = membersByGroupId.get(group.id) ?? []
        const isExpanded = expandedGroupIds.has(group.id) && groupMembers.length > 0
        const renderedIds = isExpanded ? groupMembers.map((member) => member.id) : [group.id]
        const visibleRenderedIds = renderedIds.filter((id) => visibleNodeSet.has(id))
        if (visibleRenderedIds.length === 0) return null
        return {
          groupId: group.id,
          groupLabel: group.label,
          subGraphLabel,
          isExpanded,
          nodeIds: visibleRenderedIds,
        }
      })
      .filter(Boolean) as Array<{
      groupId: string
      groupLabel: string
      subGraphLabel: string
      isExpanded: boolean
      nodeIds: string[]
    }>
  }, [expandedGroupIds, groupedNodes, membersByGroupId, visibleNodeSet])

  const contentNodeIds = visibleNodeIds.filter((id) => !!positions[id])
  const nodeBounds =
    contentNodeIds.length > 0
      ? contentNodeIds.reduce(
          (acc, nodeId) => {
            const pos = positions[nodeId]
            return {
              minX: Math.min(acc.minX, pos.x),
              minY: Math.min(acc.minY, pos.y),
              maxX: Math.max(acc.maxX, pos.x + pos.w),
              maxY: Math.max(acc.maxY, pos.y + pos.h),
            }
          },
          {
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
          }
        )
      : { minX: -200, minY: -200, maxX: 200, maxY: 200 }

  const outerSubgraphBoxes = [...new Set(subgraphGroupEntries.map((entry) => entry.subGraphLabel))]
    .map((subGraphLabel) => {
      const subgraphEntries = subgraphGroupEntries.filter((entry) => entry.subGraphLabel === subGraphLabel)
      const nodeIds = [...new Set(subgraphEntries.flatMap((entry) => entry.nodeIds))]
      const boxNodes = nodeIds
        .map((id) => positions[id])
        .filter(Boolean) as NodePosition[]
      if (boxNodes.length === 0) return null
      const minX = Math.min(...boxNodes.map((pos) => pos.x))
      const maxX = Math.max(...boxNodes.map((pos) => pos.x + pos.w))
      const minY = Math.min(...boxNodes.map((pos) => pos.y))
      const maxY = Math.max(...boxNodes.map((pos) => pos.y + pos.h))
      const padX = 34
      const padTop = 40
      const padBottom = 22
      return {
        id: `subgraph-outer-${subGraphLabel.toLowerCase()}`,
        label: subGraphLabel,
        subGraph: subGraphLabel,
        x: minX - padX,
        y: minY - padTop,
        w: maxX - minX + padX * 2,
        h: maxY - minY + padTop + padBottom,
      }
    })
    .filter(Boolean) as Array<{ id: string; label: string; subGraph: string; x: number; y: number; w: number; h: number }>

  const extensionInnerBoxes = subgraphGroupEntries
    .filter((entry) => entry.isExpanded)
    .map((entry) => {
      const boxNodes = entry.nodeIds
        .map((id) => positions[id])
        .filter(Boolean) as NodePosition[]
      if (boxNodes.length === 0) return null
      const minX = Math.min(...boxNodes.map((pos) => pos.x))
      const maxX = Math.max(...boxNodes.map((pos) => pos.x + pos.w))
      const minY = Math.min(...boxNodes.map((pos) => pos.y))
      const maxY = Math.max(...boxNodes.map((pos) => pos.y + pos.h))
      const padX = 16
      const padTop = 26
      const padBottom = 14
      return {
        id: `subgraph-inner-${entry.groupId}`,
        label: entry.groupLabel,
        groupId: entry.groupId,
        subGraph: entry.subGraphLabel,
        x: minX - padX,
        y: minY - padTop,
        w: maxX - minX + padX * 2,
        h: maxY - minY + padTop + padBottom,
      }
    })
    .filter(Boolean) as Array<{
    id: string
    label: string
    groupId: string
    subGraph: string
    x: number
    y: number
    w: number
    h: number
  }>

  const subgraphBounds =
    outerSubgraphBoxes.length + extensionInnerBoxes.length > 0
      ? {
          minX: Math.min(...[...outerSubgraphBoxes, ...extensionInnerBoxes].map((box) => box.x)),
          minY: Math.min(...[...outerSubgraphBoxes, ...extensionInnerBoxes].map((box) => box.y)),
          maxX: Math.max(...[...outerSubgraphBoxes, ...extensionInnerBoxes].map((box) => box.x + box.w)),
          maxY: Math.max(...[...outerSubgraphBoxes, ...extensionInnerBoxes].map((box) => box.y + box.h)),
        }
      : nodeBounds

  const baseBounds = {
    minX: Math.min(nodeBounds.minX, subgraphBounds.minX),
    minY: Math.min(nodeBounds.minY, subgraphBounds.minY),
    maxX: Math.max(nodeBounds.maxX, subgraphBounds.maxX),
    maxY: Math.max(nodeBounds.maxY, subgraphBounds.maxY),
  }

  const h = (laneCenterY('server') - laneCenterY('client')) / 3
  const projectBandOffsets = [1.5, 2, 2.5].map((multiplier) => multiplier * h)
  const stratifiedGuideYs =
    scopeMode === 'project' && layoutMode === 'stratified'
      ? [0, ...projectBandOffsets, ...projectBandOffsets.map((value) => -value)]
      : [0]
  const crossGuideXs = layoutMode === 'crossSection' ? crossSectionGuides.map((guide) => guide.x) : [0]
  const crossLaneYs = layoutMode === 'crossSection' ? crossSectionLanes.map((lane) => lane.y) : []

  const boundsMinX = Math.min(baseBounds.minX, ...crossGuideXs) - CANVAS_PAD_X
  const boundsMaxX = Math.max(baseBounds.maxX, ...crossGuideXs) + CANVAS_PAD_X
  const boundsMinY = Math.min(baseBounds.minY, ...stratifiedGuideYs, ...crossLaneYs) - CANVAS_PAD_Y
  const boundsMaxY = Math.max(baseBounds.maxY, ...stratifiedGuideYs, ...crossLaneYs) + CANVAS_PAD_Y
  const canvasWidth = Math.max(MIN_CANVAS_W, Math.ceil(boundsMaxX - boundsMinX))
  const canvasHeight = Math.max(MIN_CANVAS_H, Math.ceil(boundsMaxY - boundsMinY))
  const originX = -boundsMinX
  const originY = -boundsMinY
  const toCanvasX = (x: number) => x + originX
  const toCanvasY = (y: number) => y + originY

  const visibleEdges = useMemo(() => {
    const next: RenderEdge[] = []

    data.edges.forEach((edge) => {
      if (edge.type === 'contains') return
      if (!visibleNodeSet.has(edge.source) || !visibleNodeSet.has(edge.target)) return
      if (scopeMode === 'code') {
        const sourceNode = nodeById.get(edge.source)
        const targetNode = nodeById.get(edge.target)
        if (sourceNode?.type !== 'code' || targetNode?.type !== 'code') return
      }
      next.push({
        source: edge.source,
        target: edge.target,
        relation: edgeRelation(edge.type),
      })
    })

    expandedGroupIds.forEach((groupId) => {
      const groupMembers = membersByGroupId.get(groupId) ?? []
      const builder = groupMembers.find((node) => getNodeKind(node) === 'builderFile')
      const handler = groupMembers.find((node) => getNodeKind(node) === 'handlerFile')
      if (!builder || !handler) return
      if (!visibleNodeSet.has(builder.id) || !visibleNodeSet.has(handler.id)) return
      const alreadyExists = next.some(
        (edge) =>
          (edge.source === builder.id && edge.target === handler.id) ||
          (edge.source === handler.id && edge.target === builder.id)
      )
      if (!alreadyExists) {
        next.push({ source: builder.id, target: handler.id, relation: 'code' })
      }
    })

    return next
  }, [data.edges, expandedGroupIds, membersByGroupId, nodeById, scopeMode, visibleNodeSet])

  const highlightedNodeIds = useMemo(() => {
    if (!highlightChain) return new Set<string>()
    const next = new Set<string>()
    visibleEdges.forEach((edge) => {
      const sourceNode = nodeById.get(edge.source)
      const targetNode = nodeById.get(edge.target)
      if (!sourceNode || !targetNode) return
      if (sourceNode.type !== 'code') next.add(sourceNode.id)
      if (targetNode.type !== 'code') next.add(targetNode.id)
    })
    return next
  }, [highlightChain, visibleEdges, nodeById])

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    setCanvasTransform((prev) => {
      const next = prev.scale * (event.deltaY > 0 ? 0.92 : 1.08)
      return { ...prev, scale: Math.max(0.6, Math.min(1.6, Number(next.toFixed(2)))) }
    })
  }

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('[data-node]')) return
      dragState.current = {
        isDragging: true,
        hasDragged: false,
        startX: event.clientX,
        startY: event.clientY,
        startTX: canvasTransform.x,
        startTY: canvasTransform.y,
      }
    },
    [canvasTransform.x, canvasTransform.y]
  )

  useEffect(() => {
    const DRAG_THRESHOLD = 4
    const onMove = (event: MouseEvent) => {
      if (!dragState.current.isDragging) return
      const dx = event.clientX - dragState.current.startX
      const dy = event.clientY - dragState.current.startY
      if (!dragState.current.hasDragged && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        dragState.current.hasDragged = true
      }
      setCanvasTransform((prev) => ({
        ...prev,
        x: dragState.current.startTX + dx,
        y: dragState.current.startTY + dy,
      }))
    }
    const onUp = () => {
      dragState.current.isDragging = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect()
    const scaleX = (cw - 80) / canvasWidth
    const scaleY = (ch - 80) / canvasHeight
    const scale = Math.min(scaleX, scaleY, 0.88)
    const x = Math.max(24, (cw - canvasWidth * scale) / 2)
    const y = Math.max(24, (ch - canvasHeight * scale) / 2)
    setCanvasTransform({ x, y, scale })
  }, [canvasWidth, canvasHeight])

  const edgePath = (src: NodePosition, tgt: NodePosition): string => {
    const srcX = src.x + src.w / 2
    const tgtX = tgt.x + tgt.w / 2
    if (src.y < tgt.y) {
      const srcY = src.y + src.h
      const tgtY = tgt.y
      const cp = Math.abs(tgtY - srcY) * 0.42
      return `M ${srcX} ${srcY} C ${srcX} ${srcY + cp} ${tgtX} ${tgtY - cp} ${tgtX} ${tgtY}`
    }
    if (src.y > tgt.y) {
      const srcY = src.y
      const tgtY = tgt.y + tgt.h
      const cp = Math.abs(srcY - tgtY) * 0.42
      return `M ${srcX} ${srcY} C ${srcX} ${srcY - cp} ${tgtX} ${tgtY + cp} ${tgtX} ${tgtY}`
    }
    const srcY = src.y + src.h / 2
    const tgtY = tgt.y + tgt.h / 2
    const arc = 40
    return `M ${srcX} ${srcY} C ${srcX} ${srcY - arc} ${tgtX} ${tgtY - arc} ${tgtX} ${tgtY}`
  }

  const selectedTypeSubGraph =
    inspectorSelection.kind === 'extensionType' ? inspectorSelection.subGraph : null
  const selectedInstanceId =
    inspectorSelection.kind === 'extensionInstance'
      ? inspectorSelection.groupId
      : inspectorSelection.kind === 'file'
        ? groupByMemberId.get(inspectorSelection.nodeId) ?? null
        : null
  const selectedInstanceNode = selectedInstanceId ? nodeById.get(selectedInstanceId) ?? null : null
  const selectedInstanceMembers = selectedInstanceId ? membersByGroupId.get(selectedInstanceId) ?? [] : []
  const selectedFileNode =
    inspectorSelection.kind === 'file' ? nodeById.get(inspectorSelection.nodeId) ?? null : null
  const selectedGroupCluster: ClusterNode | null =
    selectedInstanceNode && selectedInstanceId
      ? {
          id: selectedInstanceId,
          label: selectedInstanceNode.label,
          memberCount: selectedInstanceMembers.length,
          memberLabel: 'files',
          alertCount: selectedInstanceNode.alertCount ?? 0,
          memberIds: selectedInstanceMembers.map((member) => member.id),
          rootPageId: selectedInstanceId,
        }
      : null
  const inspectorTitle = (() => {
    if (inspectorSelection.kind === 'project') return project.name
    if (inspectorSelection.kind === 'extensionType') return inspectorSelection.subGraph
    if (inspectorSelection.kind === 'extensionInstance') return selectedInstanceNode?.label ?? 'Extension instance'
    return selectedFileNode?.label ?? selectedNode?.label ?? 'File'
  })()
  const inspectorLevelLabel = (() => {
    if (inspectorSelection.kind === 'project') return 'Project'
    if (inspectorSelection.kind === 'extensionType') return 'Extension type'
    if (inspectorSelection.kind === 'extensionInstance') return 'Extension instance'
    return 'File'
  })()
  const selectedSeedIds = useMemo(() => {
    if (inspectorSelection.kind === 'project') return new Set(visibleNodeIds)
    if (inspectorSelection.kind === 'extensionType') {
      const typeGroupIds = groupIdsBySubGraph.get(inspectorSelection.subGraph) ?? []
      const next = new Set<string>()
      typeGroupIds.forEach((groupId) => {
        next.add(groupId)
        ;(membersByGroupId.get(groupId) ?? []).forEach((member) => next.add(member.id))
      })
      return next
    }
    if (inspectorSelection.kind === 'extensionInstance') {
      const next = new Set<string>([inspectorSelection.groupId])
      ;(membersByGroupId.get(inspectorSelection.groupId) ?? []).forEach((member) => next.add(member.id))
      return next
    }
    return new Set<string>([inspectorSelection.nodeId])
  }, [groupIdsBySubGraph, inspectorSelection, membersByGroupId, visibleNodeIds])
  const connectedEntities = useMemo(() => {
    const connected = new Map<string, GraphNode>()
    data.edges.forEach((edge) => {
      if (edge.type === 'contains') return
      const sourceIn = selectedSeedIds.has(edge.source)
      const targetIn = selectedSeedIds.has(edge.target)
      if (!sourceIn && !targetIn) return
      if (sourceIn && !targetIn) {
        const node = nodeById.get(edge.target)
        if (node) connected.set(node.id, node)
      }
      if (targetIn && !sourceIn) {
        const node = nodeById.get(edge.source)
        if (node) connected.set(node.id, node)
      }
    })
    return [...connected.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [data.edges, nodeById, selectedSeedIds])
  const connectedEntitiesByType = useMemo(() => {
    const grouped = new Map<GraphNode['type'], GraphNode[]>()
    connectedEntities.forEach((node) => {
      if (!grouped.has(node.type)) grouped.set(node.type, [])
      grouped.get(node.type)?.push(node)
    })
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [connectedEntities])
  const selectedTypeGroupIds = selectedTypeSubGraph ? groupIdsBySubGraph.get(selectedTypeSubGraph) ?? [] : []
  const selectedMetadataNode =
    inspectorSelection.kind === 'file'
      ? selectedFileNode
      : inspectorSelection.kind === 'extensionInstance'
        ? selectedInstanceNode
        : null
  const extensionHierarchy = useMemo(() => {
    const bySubGraph = new Map<string, GraphNode[]>()
    groupedNodes.forEach((ext) => {
      const subGraph = String((ext.meta as { subGraph?: string } | undefined)?.subGraph ?? '').trim() || 'UNGROUPED'
      if (!bySubGraph.has(subGraph)) bySubGraph.set(subGraph, [])
      bySubGraph.get(subGraph)?.push(ext)
    })
    return [...bySubGraph.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subGraph, extensions]) => ({
        subGraph,
        extensions: [...extensions].sort((a, b) => a.label.localeCompare(b.label)),
      }))
  }, [groupedNodes])

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{project.name}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">code navigation</span>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="inline-flex rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setScopeMode('project')}
            className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              scopeMode === 'project'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
            }`}
          >
            Project
          </button>
          <button
            onClick={() => setScopeMode('code')}
            className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              scopeMode === 'code'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
            }`}
          >
            Code
          </button>
        </div>
        <div className="inline-flex rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setLayoutMode('stratified')}
            className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              layoutMode === 'stratified'
                ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
            }`}
          >
            Stratified
          </button>
          <button
            onClick={() => setLayoutMode('crossSection')}
            className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              layoutMode === 'crossSection'
                ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400'
            }`}
          >
            Cross section
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setPaneOpen((value) => !value)}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
            paneOpen
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={paneOpen ? 'Hide inspector' : 'Show inspector'}
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 p-0.5">
          <button
            onClick={() =>
              setCanvasTransform((prev) => ({
                ...prev,
                scale: Math.max(0.6, Number((prev.scale - 0.1).toFixed(2))),
              }))
            }
            className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCanvasTransform((prev) => ({ ...prev, scale: 1 }))}
            className="px-2 h-6 text-[10px] font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Reset zoom"
          >
            {Math.round(canvasTransform.scale * 100)}%
          </button>
          <button
            onClick={() =>
              setCanvasTransform((prev) => ({
                ...prev,
                scale: Math.min(1.6, Number((prev.scale + 0.1).toFixed(2))),
              }))
            }
            className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          style={{ cursor: 'grab' }}
          onWheel={handleCanvasWheel}
          onMouseDown={handleCanvasMouseDown}
          onClick={(event) => {
            if (dragState.current.hasDragged) return
            if (!(event.target as HTMLElement).closest('[data-node]')) {
              setSelectedNodeId(null)
              setInspectorSelection({ kind: 'project' })
            }
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(100,116,139,0.3) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div
            style={{
              position: 'absolute',
              transformOrigin: '0 0',
              transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {layoutMode === 'stratified' && (
                <>
                  <line
                    x1={0}
                    y1={toCanvasY(0)}
                    x2={canvasWidth}
                    y2={toCanvasY(0)}
                    className="stroke-slate-400 dark:stroke-slate-600"
                    strokeWidth={1.8}
                    opacity={0.95}
                  />

                  {scopeMode === 'project' &&
                    projectBandOffsets.flatMap((offset) => [offset, -offset]).map((offset) => (
                      <line
                        key={`project-band-${offset}`}
                        x1={0}
                        y1={toCanvasY(offset)}
                        x2={canvasWidth}
                        y2={toCanvasY(offset)}
                        className="stroke-slate-300 dark:stroke-slate-700"
                        strokeWidth={1.2}
                        strokeDasharray="5 4"
                        opacity={0.9}
                      />
                    ))}

                  {([
                    { label: 'CLIENT CODE', y: -h * 0.55, tone: 'client' as const },
                    { label: 'SERVER CODE', y: h * 0.55, tone: 'server' as const },
                  ]).map((entry) => {
                    const tone = LANE_TONE_STYLES[entry.tone]
                    const y = toCanvasY(entry.y)
                    return (
                      <g key={`split-label-${entry.label}`}>
                        <text
                          x={14}
                          y={y}
                          textAnchor="start"
                          dominantBaseline="middle"
                          className={tone.label}
                          style={{
                            fontSize: '11px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {entry.label}
                        </text>
                        <text
                          x={canvasWidth - 14}
                          y={y}
                          textAnchor="end"
                          dominantBaseline="middle"
                          className={tone.label}
                          style={{
                            fontSize: '11px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {entry.label}
                        </text>
                      </g>
                    )
                  })}
                </>
              )}

              {layoutMode === 'crossSection' &&
                crossSectionLanes.map((lane) => {
                  const tone = LANE_TONE_STYLES[lane.tone]
                  return (
                    <g key={`cross-lane-${lane.id}`}>
                      <line
                        x1={0}
                        y1={toCanvasY(lane.y)}
                        x2={canvasWidth}
                        y2={toCanvasY(lane.y)}
                        className={tone.sep}
                        strokeWidth={1.5}
                        opacity={1}
                      />
                      <text
                        x={14}
                        y={toCanvasY(lane.y) - 11}
                        textAnchor="start"
                        dominantBaseline="middle"
                        className={tone.label}
                        style={{
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {lane.label}
                      </text>
                    </g>
                  )
                })}

              {layoutMode === 'crossSection' &&
                crossSectionGuides.map((guide) => {
                  const tone = GUIDE_TONE_STYLES[guide.tone]
                  const worldLabelX =
                    guide.side === 'right' ? guide.x - 8 : guide.side === 'left' ? guide.x + 8 : guide.x
                  const labelX = toCanvasX(worldLabelX)
                  const labelAnchor = guide.side === 'right' ? 'end' : guide.side === 'left' ? 'start' : 'middle'
                  return (
                    <g key={`guide-${guide.id}`}>
                      <line
                        x1={toCanvasX(guide.x)}
                        y1={0}
                        x2={toCanvasX(guide.x)}
                        y2={canvasHeight}
                        className={tone.sep}
                        strokeWidth={1.5}
                        opacity={1}
                      />
                      <text
                        x={labelX}
                        y={18}
                        textAnchor={labelAnchor}
                        dominantBaseline="middle"
                        className={tone.label}
                        style={{
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {guide.label}
                      </text>
                      <text
                        x={labelX}
                        y={canvasHeight - 18}
                        textAnchor={labelAnchor}
                        dominantBaseline="middle"
                        className={tone.label}
                        style={{
                          fontSize: '11px',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {guide.label}
                      </text>
                    </g>
                  )
                })}

              {layoutMode === 'crossSection' && (
                <line
                  x1={toCanvasX(-220)}
                  y1={toCanvasY(seamY)}
                  x2={toCanvasX(220)}
                  y2={toCanvasY(seamY)}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth={1.6}
                  opacity={0.95}
                />
              )}

              {outerSubgraphBoxes.map((box) => {
                const isSelected =
                  (inspectorSelection.kind === 'extensionType' && inspectorSelection.subGraph === box.subGraph) ||
                  (inspectorSelection.kind === 'extensionInstance' &&
                    subGraphByGroupId.get(inspectorSelection.groupId) === box.subGraph) ||
                  (inspectorSelection.kind === 'file' &&
                    !!selectedInstanceId &&
                    subGraphByGroupId.get(selectedInstanceId) === box.subGraph)
                return (
                <g key={box.id}>
                  <rect
                    x={toCanvasX(box.x)}
                    y={toCanvasY(box.y)}
                    width={box.w}
                    height={box.h}
                    rx={14}
                    ry={14}
                    className={`fill-rose-100/60 dark:fill-rose-900/25 ${
                      isSelected ? 'stroke-indigo-500 dark:stroke-indigo-300' : 'stroke-rose-300 dark:stroke-rose-700'
                    }`}
                    strokeWidth={isSelected ? 2.2 : 1.6}
                  />
                  <text
                    x={toCanvasX(box.x) + 14}
                    y={toCanvasY(box.y) + 22}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="fill-rose-900 dark:fill-rose-200"
                    style={{
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {box.label}
                  </text>
                </g>
              )})}

              {extensionInnerBoxes.map((box) => {
                const isSelected =
                  (inspectorSelection.kind === 'extensionInstance' && inspectorSelection.groupId === box.groupId) ||
                  (inspectorSelection.kind === 'file' && selectedInstanceId === box.groupId)
                return (
                <g key={box.id}>
                  <rect
                    x={toCanvasX(box.x)}
                    y={toCanvasY(box.y)}
                    width={box.w}
                    height={box.h}
                    rx={12}
                    ry={12}
                    className={`fill-rose-200/65 dark:fill-rose-800/35 ${
                      isSelected ? 'stroke-indigo-500 dark:stroke-indigo-300' : 'stroke-rose-400 dark:stroke-rose-600'
                    }`}
                    strokeWidth={isSelected ? 1.9 : 1.4}
                  />
                  <text
                    x={toCanvasX(box.x) + 12}
                    y={toCanvasY(box.y) + 18}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="fill-rose-900 dark:fill-rose-100"
                    style={{
                      fontSize: '10px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {box.label}
                  </text>
                </g>
              )})}

              {visibleEdges.map((edge, idx) => {
                const src = positions[edge.source]
                const tgt = positions[edge.target]
                if (!src || !tgt) return null
                const srcCanvas = { ...src, x: toCanvasX(src.x), y: toCanvasY(src.y) }
                const tgtCanvas = { ...tgt, x: toCanvasX(tgt.x), y: toCanvasY(tgt.y) }
                const edgeClass =
                  edge.relation === 'code'
                    ? 'stroke-violet-300 dark:stroke-violet-700'
                    : edge.relation === 'data'
                      ? 'stroke-emerald-300 dark:stroke-emerald-700'
                      : 'stroke-indigo-300 dark:stroke-indigo-700'
                return (
                  <path
                    key={`${edge.source}-${edge.target}-${idx}`}
                    d={edgePath(srcCanvas, tgtCanvas)}
                    fill="none"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    className={edgeClass}
                  />
                )
              })}
            </svg>

            {outerSubgraphBoxes.map((box) => (
              <button
                key={`${box.id}:hit`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedNodeId(null)
                  setInspectorSelection({ kind: 'extensionType', subGraph: box.subGraph })
                }}
                className="absolute rounded-[14px] border border-transparent hover:border-indigo-300/80 dark:hover:border-indigo-500/80 z-0"
                style={{
                  left: toCanvasX(box.x),
                  top: toCanvasY(box.y),
                  width: box.w,
                  height: box.h,
                }}
                title={`Select ${box.subGraph}`}
              />
            ))}

            {extensionInnerBoxes.map((box) => (
              <button
                key={`${box.id}:hit`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedNodeId(null)
                  setInspectorSelection({ kind: 'extensionInstance', groupId: box.groupId })
                }}
                className="absolute rounded-[12px] border border-transparent hover:border-indigo-300/80 dark:hover:border-indigo-500/80 z-10"
                style={{
                  left: toCanvasX(box.x),
                  top: toCanvasY(box.y),
                  width: box.w,
                  height: box.h,
                }}
                title={`Select ${box.label}`}
              />
            ))}

            {visibleNodeIds.map((nodeId) => {
              const node = nodeById.get(nodeId)
              if (!node) return null
              const pos = positions[node.id]
              if (!pos) return null

              const isSelected = selectedNodeId === node.id
              const isGhost = getNodeKind(node) === 'extensionsRoot'
              const tone = NODE_CARD_TONES[node.type]
              const style: CSSProperties = {
                left: toCanvasX(pos.x),
                top: toCanvasY(pos.y),
                width: pos.w,
                height: pos.h,
              }

              const groupNode = groupedIds.has(node.id) ? node : null
              const groupMembers = groupNode ? membersByGroupId.get(groupNode.id) ?? [] : []
              const isCollapsedGroup = !!groupNode && !expandedGroupIds.has(groupNode.id) && groupMembers.length > 0

              if (isCollapsedGroup) {
                const cluster: ClusterNode = {
                  id: groupNode.id,
                  label: groupNode.label,
                  memberCount: groupMembers.length,
                  memberLabel: 'files',
                  alertCount: groupNode.alertCount ?? 0,
                  memberIds: groupMembers.map((member) => member.id),
                  rootPageId: groupNode.id,
                }

                return (
                  <ClusterNodeCard
                    key={node.id}
                    cluster={cluster}
                    x={toCanvasX(pos.x)}
                    y={toCanvasY(pos.y)}
                    isExpanded={false}
                    isSelected={isSelected}
                    isHighlighted={false}
                    isDimmed={false}
                    isSearchMatch={false}
                    onClick={() => {
                      setSelectedNodeId(node.id)
                      setInspectorSelection({ kind: 'extensionInstance', groupId: node.id })
                    }}
                    onToggleExpand={(event) => {
                      event.stopPropagation()
                      setExpandedGroupIds((prev) => new Set(prev).add(groupNode.id))
                      setInspectorSelection({ kind: 'extensionInstance', groupId: groupNode.id })
                    }}
                    showToggle
                    toggleLabel="Unpack"
                  />
                )
              }

              return (
                <button
                  key={node.id}
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedNodeId(node.id)
                    const nodeKind = getNodeKind(node)
                    if (nodeKind === 'scheduledJobGroup') {
                      setInspectorSelection({ kind: 'extensionInstance', groupId: node.id })
                    } else {
                      setInspectorSelection({ kind: 'file', nodeId: node.id })
                    }
                  }}
                  className={`absolute z-30 border border-l-4 rounded-md shadow-sm hover:shadow-md px-3 text-left transition-all ${
                    isGhost
                      ? 'border-slate-300 dark:border-slate-700 border-l-slate-300 dark:border-l-slate-600 bg-slate-100/75 dark:bg-slate-800/55'
                      : `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 ${tone.border}`
                  } ${isSelected ? `ring-2 ${tone.ring} ring-offset-1 ring-offset-white dark:ring-offset-slate-950` : ''} ${
                    highlightChain && highlightedNodeIds.has(node.id) ? 'ring-2 ring-indigo-400' : ''
                  }`}
                  style={{ ...style, opacity: isGhost ? 0.58 : 1 }}
                >
                  <div className="text-[11px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
                    {node.label}
                  </div>
                  <div
                    className={`text-[9px] mt-1 uppercase tracking-widest font-semibold ${
                      isGhost ? 'text-slate-400/80 dark:text-slate-500/80' : tone.source
                    }`}
                  >
                    {node.type === 'code'
                      ? getNodeFileType(node) === 'backend'
                        ? 'server code'
                        : 'client code'
                      : node.type}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {paneOpen && (
          <aside className="w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Inspector</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{inspectorTitle}</div>
              <div className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">{inspectorLevelLabel}</div>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Extensions in this project
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {extensionHierarchy.map((entry) => (
                    <li key={entry.subGraph} className="text-[12px] text-slate-700 dark:text-slate-300">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedSubgraphs((prev) => {
                              const next = new Set(prev)
                              if (next.has(entry.subGraph)) next.delete(entry.subGraph)
                              else next.add(entry.subGraph)
                              return next
                            })
                          }
                          className="inline-flex items-center"
                          title={collapsedSubgraphs.has(entry.subGraph) ? 'Expand group' : 'Collapse group'}
                        >
                          {collapsedSubgraphs.has(entry.subGraph) ? (
                            <ChevronRight className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNodeId(null)
                            setInspectorSelection({ kind: 'extensionType', subGraph: entry.subGraph })
                          }}
                          className={`font-semibold hover:text-slate-900 dark:hover:text-slate-100 ${
                            inspectorSelection.kind === 'extensionType' && inspectorSelection.subGraph === entry.subGraph
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {entry.subGraph}
                        </button>
                      </div>
                      {!collapsedSubgraphs.has(entry.subGraph) && (
                        <ul className="list-disc pl-5 mt-1 space-y-0.5">
                          {entry.extensions.map((ext) => (
                            <li key={ext.id} className="text-[12px] text-slate-600 dark:text-slate-400">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedNodeId(ext.id)
                                  setInspectorSelection({ kind: 'extensionInstance', groupId: ext.id })
                                }}
                                className={`hover:text-slate-900 dark:hover:text-slate-100 ${
                                  inspectorSelection.kind === 'extensionInstance' && inspectorSelection.groupId === ext.id
                                    ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
                                    : ''
                                }`}
                              >
                                {ext.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Collapse behavior</div>
                    {inspectorSelection.kind === 'project' && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setExpandedGroupIds(new Set())
                            setLastEditNote('Collapsed all extension instances.')
                          }}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Collapse all
                        </button>
                        <button
                          onClick={() => {
                            setExpandedGroupIds(new Set(groupedNodes.map((group) => group.id)))
                            setLastEditNote('Expanded all extension instances.')
                          }}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Expand all
                        </button>
                      </div>
                    )}
                    {inspectorSelection.kind === 'extensionType' && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setExpandedGroupIds((prev) => {
                              const next = new Set(prev)
                              selectedTypeGroupIds.forEach((id) => next.delete(id))
                              return next
                            })
                            setLastEditNote(`Collapsed all instances in ${inspectorSelection.subGraph}.`)
                          }}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Collapse type
                        </button>
                        <button
                          onClick={() => {
                            setExpandedGroupIds((prev) => {
                              const next = new Set(prev)
                              selectedTypeGroupIds.forEach((id) => next.add(id))
                              return next
                            })
                            setLastEditNote(`Expanded all instances in ${inspectorSelection.subGraph}.`)
                          }}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Expand type
                        </button>
                      </div>
                    )}
                    {inspectorSelection.kind === 'extensionInstance' && selectedGroupCluster && (
                      <button
                        onClick={() => {
                          const groupId = inspectorSelection.groupId
                          setExpandedGroupIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(groupId)) next.delete(groupId)
                            else next.add(groupId)
                            return next
                          })
                          setLastEditNote(
                            expandedGroupIds.has(groupId)
                              ? `Collapsed ${selectedGroupCluster.label}.`
                              : `Expanded ${selectedGroupCluster.label}.`
                          )
                        }}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronsUpDown className="w-3 h-3" />
                        {expandedGroupIds.has(inspectorSelection.groupId) ? 'Collapse instance' : 'Expand instance'}
                      </button>
                    )}
                    {inspectorSelection.kind === 'file' && selectedInstanceId && (
                      <button
                        onClick={() => {
                          const groupId = selectedInstanceId
                          setExpandedGroupIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(groupId)) next.delete(groupId)
                            else next.add(groupId)
                            return next
                          })
                          const parentLabel = nodeById.get(groupId)?.label ?? 'parent instance'
                          setLastEditNote(
                            expandedGroupIds.has(groupId)
                              ? `Collapsed ${parentLabel}.`
                              : `Expanded ${parentLabel}.`
                          )
                        }}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <ChevronsUpDown className="w-3 h-3" />
                        {expandedGroupIds.has(selectedInstanceId) ? 'Collapse parent' : 'Expand parent'}
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-600 dark:text-slate-400">
                    {inspectorSelection.kind === 'project' &&
                      'Project-level controls affect all extension instances.'}
                    {inspectorSelection.kind === 'extensionType' &&
                      `Type-level controls affect all instances under ${inspectorSelection.subGraph}.`}
                    {inspectorSelection.kind === 'extensionInstance' &&
                      `Instance has ${selectedInstanceMembers.length} composing file${selectedInstanceMembers.length === 1 ? '' : 's'}.`}
                    {inspectorSelection.kind === 'file' &&
                      (selectedInstanceId
                        ? 'File-level control affects the parent extension instance.'
                        : 'File is not associated with an extension instance.')}
                  </p>
                </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Connected entities</div>
                <button
                  onClick={() => setHighlightChain((value) => !value)}
                  className="text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 mb-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {highlightChain ? 'Clear highlight' : 'Highlight chain'}
                </button>
                <div className="text-[12px] text-slate-600 dark:text-slate-400 mb-2">
                  {connectedEntities.length} connected entit{connectedEntities.length === 1 ? 'y' : 'ies'} in current selection.
                </div>
                {connectedEntitiesByType.length === 0 && (
                  <div className="text-[12px] text-slate-500 dark:text-slate-400">No connected entities.</div>
                )}
                {connectedEntitiesByType.length > 0 && (
                  <ul className="space-y-1">
                    {connectedEntitiesByType.map(([type, nodes]) => (
                      <li key={type} className="text-[12px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {type}
                        </span>{' '}
                        ({nodes.length}): {nodes.slice(0, 3).map((node) => node.label).join(', ')}
                        {nodes.length > 3 ? '...' : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedMetadataNode && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {inspectorSelection.kind === 'extensionInstance' ? 'Extension data' : 'File data'}
                  </div>
                  <div className="space-y-1">
                    {Object.entries(selectedMetadataNode.meta ?? {}).length === 0 && (
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">No metadata</div>
                    )}
                    {Object.entries(selectedMetadataNode.meta ?? {}).map(([key, value]) => (
                      <div key={key} className="text-[12px] text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{key}:</span>{' '}
                        <span className="font-mono break-all">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastEditNote && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded p-2">
                  {lastEditNote}
                </div>
              )}

              <div className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                <FileCode2 className="w-3 h-3" />
                This view is data-driven from the selected project graph payload.
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
