import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Search,
  Maximize2,
  Plus,
  Minus,
  X,
  AlertTriangle,
  PanelRight,
  Tag,
  Layers,
  FolderOpen,
  Folder,
} from 'lucide-react'
import type {
  ProjectGraphProps,
  NodeType,
  GraphNode as GraphNodeType,
  GraphEdge,
} from '@/../product/sections/project-graph/types'
import { GraphNodeCard, NODE_W, NODE_H } from './GraphNode'
import { ClusterNodeCard } from './ClusterNodeCard'
import { NodeActionMenu } from './NodeActionMenu'
import { NodeExplainPanel } from './NodeExplainPanel'
import { GraphViews } from './GraphViews'
import type { GraphView } from './GraphViews'
import {
  computeClusterProjection,
} from './clusterUtils'

// ─── Edge annotation labels ────────────────────────────────────────────────────

const EDGE_ANNOTATIONS: Partial<Record<string, string>> = {
  hosts:      'hosts',
  manages:    'manages',
  reads:      'reads',
  depends_on: 'uses',
  tracks:     'tracks',
  imports:    'imports',
  triggers:   'triggers',
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const H_GAP = 22
const V_GAP = 88
const V_GAP_PAGE = 44
const PADDING_X = 80
const PADDING_Y = 56

// ─── Layer filter colors ──────────────────────────────────────────────────────

interface FilterColors {
  inactive: string
  active: string
  dot: string
}

const FILTER_COLORS: Partial<Record<NodeType, FilterColors>> = {
  page: {
    inactive: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
    active: 'bg-indigo-500 text-white border border-indigo-500',
    dot: 'bg-indigo-500',
  },
  app: {
    inactive: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800',
    active: 'bg-cyan-500 text-white border border-cyan-500',
    dot: 'bg-cyan-500',
  },
  table: {
    inactive: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    active: 'bg-emerald-500 text-white border border-emerald-500',
    dot: 'bg-emerald-500',
  },
  code: {
    inactive: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800',
    active: 'bg-violet-500 text-white border border-violet-500',
    dot: 'bg-violet-500',
  },
  analytics: {
    inactive: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    active: 'bg-amber-500 text-white border border-amber-500',
    dot: 'bg-amber-500',
  },
  package: {
    inactive: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-800',
    active: 'bg-fuchsia-500 text-white border border-fuchsia-500',
    dot: 'bg-fuchsia-500',
  },
}

// ─── Auto-view computation ─────────────────────────────────────────────────────

function computeAutoViews(
  allNodes: GraphNodeType[],
  edges: GraphEdge[]
): GraphView[] {
  const adj = new Map<string, string[]>()
  allNodes.forEach((n) => adj.set(n.id, []))
  edges.forEach((e) => {
    adj.get(e.source)?.push(e.target)
    adj.get(e.target)?.push(e.source)
  })

  const bfs = (seeds: string[], maxHops: number): Set<string> => {
    const visited = new Set(seeds)
    let frontier = [...seeds]
    for (let h = 0; h < maxHops; h++) {
      const next: string[] = []
      frontier.forEach((id) => {
        adj.get(id)?.forEach((nid) => {
          if (!visited.has(nid)) { visited.add(nid); next.push(nid) }
        })
      })
      frontier = next
    }
    return visited
  }

  const views: GraphView[] = []

  const storesApp = allNodes.find(
    (n) => n.type === 'app' && n.label.toLowerCase().includes('store')
  )
  if (storesApp) {
    views.push({
      id: 'view-purchase',
      name: 'Purchase Flow',
      description: 'Shop, cart, checkout, and the data behind them',
      nodeIds: bfs([storesApp.id], 2),
      isBuiltIn: true,
    })
  }

  const blogApp = allNodes.find(
    (n) => n.type === 'app' && n.label.toLowerCase().includes('blog')
  )
  if (blogApp) {
    views.push({
      id: 'view-content',
      name: 'Content Discovery',
      description: 'Blog pages, article structure, and content collections',
      nodeIds: bfs([blogApp.id], 2),
      isBuiltIn: true,
    })
  }

  const analyticsSeeds = allNodes.filter((n) => n.type === 'analytics').map((n) => n.id)
  if (analyticsSeeds.length > 0) {
    views.push({
      id: 'view-analytics',
      name: 'Analytics Overview',
      description: 'Traffic and engagement data across all tracked pages',
      nodeIds: bfs(analyticsSeeds, 1),
      isBuiltIn: true,
    })
  }

  return views
}

// ─── Layout computation ────────────────────────────────────────────────────────

interface LayerMetaEntry {
  label: string
  fillClass: string
  sepClass: string
  isPageSub: boolean
}

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
  canvasWidth: number
  canvasHeight: number
  layerCount: number
  layerMeta: Map<number, LayerMetaEntry>
  nodeLayer: Map<string, number>
  layerY: Map<number, number>
}

