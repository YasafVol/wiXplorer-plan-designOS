import { useEffect, useMemo, useRef, useState } from 'react'
import { CirclePackingNode } from '@/features/project-intelligence/components/circle-packing/CirclePackingNode'
import {
  useCirclePackingLayout,
  type CirclePackingLayoutNode,
} from '@/features/project-intelligence/components/circle-packing/useCirclePackingLayout'
import type { ProjectTree } from '@/features/project-intelligence/types'

interface CirclePackingChartProps {
  tree: ProjectTree
  selectedNodeId: string | null
  zoomRootId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeDoubleClick: (nodeId: string) => void
  onZoomOut: () => void
}

interface ViewWindow {
  x: number
  y: number
  r: number
}

interface RenderedCircleNode {
  node: CirclePackingLayoutNode
  cx: number
  cy: number
  radius: number
  selected: boolean
}

interface TitleChipLayout {
  id: string
  nodeId: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

const ANIMATION_MS = 300
const EASING = (t: number) => 1 - (1 - t) ** 3
const CHIP_HEIGHT = 20

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function truncateChipLabel(label: string, maxWidth: number) {
  const maxChars = Math.max(5, Math.floor((maxWidth - 14) / 6.8))
  if (label.length <= maxChars) return label
  return `${label.slice(0, Math.max(1, maxChars - 1))}…`
}

function interpolate(from: ViewWindow, to: ViewWindow, t: number): ViewWindow {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    r: from.r + (to.r - from.r) * t,
  }
}

