import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Search, Maximize2, Plus, Minus, X, AlertTriangle } from 'lucide-react'
import type {
  ProjectGraphProps,
  NodeType,
  GraphNode as GraphNodeType,
  GraphEdge,
} from '@/../product/sections/project-graph/types'
import { GraphNodeCard, NODE_W, NODE_H } from './GraphNode'
import { NodeActionMenu } from './NodeActionMenu'
import { NodeExplainPanel } from './NodeExplainPanel'

// ─── Layout constants ─────────────────────────────────────────────────────────

const H_GAP = 22
const V_GAP = 88
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
}

// ─── Layout computation ────────────────────────────────────────────────────────

// Each entity type gets a fixed layer slot regardless of graph connectivity.
// Layers are processed top-to-bottom; within each layer nodes are sorted by the
// average x-position of their already-positioned neighbors to reduce crossings.
const TYPE_LAYER: Record<NodeType, number> = {
  project:   0,
  page:      1,
  app:       2,
  code:      3,
  table:     4,
  analytics: 5,
}

const LAYER_META: Record<number, { label: string; fillClass: string; sepClass: string }> = {
  0: { label: 'Root',      fillClass: 'fill-slate-400 dark:fill-slate-500',    sepClass: 'stroke-slate-300 dark:stroke-slate-600' },
  1: { label: 'Pages',     fillClass: 'fill-indigo-500 dark:fill-indigo-400',  sepClass: 'stroke-indigo-200 dark:stroke-indigo-800' },
  2: { label: 'Apps',      fillClass: 'fill-cyan-500 dark:fill-cyan-400',      sepClass: 'stroke-cyan-200 dark:stroke-cyan-800' },
  3: { label: 'Code',      fillClass: 'fill-violet-500 dark:fill-violet-400',  sepClass: 'stroke-violet-200 dark:stroke-violet-800' },
  4: { label: 'Tables',    fillClass: 'fill-emerald-500 dark:fill-emerald-400',sepClass: 'stroke-emerald-200 dark:stroke-emerald-800' },
  5: { label: 'Analytics', fillClass: 'fill-amber-500 dark:fill-amber-400',    sepClass: 'stroke-amber-200 dark:stroke-amber-800' },
}

interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
  canvasWidth: number
  canvasHeight: number
  layerCount: number
}

