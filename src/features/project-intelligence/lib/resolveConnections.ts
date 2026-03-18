import type { ConnectionRelation, NodeConnection, NodeRef, ProjectIndexNode, RawNodeConnection } from '@/features/project-intelligence/types'

export function toNodeRef(node: ProjectIndexNode): NodeRef {
  return {
    id: node.id,
    label: node.label,
    type: node.type,
  }
}

function normalizeRelation(value: string | undefined): ConnectionRelation {
  switch ((value ?? '').trim()) {
    case 'reads':
    case 'writes':
    case 'calls':
    case 'read-by':
    case 'written-by':
    case 'called-by':
    case 'surfaces-on':
    case 'hosted-by':
      return value as ConnectionRelation
    default:
      return 'calls'
  }
}

export function resolveNodeRefs(ids: string[], nodesById: Record<string, ProjectIndexNode>): NodeRef[] {
  return ids
    .map((id) => nodesById[id])
    .filter((node): node is ProjectIndexNode => Boolean(node))
    .map(toNodeRef)
}

export function resolveNodeConnections(
  rawConnections: Array<string | RawNodeConnection>,
  nodesById: Record<string, ProjectIndexNode>,
): NodeConnection[] {
  return rawConnections.flatMap((entry) => {
    const targetId = typeof entry === 'string' ? entry : entry.targetId ?? entry.id
    if (!targetId) return []
    const target = nodesById[targetId]
    if (!target) return []
    const connection: NodeConnection = {
      id: target.id,
      label: target.label,
      type: target.type,
      relation: normalizeRelation(typeof entry === 'string' ? undefined : entry.relation),
      context: typeof entry === 'string' ? undefined : entry.context,
    }
    return [connection]
  })
}
