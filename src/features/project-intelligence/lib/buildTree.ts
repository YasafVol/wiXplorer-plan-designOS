import { resolveNodeConnections, resolveNodeRefs } from '@/features/project-intelligence/lib/resolveConnections'
import type { ParsedIntentDoc, ProjectIndex, ProjectIndexNode, ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

function buildIntentNodeMap(intentDocs: ParsedIntentDoc[]) {
  const intentNodeById = new Map<string, ParsedIntentDoc['nodesById'][string]>()
  const sourceByNodeId = new Map<string, string>()
  const collisions: Record<string, string[]> = {}

  for (const doc of intentDocs) {
    for (const [nodeId, parsedNode] of Object.entries(doc.nodesById)) {
      const existingSource = sourceByNodeId.get(nodeId)
      if (existingSource) {
        collisions[nodeId] = [existingSource, doc.sourcePath]
        continue
      }

      sourceByNodeId.set(nodeId, doc.sourcePath)
      intentNodeById.set(nodeId, parsedNode)
    }
  }

  const collisionEntries = Object.entries(collisions)
  if (collisionEntries.length > 0) {
    console.warn(
      `Markdown node id collisions detected: ${collisionEntries
        .map(([nodeId, sources]) => `${nodeId} (${sources.join(' vs ')})`)
        .join(', ')}`,
    )
  }

  return intentNodeById
}

export function buildTree(jsonIndex: ProjectIndex, intentDocs: ParsedIntentDoc[]): ProjectTree {
  const intentNodeById = buildIntentNodeMap(intentDocs)
  const indexNodesById: Record<string, ProjectIndexNode> = Object.fromEntries(
    jsonIndex.nodes.map((node) => [node.id, node]),
  )

  const nodes: ProjectNode[] = jsonIndex.nodes.map((node) => {
    const intentNode = intentNodeById.get(node.id) ?? null
    if (intentNode?.type && intentNode.type !== node.type) {
      console.warn(
        `Type mismatch for "${node.id}" (${intentNode.type} in markdown vs ${node.type} in json). Using json type.`,
      )
    }

    return {
      id: node.id,
      type: node.type,
      label: node.label,
      description: intentNode?.description ?? null,
      intentSource: node.intentSource,
      healthStatus: node.healthStatus ?? node.status,
      activationStatus: node.activationStatus ?? 'enabled',
      status: node.healthStatus ?? node.status,
      lastModified: node.lastModified,
      lastModifiedBy: node.lastModifiedBy,
      parentIds: node.parentIds,
      children: resolveNodeRefs(node.children, indexNodesById),
      connections: resolveNodeConnections(node.connections, indexNodesById),
      files: node.files,
      isMultiParent: node.isMultiParent,
      metadata: node.metadata,
      editHistory: intentNode?.editHistory ?? [],
    }
  })

  const nodesById: ProjectTree['nodesById'] = Object.fromEntries(nodes.map((node) => [node.id, node]))
  const roots = nodes.filter((node) => node.type === 'level1')
  const missingDescriptions = nodes.filter((node) => node.description === null).map((node) => node.id)

  if (missingDescriptions.length > 0) {
    console.warn(
      `Nodes missing markdown descriptions: ${missingDescriptions.length} (${missingDescriptions.join(', ')})`,
    )
  }

  return {
    meta: jsonIndex.meta,
    nodes,
    nodesById,
    roots,
  }
}
