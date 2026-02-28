import type { ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

export interface DisplayTreeNode {
  id: string
  node: ProjectNode | null
  children: DisplayTreeNode[]
  leafCount: number
  depth: number
}

export interface CanonicalTreeNode {
  id: string
  node: ProjectNode
  children: CanonicalTreeNode[]
  leafCount: number
  depth: number
  parentId: string | null
  isShared: boolean
  sharedParentCount: number
  canonicalChildCount: number
}

export interface CanonicalTreeProjection {
  id: '__root__'
  children: CanonicalTreeNode[]
}

export function buildDisplayTree(
  tree: ProjectTree,
  rootId: string | null,
  collapsedNodeIds?: ReadonlySet<string>,
): DisplayTreeNode {
  const rootNode = rootId ? tree.nodesById[rootId] : null

  const walk = (node: ProjectNode, depth: number, path: Set<string>): DisplayTreeNode => {
    const nextPath = new Set(path)
    nextPath.add(node.id)
    const isCollapsed = collapsedNodeIds?.has(node.id) ?? false

    const children = isCollapsed
      ? []
      : node.children
          .map((childRef) => tree.nodesById[childRef.id])
          .filter((child): child is ProjectNode => Boolean(child))
          .filter((child) => !nextPath.has(child.id))
          .map((child) => walk(child, depth + 1, nextPath))

    return {
      id: node.id,
      node,
      children,
      leafCount: 1,
      depth,
    }
  }

  if (!rootNode) {
    return {
      id: '__root__',
      node: null,
      children: tree.roots.map((node) => walk(node, 0, new Set())),
      leafCount: 1,
      depth: 0,
    }
  }

  return walk(rootNode, 0, new Set())
}

export function buildCanonicalTreeProjection(
  tree: ProjectTree,
  collapsedNodeIds?: ReadonlySet<string>,
): CanonicalTreeProjection {
  const rootKey = '__root__'
  const canonicalParentById = new Map<string, string | null>()
  const sharedParentCountById = new Map<string, number>()
  const childIdsByParent = new Map<string, string[]>()
  childIdsByParent.set(rootKey, [])

  for (const node of tree.nodes) {
    childIdsByParent.set(node.id, [])
  }

  for (const node of tree.nodes) {
    const validParents = node.parentIds.filter((parentId) => Boolean(tree.nodesById[parentId]))
    const canonicalParentId = validParents[0] ?? null
    canonicalParentById.set(node.id, canonicalParentId)
    sharedParentCountById.set(node.id, validParents.length)

    const bucket = childIdsByParent.get(canonicalParentId ?? rootKey)
    if (bucket) {
      bucket.push(node.id)
    } else {
      childIdsByParent.set(canonicalParentId ?? rootKey, [node.id])
    }
  }

  const walk = (nodeId: string, depth: number, path: Set<string>): CanonicalTreeNode | null => {
    const node = tree.nodesById[nodeId]
    if (!node || path.has(nodeId)) return null

    const nextPath = new Set(path)
    nextPath.add(nodeId)
    const isCollapsed = collapsedNodeIds?.has(nodeId) ?? false
    const allCanonicalChildIds = childIdsByParent.get(nodeId) ?? []
    const rawChildIds = isCollapsed ? [] : allCanonicalChildIds
    const children = rawChildIds
      .map((childId) => walk(childId, depth + 1, nextPath))
      .filter((child): child is CanonicalTreeNode => Boolean(child))

    return {
      id: node.id,
      node,
      children,
      leafCount: 1,
      depth,
      parentId: canonicalParentById.get(node.id) ?? null,
      isShared: (sharedParentCountById.get(node.id) ?? 0) > 1,
      sharedParentCount: sharedParentCountById.get(node.id) ?? 0,
      canonicalChildCount: allCanonicalChildIds.length,
    }
  }

  const rootChildren = (childIdsByParent.get(rootKey) ?? [])
    .map((childId) => walk(childId, 0, new Set()))
    .filter((child): child is CanonicalTreeNode => Boolean(child))

  return {
    id: '__root__',
    children: rootChildren,
  }
}

export function countLeaves(treeNode: DisplayTreeNode): number {
  if (treeNode.children.length === 0) {
    treeNode.leafCount = 1
    return 1
  }

  const total = treeNode.children.reduce((sum, child) => sum + countLeaves(child), 0)
  treeNode.leafCount = total
  return total
}

export function computeMaxDepth(treeNode: DisplayTreeNode): number {
  if (treeNode.children.length === 0) return treeNode.depth
  return Math.max(...treeNode.children.map(computeMaxDepth))
}

export function buildBreadcrumb(tree: ProjectTree, nodeId: string | null): string[] {
  const breadcrumb: string[] = []
  if (!nodeId) return breadcrumb

  let cursor = tree.nodesById[nodeId]
  while (cursor) {
    breadcrumb.unshift(cursor.id)
    if (cursor.parentIds.length === 0) break
    cursor = tree.nodesById[cursor.parentIds[0]]
  }

  return breadcrumb
}
