import type { NodeRef, ProjectIndexNode } from '@/features/project-intelligence/types'

export function toNodeRef(node: ProjectIndexNode): NodeRef {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
  }
}

export function resolveNodeRefs(ids: string[], nodesById: Record<string, ProjectIndexNode>): NodeRef[] {
  return ids
    .map((id) => nodesById[id])
    .filter((node): node is ProjectIndexNode => Boolean(node))
    .map(toNodeRef)
}