export function CirclePackingChart({
  tree,
  selectedNodeId,
  zoomRootId,
  onNodeClick,
  onNodeDoubleClick,
  onZoomOut,
}: CirclePackingChartProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const viewRef = useRef<ViewWindow | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState<ViewWindow | null>(null)

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    const target = wrapRef.current
    if (!target) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      })
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const { nodes, breadcrumb, rootId } = useCirclePackingLayout(tree, zoomRootId, size.width, size.height - (zoomRootId ? 36 : 0))
  const nodeById = useMemo(
    () => new Map<string, CirclePackingLayoutNode>(nodes.map((node) => [node.id, node])),
    [nodes],
  )
  const childIdsByParentId = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const node of nodes) {
      if (!node.parentId) continue
      const bucket = map.get(node.parentId)
      if (bucket) bucket.push(node.id)
      else map.set(node.parentId, [node.id])
    }
    return map
  }, [nodes])
  const focusId = zoomRootId && nodeById.has(zoomRootId) ? zoomRootId : rootId
  const focusNode = nodeById.get(focusId) ?? null
  const visibleNodeIds = useMemo(() => {
    if (!focusNode) return new Set<string>()
    const visible = new Set<string>([focusNode.id])
    const children = childIdsByParentId.get(focusNode.id) ?? []
    for (const childId of children) visible.add(childId)

    const allowGrandchildren = Boolean(zoomRootId) && children.length <= 8
    if (allowGrandchildren) {
      let grandchildCount = 0
      for (const childId of children) {
        const grandchildren = childIdsByParentId.get(childId) ?? []
        for (const grandchildId of grandchildren) {
          visible.add(grandchildId)
          grandchildCount += 1
          if (grandchildCount >= 20) break
        }
        if (grandchildCount >= 20) break
      }
    }

    return visible
  }, [focusNode, childIdsByParentId, zoomRootId])
  const breadcrumbNodes = useMemo(() => breadcrumb.map((id) => tree.nodesById[id]).filter(Boolean), [breadcrumb, tree])

  useEffect(() => {
    if (!focusNode) return
    const targetView = { x: focusNode.x, y: focusNode.y, r: Math.max(focusNode.r, 1) }

    if (!viewRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        setView(targetView)
        animationFrameRef.current = null
      })
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    }

    const from = viewRef.current
    const to = targetView
    const start = performance.now()

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / ANIMATION_MS, 1)
      setView(interpolate(from, to, EASING(progress)))

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick)
      } else {
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [focusNode])

  const chartHeight = Math.max(size.height - (zoomRootId ? 36 : 0), 0)
  const viewport = useMemo(
    () => view ?? (focusNode ? { x: focusNode.x, y: focusNode.y, r: Math.max(focusNode.r, 1) } : null),
    [view, focusNode],
  )
  const scale = viewport ? Math.max(1, (Math.min(size.width, size.height) - 24) / (viewport.r * 2)) : 1
  const renderedNodes = useMemo<RenderedCircleNode[]>(() => {
    if (!viewport || chartHeight <= 0) return []

    const result: RenderedCircleNode[] = []
    for (const node of nodes) {
      if (node.id === rootId) continue
      if (!visibleNodeIds.has(node.id)) continue

      const cx = (node.x - viewport.x) * scale + size.width / 2
      const cy = (node.y - viewport.y) * scale + chartHeight / 2
      const radius = node.r * scale
      if (radius < 2) continue

      const inBounds = cx + radius >= -40 && cy + radius >= -40 && cx - radius <= size.width + 40 && cy - radius <= chartHeight + 40
      if (!inBounds) continue

      result.push({
        node,
        cx,
        cy,
        radius,
        selected: selectedNodeId === node.id,
      })
    }

    return result
  }, [chartHeight, nodes, rootId, scale, selectedNodeId, size.width, viewport, visibleNodeIds])
  const titleChips = useMemo<TitleChipLayout[]>(() => {
    const higherOrderNodes = renderedNodes
      .filter(({ node, radius }) => node.depth <= 2 && radius >= 20)
      .sort((a, b) => a.cy - b.cy)

    const placed: TitleChipLayout[] = []
    for (const entry of higherOrderNodes) {
      const maxWidth = clamp(entry.radius * 1.5, 70, 180)
      const label = truncateChipLabel(entry.node.label, maxWidth)
      const chipWidth = clamp(label.length * 6.8 + 14, 70, maxWidth)
      let x = clamp(entry.cx, chipWidth / 2 + 6, size.width - chipWidth / 2 - 6)
      let y = clamp(entry.cy - entry.radius + 14, CHIP_HEIGHT / 2 + 4, chartHeight - CHIP_HEIGHT / 2 - 4)

      for (const prev of placed) {
        const overlapX = Math.abs(x - prev.x) < (chipWidth + prev.width) / 2
        const overlapY = Math.abs(y - prev.y) < (CHIP_HEIGHT + prev.height) / 2 + 2
        if (overlapX && overlapY) {
          y = prev.y + (CHIP_HEIGHT + prev.height) / 2 + 2
        }
      }

      y = clamp(y, CHIP_HEIGHT / 2 + 4, chartHeight - CHIP_HEIGHT / 2 - 4)
      x = clamp(x, chipWidth / 2 + 6, size.width - chipWidth / 2 - 6)
      placed.push({
        id: `chip-${entry.node.id}`,
        nodeId: entry.node.id,
        label,
        x,
        y,
        width: chipWidth,
        height: CHIP_HEIGHT,
      })
    }

    return placed
  }, [chartHeight, renderedNodes, size.width])

  return (
    <div ref={wrapRef} className="flex h-full flex-col overflow-hidden bg-white text-black">
      {zoomRootId ? (
        <div className="flex h-9 items-center gap-1 border-b border-black/10 bg-white px-3 text-xs">
          <button type="button" onClick={onZoomOut} className="font-medium text-black/70 hover:underline">
            {tree.meta.projectName}
          </button>
          {breadcrumbNodes.map((crumb) => (
            <div key={crumb.id} className="inline-flex items-center gap-1">
              <span className="text-black/35">/</span>
              <button
                type="button"
                onClick={() => onNodeDoubleClick(crumb.id)}
                className="text-black/70 hover:underline"
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <svg
        className="h-full w-full bg-white"
        onClick={() => {
          if (zoomRootId) onZoomOut()
        }}
      >
        <defs>
          <pattern id="pi-circle-diagonal-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="hsl(0 0% 92%)" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(0,0,0,0.14)" strokeWidth="2" />
          </pattern>
        </defs>
        {renderedNodes.map(({ node, cx, cy, radius, selected }) => (
          <CirclePackingNode
            key={node.id}
            node={node}
            cx={cx}
            cy={cy}
            radius={radius}
            selected={selected}
            suppressInlineLabel={node.depth <= 2}
            onActivate={(nodeId) => {
              onNodeClick(nodeId)
              if (nodeId !== focusId) onNodeDoubleClick(nodeId)
            }}
          />
        ))}
        {titleChips.map((chip) => (
          <g key={chip.id} pointerEvents="none" transform={`translate(${chip.x}, ${chip.y})`}>
            <rect
              x={-chip.width / 2}
              y={-chip.height / 2}
              width={chip.width}
              height={chip.height}
              rx={8}
              fill="rgba(255,255,255,0.96)"
              stroke="rgba(0,0,0,0.34)"
              strokeWidth={1}
            />
            <text fill="#111111" fontSize={11} fontWeight={600} textAnchor="middle" dominantBaseline="middle">
              {chip.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
