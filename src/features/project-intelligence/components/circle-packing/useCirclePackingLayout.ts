import { hierarchy, pack } from 'd3-hierarchy'
import { useMemo } from 'react'
import { buildBreadcrumb, buildDisplayTree, countLeaves } from '@/features/project-intelligence/lib/displayTree'
import type { DisplayTreeNode } from '@/features/project-intelligence/lib/displayTree'
import type { NodeStatus, ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

interface CircleHierarchyDatum {
  id: string
  label: string
  type: ProjectNode['type'] | 'virtual-root'
  status: NodeStatus
  description: string | null
  isMultiParent: boolean
  value: number
  children?: CircleHierarchyDatum[]
}

export interface CirclePackingLayoutNode {
  id: string
  label: string
  type: ProjectNode['type'] | 'virtual-root'
  status: NodeStatus
  description: string | null
  isMultiParent: boolean
  parentId: string | null
  childCount: number
  depth: number
  x: number
  y: number
  r: number
}

interface CirclePackingLayoutResult {
  nodes: CirclePackingLayoutNode[]
  breadcrumb: string[]
  rootId: string
}

function toDatum(displayNode: DisplayTreeNode, fallbackLabel: string): CircleHierarchyDatum {
  const node = displayNode.node
  const children = displayNode.children.map((child) => toDatum(child, fallbackLabel))
  const value = Math.max(displayNode.leafCount, 1)

  if (!node) {
    return {
      id: displayNode.id,
      label: fallbackLabel,
      type: 'virtual-root',
      status: 'healthy',
      description: null,
      isMultiParent: false,
      value,
      children,
    }
  }

  return {
    id: node.id,
    label: node.label,
    type: node.type,
    status: node.status,
    description: node.description,
    isMultiParent: node.isMultiParent,
    value,
    children,
  }
}

export function useCirclePackingLayout(
  tree: ProjectTree,
  zoomRootId: string | null,
  width: number,
  height: number,
): CirclePackingLayoutResult {
  return useMemo(() => {
    if (width <= 0 || height <= 0) {
      return { nodes: [], breadcrumb: [], rootId: '__root__' }
    }

    const displayRoot = buildDisplayTree(tree, null)
    countLeaves(displayRoot)

    const data = toDatum(displayRoot, tree.meta.projectName)
    const diameter = Math.max(40, Math.min(width, height) - 24)
    const rootHierarchy = hierarchy<CircleHierarchyDatum>(data)
      .sum((node) => Math.max(node.value ?? 1, 1))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

    const packedRoot = pack<CircleHierarchyDatum>().size([diameter, diameter]).padding(6)(rootHierarchy)
    const nodes: CirclePackingLayoutNode[] = packedRoot.descendants().map((node) => ({
      id: node.data.id,
      label: node.data.label,
      type: node.data.type,
      status: node.data.status,
      description: node.data.description,
      isMultiParent: node.data.isMultiParent,
      parentId: node.parent?.data.id ?? null,
      childCount: node.children?.length ?? 0,
      depth: node.depth,
      x: node.x,
      y: node.y,
      r: node.r,
    }))

    return {
      nodes,
      breadcrumb: buildBreadcrumb(tree, zoomRootId),
      rootId: data.id,
    }
  }, [tree, zoomRootId, width, height])
}