function computeLayout(
  project: GraphNodeType,
  nodes: GraphNodeType[],
  edges: GraphEdge[]
): LayoutResult {
  const allNodes = [project, ...nodes]
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]))

  // ── Page hierarchy: BFS to compute per-page depth ────────────────────────────
  const pageChildren = new Map<string, string[]>()
  const pageParents = new Map<string, string>()
  allNodes.filter((n) => n.type === 'page').forEach((n) => pageChildren.set(n.id, []))
  edges.forEach((e) => {
    const src = nodeMap.get(e.source)
    const tgt = nodeMap.get(e.target)
    if (src?.type === 'page' && tgt?.type === 'page' && e.type === 'contains') {
      pageChildren.get(e.source)?.push(e.target)
      pageParents.set(e.target, e.source)
    }
  })

  const pageDepth = new Map<string, number>()
  const bfsQueue: Array<{ id: string; depth: number }> = []
  pageChildren.forEach((_, id) => {
    if (!pageParents.has(id)) bfsQueue.push({ id, depth: 0 })
  })
  while (bfsQueue.length) {
    const { id, depth } = bfsQueue.shift()!
    pageDepth.set(id, depth)
    pageChildren.get(id)?.forEach((childId) => bfsQueue.push({ id: childId, depth: depth + 1 }))
  }

  const maxPageDepth = pageDepth.size > 0 ? Math.max(...pageDepth.values()) : 0
  const pageLayerOffset = 1
  const appLayer = pageLayerOffset + maxPageDepth + 1

  const nodeLayerMap = new Map<string, number>()
  allNodes.forEach((n) => {
    if (n.type === 'page') {
      nodeLayerMap.set(n.id, pageLayerOffset + (pageDepth.get(n.id) ?? 0))
    } else {
      let slot: number
      if (n.type === 'project') {
        slot = 0
      } else if (n.type === 'app') {
        slot = appLayer
      } else if (n.type === 'table') {
        slot = appLayer + 1
      } else if (n.type === 'code') {
        const fileType = (n.meta as { fileType?: string }).fileType
        slot = fileType === 'backend' ? appLayer + 3 : appLayer + 2
      } else if (n.type === 'package') {
        slot = appLayer + 4
      } else {
        slot = appLayer + 5
      }
      nodeLayerMap.set(n.id, slot)
    }
  })

  const layerMetaMap = new Map<number, LayerMetaEntry>()
  layerMetaMap.set(0, { label: 'Root', fillClass: 'fill-slate-400 dark:fill-slate-500', sepClass: 'stroke-slate-300 dark:stroke-slate-600', isPageSub: false })
  for (let d = 0; d <= maxPageDepth; d++) {
    layerMetaMap.set(pageLayerOffset + d, {
      label: d === 0 ? 'Pages' : '',
      fillClass: 'fill-indigo-500 dark:fill-indigo-400',
      sepClass: 'stroke-indigo-200 dark:stroke-indigo-800',
      isPageSub: d > 0,
    })
  }
  layerMetaMap.set(appLayer,     { label: 'Apps',        fillClass: 'fill-cyan-500 dark:fill-cyan-400',       sepClass: 'stroke-cyan-200 dark:stroke-cyan-800',       isPageSub: false })
  layerMetaMap.set(appLayer + 1, { label: 'Tables',      fillClass: 'fill-emerald-500 dark:fill-emerald-400', sepClass: 'stroke-emerald-200 dark:stroke-emerald-800', isPageSub: false })
  layerMetaMap.set(appLayer + 2, { label: 'Client Code', fillClass: 'fill-violet-400 dark:fill-violet-300',   sepClass: 'stroke-violet-200 dark:stroke-violet-800',   isPageSub: false })
  layerMetaMap.set(appLayer + 3, { label: 'Server Code', fillClass: 'fill-violet-600 dark:fill-violet-500',   sepClass: 'stroke-violet-300 dark:stroke-violet-700',   isPageSub: false })
  layerMetaMap.set(appLayer + 4, { label: 'Packages',    fillClass: 'fill-fuchsia-500 dark:fill-fuchsia-400', sepClass: 'stroke-fuchsia-200 dark:stroke-fuchsia-800', isPageSub: false })
  layerMetaMap.set(appLayer + 5, { label: 'Analytics',   fillClass: 'fill-amber-500 dark:fill-amber-400',     sepClass: 'stroke-amber-200 dark:stroke-amber-800',     isPageSub: false })

  const layerMap = new Map<number, string[]>()
  allNodes.forEach((n) => {
    const slot = nodeLayerMap.get(n.id) ?? 0
    if (!layerMap.has(slot)) layerMap.set(slot, [])
    layerMap.get(slot)!.push(n.id)
  })

  const sortedLayers = [...layerMap.keys()].sort((a, b) => a - b)

  const layerYMap = new Map<number, number>()
  sortedLayers.forEach((layerIdx, i) => {
    if (i === 0) {
      layerYMap.set(layerIdx, PADDING_Y)
    } else {
      const prevLayerIdx = sortedLayers[i - 1]
      const prevY = layerYMap.get(prevLayerIdx)!
      const isSubPageGap = layerIdx > pageLayerOffset && layerIdx <= pageLayerOffset + maxPageDepth
      layerYMap.set(layerIdx, prevY + NODE_H + (isSubPageGap ? V_GAP_PAGE : V_GAP))
    }
  })

  let maxNodesInLayer = 0
  layerMap.forEach((ids) => { maxNodesInLayer = Math.max(maxNodesInLayer, ids.length) })
  const canvasWidth = Math.max(900, PADDING_X * 2 + maxNodesInLayer * NODE_W + (maxNodesInLayer - 1) * H_GAP)
  const lastLayer = sortedLayers[sortedLayers.length - 1] ?? 0
  const canvasHeight = (layerYMap.get(lastLayer) ?? 0) + NODE_H + PADDING_Y

  const positions = new Map<string, { x: number; y: number }>()

  const neighbors = new Map<string, Set<string>>()
  allNodes.forEach((n) => neighbors.set(n.id, new Set()))
  edges.forEach((e) => {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      neighbors.get(e.source)?.add(e.target)
      neighbors.get(e.target)?.add(e.source)
    }
  })

  const placeLayer = (layerIdx: number) => {
    const ids = layerMap.get(layerIdx)!
    const y = layerYMap.get(layerIdx)!
    const totalW = ids.length * NODE_W + (ids.length - 1) * H_GAP
    const startX = (canvasWidth - totalW) / 2
    ids.forEach((id, i) => {
      positions.set(id, { x: startX + i * (NODE_W + H_GAP), y })
    })
  }

  const barycenter = (id: string): number => {
    const pts = [...(neighbors.get(id) ?? [])]
      .map((nid) => positions.get(nid))
      .filter(Boolean) as { x: number; y: number }[]
    if (!pts.length) return canvasWidth / 2
    return pts.reduce((sum, p) => sum + p.x + NODE_W / 2, 0) / pts.length
  }

  const sortLayer = (layerIdx: number) => {
    layerMap.get(layerIdx)!.sort((a, b) => barycenter(a) - barycenter(b))
  }

  for (const layerIdx of sortedLayers) {
    if (layerIdx > 0) sortLayer(layerIdx)
    placeLayer(layerIdx)
  }

  const ITERATIONS = 4
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = sortedLayers.length - 2; i >= 0; i--) {
      sortLayer(sortedLayers[i])
      placeLayer(sortedLayers[i])
    }
    for (let i = 1; i < sortedLayers.length; i++) {
      sortLayer(sortedLayers[i])
      placeLayer(sortedLayers[i])
    }
  }

  return {
    positions,
    canvasWidth,
    canvasHeight,
    layerCount: sortedLayers.length,
    layerMeta: layerMetaMap,
    nodeLayer: nodeLayerMap,
    layerY: layerYMap,
  }
}

