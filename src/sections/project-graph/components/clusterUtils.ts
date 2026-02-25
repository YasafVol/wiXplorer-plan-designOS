import type { GraphNode, GraphEdge } from '@/../product/sections/project-graph/types'

// ─── Cluster types ─────────────────────────────────────────────────────────────

export interface ClusterNode {
  id: string          // e.g. 'cluster-page-shop'
  label: string       // root page label
  memberCount: number // total pages in this cluster
  memberLabel?: string // optional unit label, defaults to "pages"
  alertCount: number  // aggregate across all members
  memberIds: string[] // all page IDs (root + descendants)
  rootPageId: string  // root page that anchors the cluster
}

export interface BoundaryEdge {
  id: string
  source: string   // cluster ID or regular node ID
  target: string   // cluster ID or regular node ID
  types: string[]  // edge types bundled
  count: number    // number of underlying edges
  hasAlert: boolean
}

export interface ClusterProjection {
  clusters: ClusterNode[]
  collapsedMemberIds: Set<string>       // page IDs hidden by collapsed clusters
  boundaryEdges: BoundaryEdge[]         // aggregated edges to/from collapsed clusters
  clusterForMember: Map<string, string> // pageId → clusterId
}

// ─── BFS helper ───────────────────────────────────────────────────────────────

function getAllDescendants(
  rootId: string,
  childrenMap: Map<string, string[]>
): string[] {
  const result: string[] = []
  const queue = [...(childrenMap.get(rootId) ?? [])]
  const seen = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (seen.has(id)) continue
    seen.add(id)
    result.push(id)
    childrenMap.get(id)?.forEach((c) => queue.push(c))
  }
  return result
}

// ─── Main computation ─────────────────────────────────────────────────────────

/**
 * Groups pages into clusters by root-ancestor (ROUTE_PREFIX rule).
 * Only root pages that have at least one child become cluster nodes.
 * Singleton root pages remain as regular nodes.
 *
 * Returns collapsed member IDs and boundary edges for the current expand state.
 */
export function computeClusterProjection(
  allNodes: GraphNode[],
  edges: GraphEdge[],
  expandedClusterIds: Set<string>
): ClusterProjection {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]))

  // Build page parent→child tree from contains edges
  const pageChildren = new Map<string, string[]>()
  const pageParents = new Map<string, string>()

  allNodes.filter((n) => n.type === 'page').forEach((n) => pageChildren.set(n.id, []))

  edges.forEach((e) => {
    const src = nodeMap.get(e.source)
    const tgt = nodeMap.get(e.target)
    if (src?.type === 'page' && tgt?.type === 'page' && e.type === 'contains') {
      pageChildren.get(e.source)?.push(e.target)
      pageParents.set(e.target, e.source)
    }
  })

  // Root pages: page nodes with no parent
  const rootPages = allNodes.filter(
    (n) => n.type === 'page' && !pageParents.has(n.id)
  )

  // Build clusters for root pages that have descendants
  const clusters: ClusterNode[] = []
  const clusterForMember = new Map<string, string>()

  rootPages.forEach((rootPage) => {
    const descendants = getAllDescendants(rootPage.id, pageChildren)
    if (descendants.length < 2) return // fewer than 3 pages total — stay flat

    const allMembers = [rootPage.id, ...descendants]
    const clusterId = `cluster-${rootPage.id}`

    const memberAlerts = allMembers.reduce(
      (sum, id) => sum + (nodeMap.get(id)?.alertCount ?? 0),
      0
    )

    clusters.push({
      id: clusterId,
      label: rootPage.label,
      memberCount: allMembers.length,
      alertCount: memberAlerts,
      memberIds: allMembers,
      rootPageId: rootPage.id,
    })

    allMembers.forEach((id) => clusterForMember.set(id, clusterId))
  })

  // Collapsed clusters: member IDs hidden from canvas
  const collapsedMemberIds = new Set<string>()
  clusters.forEach((cluster) => {
    if (!expandedClusterIds.has(cluster.id)) {
      cluster.memberIds.forEach((id) => collapsedMemberIds.add(id))
    }
  })

  // Build boundary edges
  // For each edge: if one (or both) endpoint(s) belong to a collapsed cluster,
  // aggregate into a boundary edge keyed by (effectiveSrc, effectiveTgt).
  // Structural `contains` edges are omitted — layer hierarchy already shows containment.
  const boundaryMap = new Map<string, BoundaryEdge>()

  edges.forEach((edge) => {
    if (edge.type === 'contains') return

    const srcClusterId = clusterForMember.get(edge.source)
    const tgtClusterId = clusterForMember.get(edge.target)
    const srcCollapsed = srcClusterId != null && !expandedClusterIds.has(srcClusterId)
    const tgtCollapsed = tgtClusterId != null && !expandedClusterIds.has(tgtClusterId)

    // Internal edge (both in same collapsed cluster) — skip
    if (srcCollapsed && tgtCollapsed && srcClusterId === tgtClusterId) return

    // Regular edge (neither endpoint collapsed) — handled by normal renderer
    if (!srcCollapsed && !tgtCollapsed) return

    const effectiveSrc = srcCollapsed ? srcClusterId! : edge.source
    const effectiveTgt = tgtCollapsed ? tgtClusterId! : edge.target

    const key = `${effectiveSrc}|${effectiveTgt}`
    if (!boundaryMap.has(key)) {
      boundaryMap.set(key, {
        id: `boundary:${key}`,
        source: effectiveSrc,
        target: effectiveTgt,
        types: [],
        count: 0,
        hasAlert: false,
      })
    }
    const be = boundaryMap.get(key)!
    be.count++
    if (!be.types.includes(edge.type)) be.types.push(edge.type)
    if (edge.hasAlert) be.hasAlert = true
  })

  return {
    clusters,
    collapsedMemberIds,
    boundaryEdges: [...boundaryMap.values()],
    clusterForMember,
  }
}
