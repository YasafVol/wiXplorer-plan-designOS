import { useMemo } from 'react'
import { buildBreadcrumb, buildDisplayTree, computeMaxDepth, countLeaves } from '@/features/project-intelligence/lib/displayTree'
import type { DisplayTreeNode } from '@/features/project-intelligence/lib/displayTree'
import type { ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

export interface IcicleLayoutNode {
  id: string
  label: string
  type: ProjectNode['type'] | 'virtual-root'
  status: ProjectNode['status']
  description: string | null
  isMultiParent: boolean
  depth: number
  x: number
  y: number
  width: number
  height: number
  parentId: string | null
}

export function useIcicleLayout(
  tree: ProjectTree,
  zoomRootId: string | null,
  width: number,
  height: number,
): { nodes: IcicleLayoutNode[]; breadcrumb: string[] } {
  return useMemo(() => {
    if (width <= 0 || height <= 0) {
      return { nodes: [], breadcrumb: [] }
    }

    const displayRoot = buildDisplayTree(tree, zoomRootId)
    countLeaves(displayRoot)
    const maxDepth = computeMaxDepth(displayRoot)
    const colWidth = width / Math.max(maxDepth + 1, 1)
    const rowUnit = height / Math.max(displayRoot.leafCount, 1)

    const result: IcicleLayoutNode[] = []
    let cursorY = 0

    const place = (treeNode: DisplayTreeNode, startY: number): number => {
      const h = treeNode.leafCount * rowUnit
      const x = treeNode.depth * colWidth

      if (treeNode.node) {
        result.push({
          id: treeNode.node.id,
          label: treeNode.node.label,
          type: treeNode.node.type,
          status: treeNode.node.healthStatus ?? treeNode.node.status,
          description: treeNode.node.description,
          isMultiParent: treeNode.node.isMultiParent,
          depth: treeNode.depth,
          x,
          y: startY,
          width: colWidth,
          height: h,
          parentId: treeNode.node.parentIds[0] ?? null,
        })
      }

      let nextY = startY
      for (const child of treeNode.children) {
        nextY = place(child, nextY)
      }
      return startY + h
    }

    for (const rootChild of displayRoot.children) {
      cursorY = place(rootChild, cursorY)
    }

    const breadcrumb = buildBreadcrumb(tree, zoomRootId)

    return { nodes: result, breadcrumb }
  }, [tree, zoomRootId, width, height])
}