// ─── Main component ────────────────────────────────────────────────────────────

interface ProjectGraphExtendedProps extends ProjectGraphProps {
  /** Pre-select this node on mount (e.g. when navigating from the inventory table) */
  initialSelectedNodeId?: string
}

export function ProjectGraph({
  project,
  nodes,
  edges,
  alerts,
  layerFilters,
  initialSelectedNodeId,
  onNodeSelect,
  onNodeOpen,
  onLayerToggle,
  onSearch,
  onFitToScreen,
  onGoToMonitoring,
}: ProjectGraphExtendedProps) {
  const [activeTypes, setActiveTypes] = useState<Set<NodeType>>(
    () => new Set(layerFilters.filter((f) => f.enabled).map((f) => f.type))
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId ?? null)
  const [highlightDepth, setHighlightDepth] = useState<1 | 2>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [transform, setTransform] = useState({ x: 40, y: 24, scale: 0.75 })
  const [explainPaneOpen, setExplainPaneOpen] = useState(true)
  const [showEdgeLabels, setShowEdgeLabels] = useState(false)
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [customViews, setCustomViews] = useState<GraphView[]>([])
  const [viewsOpen, setViewsOpen] = useState(false)
  const [clusteringEnabled, setClusteringEnabled] = useState(true)
  const [expandedClusterIds, setExpandedClusterIds] = useState<Set<string>>(new Set())

  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDragging: false, hasDragged: false, startX: 0, startY: 0, startTX: 0, startTY: 0 })
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // All real nodes (project + leaf nodes from props)
  const allNodes = useMemo(() => [project, ...nodes], [project, nodes])

  // ── Cluster projection ──────────────────────────────────────────────────────
  const clusterProjection = useMemo(() => {
    if (!clusteringEnabled) return null
    return computeClusterProjection(allNodes, edges, expandedClusterIds)
  }, [clusteringEnabled, allNodes, edges, expandedClusterIds])

  // ── Effective nodes for layout: collapsed cluster members → proxy node ───────
  // Proxy nodes have type 'page' so computeLayout places them at depth-0 (Pages layer)
  const layoutNodes = useMemo((): GraphNodeType[] => {
    if (!clusterProjection) return nodes
    const result: GraphNodeType[] = []
    const addedClusterIds = new Set<string>()
    nodes.forEach((node) => {
      if (node.type !== 'page') {
        result.push(node)
        return
      }
      const clusterId = clusterProjection.clusterForMember.get(node.id)
      if (!clusterId) {
        result.push(node) // singleton root page — not in a cluster
        return
      }
      if (expandedClusterIds.has(clusterId)) {
        result.push(node) // expanded: show member normally
        return
      }
      // Collapsed: add cluster proxy once (first member wins)
      if (!addedClusterIds.has(clusterId)) {
        addedClusterIds.add(clusterId)
        const cluster = clusterProjection.clusters.find((c) => c.id === clusterId)!
        // Fake GraphNode that the layout algorithm treats as a root page
        result.push({
          id: clusterId,
          type: 'page' as const,
          label: cluster.label,
          source: 'DM',
          meta: {},
          alertCount: cluster.alertCount,
        })
      }
    })
    return result
  }, [clusterProjection, nodes, expandedClusterIds])

  // ── Effective edges for layout ────────────────────────────────────────────────
  // Drop edges involving collapsed members; add boundary edges as GraphEdge proxies
  const layoutEdges = useMemo((): GraphEdge[] => {
    if (!clusterProjection) return edges
    const { collapsedMemberIds, boundaryEdges } = clusterProjection
    const regularEdges = edges.filter(
      (e) => !collapsedMemberIds.has(e.source) && !collapsedMemberIds.has(e.target)
    )
    const proxyEdges: GraphEdge[] = boundaryEdges.map((be) => ({
      id: be.id,
      source: be.source,
      target: be.target,
      type: 'depends_on' as const,
      hasAlert: be.hasAlert,
    }))
    return [...regularEdges, ...proxyEdges]
  }, [clusterProjection, edges])

  const layout = useMemo(
    () => computeLayout(project, layoutNodes, layoutEdges),
    [project, layoutNodes, layoutEdges]
  )

  // Nodes to iterate when rendering HTML cards (cluster proxies are in layoutNodes)
  const renderNodes = useMemo(
    () => (clusterProjection ? [project, ...layoutNodes] : allNodes),
    [clusterProjection, project, layoutNodes, allNodes]
  )

  // Fit to screen on mount / layout change
  useEffect(() => {
    if (!containerRef.current) return
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect()
    const scaleX = (cw - 80) / layout.canvasWidth
    const scaleY = (ch - 80) / layout.canvasHeight
    const scale = Math.min(scaleX, scaleY, 0.88)
    const x = Math.max(24, (cw - layout.canvasWidth * scale) / 2)
    const y = Math.max(24, (ch - layout.canvasHeight * scale) / 2)
    setTransform({ x, y, scale })
  }, [layout.canvasWidth, layout.canvasHeight])

  // Alert lookups
  const alertedNodeIds = useMemo(() => new Set(alerts.map((a) => a.nodeId)), [alerts])
  const alertedEdgeIds = useMemo(
    () => new Set(alerts.flatMap((a) => a.affectedEdgeIds)),
    [alerts]
  )

  // Selected node connections — uses layoutEdges so cluster proxies resolve correctly
  const selectedConnections = useMemo(() => {
    if (!selectedNodeId) return { nodes: new Set<string>(), edges: new Set<string>() }
    const connNodes = new Set<string>([selectedNodeId])
    const connEdges = new Set<string>()
    for (let d = 0; d < highlightDepth; d++) {
      const frontier = new Set(connNodes)
      layoutEdges.forEach((e) => {
        if (frontier.has(e.source) || frontier.has(e.target)) {
          connNodes.add(e.source)
          connNodes.add(e.target)
          connEdges.add(e.id)
        }
      })
    }
    return { nodes: connNodes, edges: connEdges }
  }, [selectedNodeId, layoutEdges, highlightDepth])

  // Search: also bubble-up matches inside collapsed clusters
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const q = searchQuery.toLowerCase()
    const matches = new Set<string>()
    allNodes.forEach((n) => {
      if (n.label.toLowerCase().includes(q)) matches.add(n.id)
    })
    if (clusterProjection) {
      clusterProjection.clusters.forEach((cluster) => {
        if (!expandedClusterIds.has(cluster.id)) {
          const clusterMatches =
            cluster.label.toLowerCase().includes(q) ||
            cluster.memberIds.some((id) => {
              const node = allNodes.find((n) => n.id === id)
              return node?.label.toLowerCase().includes(q)
            })
          if (clusterMatches) matches.add(cluster.id)
        }
      })
    }
    return matches
  }, [searchQuery, allNodes, clusterProjection, expandedClusterIds])

  // Visible node IDs (uses layoutNodes so cluster proxies are included via type: 'page')
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>([project.id])
    layoutNodes.forEach((n) => {
      if (activeTypes.has(n.type)) ids.add(n.id)
    })
    return ids
  }, [project.id, layoutNodes, activeTypes])

  // Active layer slots for separator + label rendering
  const activeLayers = useMemo(() => {
    const slots = new Set<number>();
    [project, ...layoutNodes].forEach((n) => {
      if (visibleNodeIds.has(n.id)) {
        const slot = layout.nodeLayer.get(n.id)
        if (slot !== undefined) slots.add(slot)
      }
    })
    return [...slots].sort((a, b) => a - b)
  }, [project, layoutNodes, visibleNodeIds, layout.nodeLayer])

  // Auto-generated views
  const autoViews = useMemo(() => computeAutoViews(allNodes, edges), [allNodes, edges])

  const viewFocusIds = useMemo(() => {
    if (!activeViewId) return null
    return [...autoViews, ...customViews].find((v) => v.id === activeViewId)?.nodeIds ?? null
  }, [activeViewId, autoViews, customViews])

  // Selected real node (null for clusters)
  const selectedNode = useMemo(
    () => allNodes.find((n) => n.id === selectedNodeId) ?? null,
    [allNodes, selectedNodeId]
  )

  // Selected cluster (null when a regular node is selected)
  const selectedCluster = useMemo(() => {
    if (!selectedNodeId || !clusterProjection) return null
    return clusterProjection.clusters.find((c) => c.id === selectedNodeId) ?? null
  }, [selectedNodeId, clusterProjection])

  // Member page nodes for the cluster inspector panel
  const clusterMemberNodes = useMemo(() => {
    if (!selectedCluster) return []
    const memberSet = new Set(selectedCluster.memberIds)
    return allNodes.filter((n) => memberSet.has(n.id))
  }, [selectedCluster, allNodes])

  // Connected nodes for explain panel
  const panelConnectedNodes = useMemo(() => {
    if (!selectedNodeId) return []
    const connIds = new Set<string>()
    layoutEdges.forEach((e) => {
      if (e.source === selectedNodeId) connIds.add(e.target)
      if (e.target === selectedNodeId) connIds.add(e.source)
    })
    return allNodes.filter((n) => connIds.has(n.id))
  }, [selectedNodeId, allNodes, layoutEdges])

  // Edges directly involving the selected node (for drill-down)
  const selectedNodeEdges = useMemo(() => {
    if (!selectedNodeId) return []
    return layoutEdges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId)
  }, [selectedNodeId, layoutEdges])

  // Alerts for the explain panel
  const panelNodeAlerts = useMemo(
    () => alerts.filter((a) => a.nodeId === selectedNodeId),
    [selectedNodeId, alerts]
  )

  // Screen-space anchor for the action menu (works for real nodes and cluster proxies)
  const actionMenuAnchor = useMemo(() => {
    if (!selectedNodeId) return null
    const pos = layout.positions.get(selectedNodeId)
    if (!pos) return null
    return {
      x: transform.x + (pos.x + NODE_W / 2) * transform.scale,
      y: transform.y + (pos.y + NODE_H) * transform.scale,
    }
  }, [selectedNodeId, layout.positions, transform])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleLayerToggle = useCallback(
    (type: NodeType) => {
      setActiveTypes((prev) => {
        const next = new Set(prev)
        if (next.has(type)) next.delete(type)
        else next.add(type)
        return next
      })
      onLayerToggle?.(type)
    },
    [onLayerToggle]
  )

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null)
    onNodeSelect?.(null)
  }, [onNodeSelect])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current)
        clickTimer.current = null
        onNodeOpen?.(nodeId)
      } else {
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null
          if (selectedNodeId === nodeId) {
            clearSelection()
          } else {
            setSelectedNodeId(nodeId)
            onNodeSelect?.(nodeId)
          }
        }, 220)
      }
    },
    [selectedNodeId, onNodeSelect, onNodeOpen, clearSelection]
  )

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q)
      onSearch?.(q)
    },
    [onSearch]
  )

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect()
    const scaleX = (cw - 80) / layout.canvasWidth
    const scaleY = (ch - 80) / layout.canvasHeight
    const scale = Math.min(scaleX, scaleY, 0.88)
    const x = Math.max(24, (cw - layout.canvasWidth * scale) / 2)
    const y = Math.max(24, (ch - layout.canvasHeight * scale) / 2)
    setTransform({ x, y, scale })
    onFitToScreen?.()
  }, [layout, onFitToScreen])

  const handleExplore = useCallback(
    (nodeId: string) => {
      setHighlightDepth(2)
      const connIds = new Set<string>([nodeId])
      layoutEdges.forEach((e) => {
        if (e.source === nodeId || e.target === nodeId) {
          connIds.add(e.source)
          connIds.add(e.target)
        }
      })
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      connIds.forEach((id) => {
        const pos = layout.positions.get(id)
        if (!pos) return
        minX = Math.min(minX, pos.x)
        minY = Math.min(minY, pos.y)
        maxX = Math.max(maxX, pos.x + NODE_W)
        maxY = Math.max(maxY, pos.y + NODE_H)
      })
      if (minX === Infinity || !containerRef.current) return
      const { width: cw, height: ch } = containerRef.current.getBoundingClientRect()
      const PADDING = 100
      const scale = Math.min(
        (cw - PADDING * 2) / Math.max(maxX - minX, 1),
        (ch - PADDING * 2) / Math.max(maxY - minY, 1),
        1.6
      )
      const x = (cw - (maxX - minX) * scale) / 2 - minX * scale
      const y = (ch - (maxY - minY) * scale) / 2 - minY * scale
      setTransform({ x, y, scale })
    },
    [layoutEdges, layout.positions]
  )

  const handleSaveView = useCallback(
    (name: string) => {
      const nodeIds = viewFocusIds
        ? new Set(viewFocusIds)
        : new Set(selectedConnections.nodes)
      setCustomViews((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          name,
          description: `${nodeIds.size} nodes`,
          nodeIds,
          isBuiltIn: false,
        },
      ])
    },
    [viewFocusIds, selectedConnections.nodes]
  )

  const handleDeleteView = useCallback((id: string) => {
    setCustomViews((prev) => prev.filter((v) => v.id !== id))
    setActiveViewId((prev) => (prev === id ? null : prev))
  }, [])

  const handleActivateView = useCallback(
    (id: string | null) => {
      setActiveViewId(id)
      setViewsOpen(false)
      if (!id || !containerRef.current) return
      const view = [...autoViews, ...customViews].find((v) => v.id === id)
      if (!view) return
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      view.nodeIds.forEach((nid) => {
        const pos = layout.positions.get(nid)
        if (!pos) return
        minX = Math.min(minX, pos.x)
        minY = Math.min(minY, pos.y)
        maxX = Math.max(maxX, pos.x + NODE_W)
        maxY = Math.max(maxY, pos.y + NODE_H)
      })
      if (minX === Infinity) return
      const { width: cw, height: ch } = containerRef.current.getBoundingClientRect()
      const PAD = 80
      const scale = Math.min(
        (cw - PAD * 2) / Math.max(maxX - minX, 1),
        (ch - PAD * 2) / Math.max(maxY - minY, 1),
        1.2
      )
      setTransform({
        x: (cw - (maxX - minX) * scale) / 2 - minX * scale,
        y: (ch - (maxY - minY) * scale) / 2 - minY * scale,
        scale,
      })
    },
    [autoViews, customViews, layout.positions]
  )

  const handleToggleCluster = useCallback((clusterId: string) => {
    setExpandedClusterIds((prev) => {
      const next = new Set(prev)
      if (next.has(clusterId)) next.delete(clusterId)
      else next.add(clusterId)
      return next
    })
  }, [])

  // Pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-node]')) return
      dragState.current = {
        isDragging: true,
        hasDragged: false,
        startX: e.clientX,
        startY: e.clientY,
        startTX: transform.x,
        startTY: transform.y,
      }
    },
    [transform.x, transform.y]
  )

  useEffect(() => {
    const DRAG_THRESHOLD = 4
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (!dragState.current.hasDragged && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        dragState.current.hasDragged = true
      }
      setTransform((prev) => ({
        ...prev,
        x: dragState.current.startTX + dx,
        y: dragState.current.startTY + dy,
      }))
    }
    const handleMouseUp = () => {
      dragState.current.isDragging = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(2.5, Math.max(0.25, prev.scale * factor)),
    }))
  }, [])

  // ─── Edge renderers ─────────────────────────────────────────────────────────

  const bezierPath = (
    src: { x: number; y: number },
    tgt: { x: number; y: number }
  ): { d: string; midX: number; midY: number } => {
    const srcX = src.x + NODE_W / 2
    const tgtX = tgt.x + NODE_W / 2
    if (src.y < tgt.y) {
      const srcY = src.y + NODE_H
      const tgtY = tgt.y
      const cp = Math.abs(tgtY - srcY) * 0.42
      return {
        d: `M ${srcX} ${srcY} C ${srcX} ${srcY + cp} ${tgtX} ${tgtY - cp} ${tgtX} ${tgtY}`,
        midX: (srcX + tgtX) / 2,
        midY: (srcY + tgtY) / 2,
      }
    } else if (src.y > tgt.y) {
      const srcY = src.y
      const tgtY = tgt.y + NODE_H
      const cp = Math.abs(srcY - tgtY) * 0.42
      return {
        d: `M ${srcX} ${srcY} C ${srcX} ${srcY - cp} ${tgtX} ${tgtY + cp} ${tgtX} ${tgtY}`,
        midX: (srcX + tgtX) / 2,
        midY: (srcY + tgtY) / 2,
      }
    } else {
      const srcY = src.y + NODE_H / 2
      const tgtY = tgt.y + NODE_H / 2
      const arc = 40
      return {
        d: `M ${srcX} ${srcY} C ${srcX} ${srcY - arc} ${tgtX} ${tgtY - arc} ${tgtX} ${tgtY}`,
        midX: (srcX + tgtX) / 2,
        midY: srcY - arc * 0.75,
      }
    }
  }

  const renderEdges = () => {
    // When clustering: use layoutEdges but skip boundary-edge proxies (rendered separately)
    const edgesToRender = clusterProjection
      ? layoutEdges.filter((e) => !e.id.startsWith('boundary:'))
      : edges

    return edgesToRender.map((edge) => {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return null
      const src = layout.positions.get(edge.source)
      const tgt = layout.positions.get(edge.target)
      if (!src || !tgt) return null

      const { d, midX, midY } = bezierPath(src, tgt)
      const isAlerted = edge.hasAlert || alertedEdgeIds.has(edge.id)
      const isConnected = selectedConnections.edges.has(edge.id)
      const isInView = viewFocusIds
        ? viewFocusIds.has(edge.source) && viewFocusIds.has(edge.target)
        : true
      const isDimmed = selectedNodeId
        ? !isConnected
        : viewFocusIds
        ? !isInView
        : false

      let strokeClass: string
      if (isAlerted) {
        strokeClass = isDimmed
          ? 'stroke-red-300 dark:stroke-red-900 opacity-30'
          : 'stroke-red-500 dark:stroke-red-400'
      } else if (isConnected) {
        strokeClass = 'stroke-indigo-500 dark:stroke-indigo-400'
      } else if (isDimmed) {
        strokeClass = 'stroke-slate-200 dark:stroke-slate-800 opacity-20'
      } else {
        strokeClass = 'stroke-slate-300 dark:stroke-slate-600/80'
      }

      const annotation = showEdgeLabels ? EDGE_ANNOTATIONS[edge.type] : undefined
      const pillW = annotation ? annotation.length * 5.5 + 12 : 0
      const pillH = 14

      return (
        <g key={edge.id}>
          <path
            d={d}
            fill="none"
            strokeWidth={isAlerted || isConnected ? 2 : 1.5}
            strokeLinecap="round"
            className={`transition-all duration-150 ${strokeClass}`}
          />
          {annotation && !isDimmed && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={midX - pillW / 2}
                y={midY - pillH / 2}
                width={pillW}
                height={pillH}
                rx={pillH / 2}
                className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={1}
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
                className={
                  isAlerted
                    ? 'fill-red-500 dark:fill-red-400'
                    : isConnected
                    ? 'fill-indigo-500 dark:fill-indigo-400'
                    : 'fill-slate-400 dark:fill-slate-500'
                }
              >
                {annotation}
              </text>
            </g>
          )}
        </g>
      )
    })
  }

  const renderBoundaryEdges = () => {
    if (!clusterProjection) return null
    return clusterProjection.boundaryEdges.map((be) => {
      if (!visibleNodeIds.has(be.source) || !visibleNodeIds.has(be.target)) return null
      const src = layout.positions.get(be.source)
      const tgt = layout.positions.get(be.target)
      if (!src || !tgt) return null

      const { d, midX, midY } = bezierPath(src, tgt)
      const isConnected = selectedConnections.edges.has(be.id)
      const isDimmed = selectedNodeId ? !isConnected : false

      const strokeClass = be.hasAlert
        ? isDimmed
          ? 'stroke-red-300 dark:stroke-red-900 opacity-30'
          : 'stroke-red-500 dark:stroke-red-400'
        : isConnected
        ? 'stroke-indigo-400 dark:stroke-indigo-500'
        : isDimmed
        ? 'stroke-slate-200 dark:stroke-slate-800 opacity-20'
        : 'stroke-indigo-200 dark:stroke-indigo-800/60'

      // Count pill
      const label = be.count > 1 ? `×${be.count}` : be.types[0] ?? ''
      const pillW = label.length * 5.5 + 12
      const pillH = 14

      return (
        <g key={be.id}>
          <path
            d={d}
            fill="none"
            strokeWidth={isConnected ? 2 : 1.5}
            strokeLinecap="round"
            strokeDasharray="5 3"
            className={`transition-all duration-150 ${strokeClass}`}
          />
          {!isDimmed && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={midX - pillW / 2}
                y={midY - pillH / 2}
                width={pillW}
                height={pillH}
                rx={pillH / 2}
                className="fill-indigo-50 dark:fill-indigo-950/80 stroke-indigo-200 dark:stroke-indigo-800"
                strokeWidth={1}
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
                className={
                  isConnected
                    ? 'fill-indigo-600 dark:fill-indigo-400'
                    : 'fill-indigo-400 dark:fill-indigo-500'
                }
              >
                {label}
              </text>
            </g>
          )}
        </g>
      )
    })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Layer filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {layerFilters
            .filter((f) => f.type !== 'project')
            .map((filter) => {
              const isActive = activeTypes.has(filter.type)
              const colors = FILTER_COLORS[filter.type]
              if (!colors) return null
              return (
                <button
                  key={filter.type}
                  onClick={() => handleLayerToggle(filter.type)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                    isActive ? colors.active : colors.inactive
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white/80' : colors.dot}`} />
                  {filter.label}
                </button>
              )
            })}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Search */}
        <div className="relative w-44">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Find node…"
            className="w-full pl-7 pr-6 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 rounded-lg outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        {searchMatches.size > 0 && (
          <span
            className="text-[11px] text-slate-500 dark:text-slate-400"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {searchMatches.size} match{searchMatches.size !== 1 ? 'es' : ''}
          </span>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Depth toggle */}
        <div className="flex items-center gap-1">
          <span
            className="text-[10px] text-slate-400 dark:text-slate-500 mr-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            depth
          </span>
          <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
            {([1, 2] as const).map((d) => (
              <button
                key={d}
                onClick={() => setHighlightDepth(d)}
                className={`px-2 py-1 text-[11px] font-semibold transition-colors ${
                  highlightDepth === d
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {d}°
              </button>
            ))}
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Edge label toggle */}
        <button
          onClick={() => setShowEdgeLabels((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
            showEdgeLabels
              ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 border border-slate-700 dark:border-slate-200'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <Tag className="w-3 h-3" />
          Edge labels
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Views dropdown */}
        <div className="relative">
          <button
            onClick={() => setViewsOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
              activeViewId
                ? 'bg-indigo-500 text-white border border-indigo-500'
                : viewsOpen
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Layers className="w-3 h-3" />
            {activeViewId
              ? ([...autoViews, ...customViews].find((v) => v.id === activeViewId)?.name ?? 'View')
              : 'Views'}
          </button>

          {viewsOpen && (
            <GraphViews
              autoViews={autoViews}
              customViews={customViews}
              activeViewId={activeViewId}
              canSave={!!selectedNodeId || !!activeViewId}
              onActivate={handleActivateView}
              onSave={handleSaveView}
              onDelete={handleDeleteView}
              onClose={() => setViewsOpen(false)}
            />
          )}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Clusters toggle */}
        <button
          onClick={() => {
            setClusteringEnabled((v) => !v)
            if (clusteringEnabled) setExpandedClusterIds(new Set())
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ${
            clusteringEnabled
              ? 'bg-indigo-500 text-white border border-indigo-500'
              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {clusteringEnabled ? (
            <FolderOpen className="w-3 h-3" />
          ) : (
            <Folder className="w-3 h-3" />
          )}
          Clusters
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Alert badge */}
        {alerts.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span
              className="text-[11px] font-semibold text-red-600 dark:text-red-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Inspector toggle */}
        <button
          onClick={() => setExplainPaneOpen((v) => !v)}
          title={explainPaneOpen ? 'Hide inspector' : 'Show inspector'}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
            explainPaneOpen
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() =>
              setTransform((prev) => ({ ...prev, scale: Math.min(2.5, prev.scale * 1.15) }))
            }
            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span
            className="text-[10px] text-slate-400 dark:text-slate-500 w-9 text-center tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            onClick={() =>
              setTransform((prev) => ({ ...prev, scale: Math.max(0.25, prev.scale * 0.85) }))
            }
            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitToScreen}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-0.5"
            title="Fit to screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas + explain panel row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden relative"
          style={{ cursor: 'grab' }}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
          onClick={(e) => {
            if (dragState.current.hasDragged) return
            if (!(e.target as HTMLElement).closest('[data-node]')) {
              clearSelection()
            }
          }}
        >
          {/* Dot-grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(100,116,139,0.3) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Transformed graph container */}
          <div
            style={{
              position: 'absolute',
              transformOrigin: '0 0',
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              width: layout.canvasWidth,
              height: layout.canvasHeight,
            }}
          >
            {/* SVG edges + lane chrome layer */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: layout.canvasWidth,
                height: layout.canvasHeight,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              {/* Lane separator lines */}
              {activeLayers.slice(1).map((layerIdx, i) => {
                const prevLayerIdx = activeLayers[i]
                const prevY = layout.layerY.get(prevLayerIdx) ?? 0
                const curY = layout.layerY.get(layerIdx) ?? 0
                const sepY = prevY + NODE_H + (curY - prevY - NODE_H) / 2
                const meta = layout.layerMeta.get(layerIdx)
                return (
                  <line
                    key={`sep-${layerIdx}`}
                    x1={0}
                    y1={sepY}
                    x2={layout.canvasWidth}
                    y2={sepY}
                    strokeWidth={1.5}
                    strokeDasharray={meta?.isPageSub ? '4 4' : undefined}
                    className={meta?.sepClass ?? 'stroke-slate-300 dark:stroke-slate-600'}
                  />
                )
              })}

              {/* Lane labels */}
              {activeLayers.map((layerIdx) => {
                const meta = layout.layerMeta.get(layerIdx)
                if (!meta?.label) return null
                const y = layout.layerY.get(layerIdx) ?? 0
                const labelY = y + NODE_H / 2
                const labelStyle = {
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                }
                return (
                  <>
                    <text
                      key={`lbl-l-${layerIdx}`}
                      x={10}
                      y={labelY}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className={meta.fillClass}
                      style={labelStyle}
                    >
                      {meta.label}
                    </text>
                    <text
                      key={`lbl-r-${layerIdx}`}
                      x={layout.canvasWidth - 10}
                      y={labelY}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className={meta.fillClass}
                      style={labelStyle}
                    >
                      {meta.label}
                    </text>
                  </>
                )
              })}

              {renderEdges()}
              {renderBoundaryEdges()}
            </svg>

            {/* HTML node layer */}
            {renderNodes.map((node) => {
              if (!visibleNodeIds.has(node.id)) return null
              const pos = layout.positions.get(node.id)
              if (!pos) return null

              const isSelected = node.id === selectedNodeId
              const isHighlighted = selectedNodeId
                ? selectedConnections.nodes.has(node.id)
                : viewFocusIds?.has(node.id) ?? false
              const isDimmed = selectedNodeId
                ? !selectedConnections.nodes.has(node.id)
                : viewFocusIds
                ? !viewFocusIds.has(node.id)
                : false
              const isSearchMatch = searchMatches.has(node.id)

              // Cluster proxy nodes (IDs start with 'cluster-')
              const cluster = clusterProjection?.clusters.find((c) => c.id === node.id)
              if (cluster) {
                return (
                  <ClusterNodeCard
                    key={node.id}
                    cluster={cluster}
                    x={pos.x}
                    y={pos.y}
                    isExpanded={expandedClusterIds.has(cluster.id)}
                    isSelected={isSelected}
                    isHighlighted={isHighlighted}
                    isDimmed={isDimmed}
                    isSearchMatch={isSearchMatch}
                    onClick={() => handleNodeClick(node.id)}
                    onToggleExpand={(e) => {
                      e.stopPropagation()
                      handleToggleCluster(cluster.id)
                    }}
                  />
                )
              }

              return (
                <GraphNodeCard
                  key={node.id}
                  node={node}
                  x={pos.x}
                  y={pos.y}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  isSearchMatch={isSearchMatch}
                  onClick={() => handleNodeClick(node.id)}
                  onDoubleClick={() => {
                    if (clickTimer.current) {
                      clearTimeout(clickTimer.current)
                      clickTimer.current = null
                    }
                    onNodeOpen?.(node.id)
                  }}
                />
              )
            })}
          </div>

          {/* Floating action menu */}
          {actionMenuAnchor && (selectedNode || selectedCluster) && (
            <NodeActionMenu
              anchor={actionMenuAnchor}
              node={selectedNode}
              alertCount={selectedNode?.alertCount ?? selectedCluster?.alertCount ?? 0}
              isCluster={!!selectedCluster}
              onGoTo={() => selectedNode && onNodeOpen?.(selectedNode.id)}
              onExplain={() => setExplainPaneOpen(true)}
              onExplore={() => handleExplore(selectedNodeId!)}
              onGoToMonitoring={() =>
                selectedNode && onGoToMonitoring?.(selectedNode.id)
              }
            />
          )}
        </div>

        {/* Inspector panel */}
        {explainPaneOpen && (
          <NodeExplainPanel
            node={selectedNode}
            selectedCluster={selectedCluster}
            clusterMemberNodes={clusterMemberNodes}
            connectedNodes={panelConnectedNodes}
            nodeEdges={selectedNodeEdges}
            nodeAlerts={panelNodeAlerts}
            onClose={() => setExplainPaneOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
