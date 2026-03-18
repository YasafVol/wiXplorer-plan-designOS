import { useEffect, useMemo, useRef, useState } from 'react'
import { buildCanonicalTreeProjection } from '@/features/project-intelligence/lib/displayTree'
import type { CanonicalTreeNode } from '@/features/project-intelligence/lib/displayTree'
import { TreeNode } from '@/features/project-intelligence/components/tree/TreeNode'
import type { TreeLayoutNode, TreeNodeVariant } from '@/features/project-intelligence/components/tree/TreeNode'
import type { ProjectTree } from '@/features/project-intelligence/types'

interface TreeChartProps {
  tree: ProjectTree
  selectedNodeId: string | null
  variant: TreeNodeVariant
  onNodeClick: (nodeId: string) => void
}

interface TreeBranch {
  id: string
  d: string
}

interface RootHub {
  x: number
  y: number
}

const INDENT_X = 220
const ROW_HEIGHT = 46
const PADDING_X = 52
const PADDING_Y = 40
const CONNECTOR_X_OFFSET = 0
const CONNECTOR_Y_OFFSET = 0

function buildTreeLayout(tree: ProjectTree, collapsedNodeIds: ReadonlySet<string>): {
  nodes: TreeLayoutNode[]
  branches: TreeBranch[]
  rootBranches: TreeBranch[]
  rootHub: RootHub | null
  visibleIds: Set<string>
  svgWidth: number
  svgHeight: number
} {
  const root = buildCanonicalTreeProjection(tree, collapsedNodeIds)
  const nodes: TreeLayoutNode[] = []
  const visibleIds = new Set<string>()
  const topLevelIds: string[] = []
  let row = 0
  let maxDepth = 0

  const walk = (treeNode: CanonicalTreeNode) => {
    const isCollapsed = collapsedNodeIds.has(treeNode.id)
    const y = PADDING_Y + row * ROW_HEIGHT
    const x = PADDING_X + treeNode.depth * INDENT_X
    row += 1
    maxDepth = Math.max(maxDepth, treeNode.depth)
    visibleIds.add(treeNode.id)

    nodes.push({
      id: treeNode.id,
      label: treeNode.node.label,
      type: treeNode.node.type,
      status: treeNode.node.healthStatus ?? treeNode.node.status,
      depth: treeNode.depth,
      parentId: treeNode.parentId,
      x,
      y,
      hasChildren: treeNode.canonicalChildCount > 0,
      isCollapsed,
      isShared: treeNode.isShared,
      sharedParentCount: treeNode.sharedParentCount,
    })

    if (treeNode.parentId === null) {
      topLevelIds.push(treeNode.id)
    }

    for (const child of treeNode.children) {
      walk(child)
    }
  }

  root.children.forEach(walk)

  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]))
  const branches: TreeBranch[] = []
  for (const node of nodes) {
    if (!node.parentId) continue
    const parent = nodeById[node.parentId]
    if (!parent) continue
    const fromX = parent.x + CONNECTOR_X_OFFSET
    const fromY = parent.y + CONNECTOR_Y_OFFSET
    const toX = node.x + CONNECTOR_X_OFFSET
    const toY = node.y + CONNECTOR_Y_OFFSET
    branches.push({
      id: `${parent.id}->${node.id}`,
      d: `M ${fromX} ${fromY} C ${fromX + 20} ${fromY}, ${toX - 20} ${toY}, ${toX} ${toY}`,
    })
  }

  let rootHub: RootHub | null = null
  const rootBranches: TreeBranch[] = []
  if (topLevelIds.length > 0) {
    const topLevelYs = topLevelIds
      .map((id) => nodeById[id])
      .filter((node): node is TreeLayoutNode => Boolean(node))
      .map((node) => node.y + CONNECTOR_Y_OFFSET)
    const hubX = PADDING_X - 20
    const hubY = topLevelYs.reduce((sum, value) => sum + value, 0) / topLevelYs.length
    rootHub = { x: hubX, y: hubY }

    for (const id of topLevelIds) {
      const node = nodeById[id]
      if (!node) continue
      const toX = node.x + CONNECTOR_X_OFFSET
      const toY = node.y + CONNECTOR_Y_OFFSET
      rootBranches.push({
        id: `root->${id}`,
        d: `M ${hubX} ${hubY} C ${hubX + 20} ${hubY}, ${toX - 20} ${toY}, ${toX} ${toY}`,
      })
    }
  }

  const svgWidth = Math.max(PADDING_X * 2 + (maxDepth + 1) * INDENT_X + 320, 720)
  const svgHeight = Math.max(PADDING_Y * 2 + row * ROW_HEIGHT, 220)

  return { nodes, branches, rootBranches, rootHub, visibleIds, svgWidth, svgHeight }
}