function computeLayout(
  project: GraphNodeType,
  nodes: GraphNodeType[],
  edges: GraphEdge[]
): LayoutResult {
  const allNodes = [project, ...nodes]
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]))

  // Bidirectional adjacency
  const neighbors = new Map<string, Set<string>>()
  allNodes.forEach((n) => neighbors.set(n.id, new Set()))
  edges.forEach((e) => {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      neighbors.get(e.source)?.add(e.target)
      neighbors.get(e.target)?.add(e.source)
    }
  })

  // Assign each node to its type-based layer slot
  const layerMap = new Map<number, string[]>()
  allNodes.forEach((n) => {
    const slot = TYPE_LAYER[n.type] ?? 5
    if (!layerMap.has(slot)) layerMap.set(slot, [])
    layerMap.get(slot)!.push(n.id)
  })

  const sortedLayers = [...layerMap.keys()].sort((a, b) => a - b)
  const maxLayer = sortedLayers[sortedLayers.length - 1] ?? 0

  let maxNodesInLayer = 0
  layerMap.forEach((ids) => {
    maxNodesInLayer = Math.max(maxNodesInLayer, ids.length)
  })

  const canvasWidth = Math.max(
    900,
    PADDING_X * 2 + maxNodesInLayer * NODE_W + (maxNodesInLayer - 1) * H_GAP
  )
  const canvasHeight = PADDING_Y * 2 + (maxLayer + 1) * (NODE_H + V_GAP)

  const positions = new Map<string, { x: number; y: number }>()

  // Assign x positions for a layer given its current ordering
  const placeLayer = (layerIdx: number) => {
    const ids = layerMap.get(layerIdx)!
    const y = PADDING_Y + layerIdx * (NODE_H + V_GAP)
    const totalW = ids.length * NODE_W + (ids.length - 1) * H_GAP
    const startX = (canvasWidth - totalW) / 2
    ids.forEach((id, i) => {
      positions.set(id, { x: startX + i * (NODE_W + H_GAP), y })
    })
  }

  // Barycenter: average x-center of all currently-positioned neighbors.
  // Nodes with no positioned neighbors fall back to canvas midpoint.
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

  // ── Phase 1: initial top-down pass ──────────────────────────────────────────
  // Gives every node a starting position so the up-pass has something to work with.
  for (const layerIdx of sortedLayers) {
    if (layerIdx > 0) sortLayer(layerIdx)
    placeLayer(layerIdx)
  }

  // ── Phase 2: alternating up/down sweeps (Sugiyama barycenter) ───────────────
  // Each sweep re-sorts using positions from the previous step, pulling nodes
  // toward the centroid of ALL their neighbors — not just those above them.
  // This lets cross-layer connections (e.g. tables ↔ code) influence ordering.
  const ITERATIONS = 4
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Up sweep — sort from bottom layer toward root, using lower-neighbor positions
    for (let i = sortedLayers.length - 2; i >= 0; i--) {
      sortLayer(sortedLayers[i])
      placeLayer(sortedLayers[i])
    }
    // Down sweep — sort from root toward bottom, using upper-neighbor positions
    for (let i = 1; i < sortedLayers.length; i++) {
      sortLayer(sortedLayers[i])
      placeLayer(sortedLayers[i])
    }
  }

  return { positions, canvasWidth, canvasHeight, layerCount: sortedLayers.length }
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ProjectGraph({
  project,
  nodes,
  edges,
  alerts,
  layerFilters,
  onNodeSelect,
  onNodeOpen,
  onLayerToggle,
  onSearch,
  onFitToScreen,
  onGoToMonitoring,
}: ProjectGraphProps) {
  const [activeTypes, setActiveTypes] = useState<Set<NodeType>>(
    () => new Set(layerFilters.filter((f) => f.enabled).map((f) => f.type))
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [highlightDepth, setHighlightDepth] = useState<1 | 2>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [transform, setTransform] = useState({ x: 40, y: 24, scale: 0.75 })
  const [explainPaneOpen, setExplainPaneOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, startTX: 0, startTY: 0 })
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const layout = useMemo(() => computeLayout(project, nodes, edges), [project, nodes, edges])

  // All nodes as a stable array
  const allNodes = useMemo(() => [project, ...nodes], [project, nodes])

  // Fit to screen on mount
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

  // Selected node connections (BFS up to highlightDepth hops)
  const selectedConnections = useMemo(() => {
    if (!selectedNodeId) return { nodes: new Set<string>(), edges: new Set<string>() }
    const connNodes = new Set<string>([selectedNodeId])
    const connEdges = new Set<string>()
    for (let d = 0; d < highlightDepth; d++) {
      const frontier = new Set(connNodes)
      edges.forEach((e) => {
        if (frontier.has(e.source) || frontier.has(e.target)) {
          connNodes.add(e.source)
          connNodes.add(e.target)
          connEdges.add(e.id)
        }
      })
    }
    return { nodes: connNodes, edges: connEdges }
  }, [selectedNodeId, edges, highlightDepth])

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()
    const q = searchQuery.toLowerCase()
    const matches = new Set<string>()
    allNodes.forEach((n) => {
      if (n.label.toLowerCase().includes(q)) matches.add(n.id)
    })
    return matches
  }, [searchQuery, allNodes])

  // Visible node ids
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>([project.id])
    nodes.forEach((n) => {
      if (activeTypes.has(n.type)) ids.add(n.id)
    })
    return ids
  }, [project.id, nodes, activeTypes])

  // Which layer slots are currently populated (for separator + label rendering)
  const activeLayers = useMemo(() => {
    const slots = new Set<number>()
    allNodes.forEach((n) => {
      if (visibleNodeIds.has(n.id)) slots.add(TYPE_LAYER[n.type] ?? 5)
    })
    return [...slots].sort((a, b) => a - b)
  }, [allNodes, visibleNodeIds])

  // Currently selected node object
  const selectedNode = useMemo(
    () => allNodes.find((n) => n.id === selectedNodeId) ?? null,
    [allNodes, selectedNodeId]
  )

  // Connected nodes for the explain panel (depth-1, both directions)
  const panelConnectedNodes = useMemo(() => {
    if (!selectedNodeId) return []
    const connIds = new Set<string>()
    edges.forEach((e) => {
      if (e.source === selectedNodeId) connIds.add(e.target)
      if (e.target === selectedNodeId) connIds.add(e.source)
    })
    return allNodes.filter((n) => connIds.has(n.id))
  }, [selectedNodeId, allNodes, edges])

  // Alerts for the explain panel
  const panelNodeAlerts = useMemo(
    () => alerts.filter((a) => a.nodeId === selectedNodeId),
    [selectedNodeId, alerts]
  )

  // Screen-space anchor for the action menu (follows node on pan/zoom)
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
    setExplainPaneOpen(false)
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

  // Zoom/pan to fit the selected node's neighborhood
  const handleExplore = useCallback(
    (nodeId: string) => {
      setHighlightDepth(2)
      const connIds = new Set<string>([nodeId])
      edges.forEach((e) => {
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
    [edges, layout.positions]
  )

  // Pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-node]')) return
      dragState.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startTX: transform.x,
        startTY: transform.y,
      }
    },
    [transform.x, transform.y]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return
      setTransform((prev) => ({
        ...prev,
        x: dragState.current.startTX + (e.clientX - dragState.current.startX),
        y: dragState.current.startTY + (e.clientY - dragState.current.startY),
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

  // ─── Edge renderer ─────────────────────────────────────────────────────────

  const renderEdges = () => {
    return edges.map((edge) => {
      if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return null
      const src = layout.positions.get(edge.source)
      const tgt = layout.positions.get(edge.target)
      if (!src || !tgt) return null

      const srcX = src.x + NODE_W / 2
      const srcY = src.y + NODE_H
      const tgtX = tgt.x + NODE_W / 2
      const tgtY = tgt.y
      const cp = Math.abs(tgtY - srcY) * 0.42

      const d = `M ${srcX} ${srcY} C ${srcX} ${srcY + cp} ${tgtX} ${tgtY - cp} ${tgtX} ${tgtY}`

      const isAlerted = edge.hasAlert || alertedEdgeIds.has(edge.id)
      const isConnected = selectedConnections.edges.has(edge.id)
      const isDimmed = !!selectedNodeId && !isConnected

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

      return (
        <path
          key={edge.id}
          d={d}
          fill="none"
          strokeWidth={isAlerted || isConnected ? 2 : 1.5}
          strokeLinecap="round"
          className={`transition-all duration-150 ${strokeClass}`}
        />
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
              {/* Lane separator lines — solid, colored per entity type */}
              {activeLayers.slice(1).map((layerIdx) => {
                const sepY = PADDING_Y + layerIdx * (NODE_H + V_GAP) - V_GAP / 2
                const meta = LAYER_META[layerIdx]
                return (
                  <line
                    key={`sep-${layerIdx}`}
                    x1={0}
                    y1={sepY}
                    x2={layout.canvasWidth}
                    y2={sepY}
                    strokeWidth={1.5}
                    className={meta?.sepClass ?? 'stroke-slate-300 dark:stroke-slate-600'}
                  />
                )
              })}

              {/* Lane labels — both sides, 11px monospace */}
              {activeLayers.map((layerIdx) => {
                const meta = LAYER_META[layerIdx]
                if (!meta) return null
                const labelY = PADDING_Y + layerIdx * (NODE_H + V_GAP) + NODE_H / 2
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
            </svg>

            {/* HTML node layer */}
            {allNodes.map((node) => {
              if (!visibleNodeIds.has(node.id)) return null
              const pos = layout.positions.get(node.id)
              if (!pos) return null

              const isSelected = node.id === selectedNodeId
              const isHighlighted = !!selectedNodeId && selectedConnections.nodes.has(node.id)
              const isDimmed = !!selectedNodeId && !selectedConnections.nodes.has(node.id)
              const isSearchMatch = searchMatches.has(node.id)

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

          {/* Floating action menu — screen space, anchored below selected node */}
          {actionMenuAnchor && selectedNode && (
            <NodeActionMenu
              anchor={actionMenuAnchor}
              node={selectedNode}
              onGoTo={() => onNodeOpen?.(selectedNode.id)}
              onExplain={() => setExplainPaneOpen(true)}
              onExplore={() => handleExplore(selectedNode.id)}
              onGoToMonitoring={() => onGoToMonitoring?.(selectedNode.id)}
            />
          )}
        </div>

        {/* Explain panel — slides in from the right */}
        {explainPaneOpen && selectedNode && (
          <NodeExplainPanel
            node={selectedNode}
            connectedNodes={panelConnectedNodes}
            nodeAlerts={panelNodeAlerts}
            onClose={() => setExplainPaneOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
