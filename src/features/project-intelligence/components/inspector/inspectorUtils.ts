import type { NodeStatus, NodeType, ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}

export function sourceLabel(node: ProjectNode) {
  switch (node.intentSource) {
    case 'user-chat':
      return 'Created by agent'
    case 'inferred-from-code':
      return 'Inferred from code'
    case 'reconciled':
      return 'AI reconciled'
    case 'user-edited':
      return `Edited by ${node.lastModifiedBy}`
    default:
      return node.intentSource
  }
}

export function countDescendantStatus(tree: ProjectTree, node: ProjectNode, status: NodeStatus) {
  const visited = new Set<string>()
  const queue = [...node.children.map((child) => child.id)]
  let count = 0

  while (queue.length > 0) {
    const id = queue.shift()
    if (!id || visited.has(id)) continue
    visited.add(id)
    const current = tree.nodesById[id]
    if (!current) continue
    if ((current.healthStatus ?? current.status) === status) {
      count += 1
    }
    queue.push(...current.children.map((child) => child.id))
  }
  return count
}

export function categoryColor(type: NodeType) {
  switch (type) {
    case 'level1':
      return 'var(--pi-color-level1)'
    case 'level2':
      return 'var(--pi-color-level2)'
    case 'collection':
      return 'var(--pi-color-data)'
    case 'dashboard-page':
    case 'dashboard-plugin':
    case 'dashboard-modal':
    case 'menu-plugin':
      return 'var(--pi-color-dashboard)'
    case 'embedded-script':
    case 'style':
    case 'function-library':
    case 'context':
      return 'var(--pi-color-site)'
    default:
      return 'var(--pi-color-server)'
  }
}