function getVisibleSelectionId(
  tree: ProjectTree,
  selectedNodeId: string | null,
  visibleIds: ReadonlySet<string>,
): string | null {
  if (!selectedNodeId) return null
  if (visibleIds.has(selectedNodeId)) return selectedNodeId

  let cursor = tree.nodesById[selectedNodeId]
  while (cursor) {
    const parentId = cursor.parentIds[0]
    if (!parentId) return null
    if (visibleIds.has(parentId)) return parentId
    cursor = tree.nodesById[parentId]
  }

  return null
}

export function TreeChart({ tree, selectedNodeId, variant, onNodeClick }: TreeChartProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const target = wrapRef.current
    if (!target) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setContainerWidth(Math.floor(entry.contentRect.width))
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const { nodes, branches, rootBranches, rootHub, visibleIds, svgWidth, svgHeight } = useMemo(
    () => buildTreeLayout(tree, collapsedNodeIds),
    [tree, collapsedNodeIds],
  )
  const effectiveSelectedId = useMemo(
    () => getVisibleSelectionId(tree, selectedNodeId, visibleIds),
    [tree, selectedNodeId, visibleIds],
  )
  const focusNodeIds = useMemo(() => {
    if (variant !== 'focus-mode' || !effectiveSelectedId) return null

    const childrenById = new Map<string, string[]>()
    for (const node of nodes) {
      const parentId = node.parentId
      if (!parentId) continue
      const list = childrenById.get(parentId)
      if (list) list.push(node.id)
      else childrenById.set(parentId, [node.id])
    }

    const focusSet = new Set<string>()
    let cursorId: string | null = effectiveSelectedId
    while (cursorId) {
      focusSet.add(cursorId)
      const parentId = nodes.find((node) => node.id === cursorId)?.parentId ?? null
      cursorId = parentId
    }

    const stack = [effectiveSelectedId]
    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) continue
      focusSet.add(current)
      const children = childrenById.get(current) ?? []
      for (const child of children) {
        if (!focusSet.has(child)) stack.push(child)
      }
    }

    return focusSet
  }, [nodes, effectiveSelectedId, variant])

  return (
    <div ref={wrapRef} className="h-full w-full overflow-auto bg-[var(--pi-color-bg)]">
      <svg width={Math.max(svgWidth, containerWidth)} height={svgHeight} className="min-h-full min-w-full">
        {rootBranches.map((branch) => (
          <path
            key={branch.id}
            d={branch.d}
            fill="none"
            stroke="rgba(148,163,184,0.55)"
            strokeWidth={1.4}
          />
        ))}
        {branches.map((branch) => (
          <path
            key={branch.id}
            d={branch.d}
            fill="none"
            stroke="rgba(100,116,139,0.45)"
            strokeWidth={1.2}
          />
        ))}
        {rootHub ? (
          <g transform={`translate(${rootHub.x}, ${rootHub.y})`}>
            <circle r={4.5} fill="var(--pi-color-level1)" />
          </g>
        ) : null}

        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            selected={effectiveSelectedId === node.id}
            muted={variant === 'focus-mode' && focusNodeIds ? !focusNodeIds.has(node.id) : false}
            onSelect={onNodeClick}
            onToggleCollapse={(nodeId) =>
              setCollapsedNodeIds((prev) => {
                const next = new Set(prev)
                if (next.has(nodeId)) {
                  next.delete(nodeId)
                } else {
                  next.add(nodeId)
                }
                return next
              })
            }
          />
        ))}
      </svg>
    </div>
  )
}
