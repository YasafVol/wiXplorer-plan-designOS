import { useState } from 'react'
import { ChevronDown, ChevronRight, Database } from 'lucide-react'
import { Badge } from '@/features/project-intelligence/components/shared/Badge'
import type { ConnectionRelation, NodeConnection, ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

interface ConnectionListProps {
  currentNodeId: string
  tree: ProjectTree
  connections: NodeConnection[]
  onNodeSelect: (nodeId: string) => void
}

const OUTWARD_RELATIONS: ConnectionRelation[] = ['reads', 'writes', 'calls']
const INWARD_RELATIONS: ConnectionRelation[] = ['read-by', 'written-by', 'called-by', 'surfaces-on', 'hosted-by']

function isOutwardRelation(relation: ConnectionRelation) {
  return OUTWARD_RELATIONS.includes(relation)
}

function relationLabel(relation: ConnectionRelation): string {
  switch (relation) {
    case 'reads':
      return 'reads from'
    case 'writes':
      return 'writes to'
    case 'calls':
      return 'calls'
    case 'read-by':
      return 'read by'
    case 'written-by':
      return 'written by'
    case 'called-by':
      return 'called by'
    case 'surfaces-on':
      return 'surfaces on'
    case 'hosted-by':
      return 'hosted by'
    default:
      return relation
  }
}

function invertRelation(relation: ConnectionRelation): ConnectionRelation {
  switch (relation) {
    case 'reads':
      return 'read-by'
    case 'writes':
      return 'written-by'
    case 'calls':
      return 'called-by'
    case 'read-by':
      return 'reads'
    case 'written-by':
      return 'writes'
    case 'called-by':
      return 'calls'
    case 'surfaces-on':
      return 'hosted-by'
    case 'hosted-by':
      return 'surfaces-on'
    default:
      return 'called-by'
  }
}

function topLevelAncestorId(tree: ProjectTree, nodeId: string): string | null {
  let cursor = tree.nodesById[nodeId]
  if (!cursor) return null
  while (cursor.parentIds.length > 0) {
    const next = tree.nodesById[cursor.parentIds[0]]
    if (!next) break
    cursor = next
  }
  return cursor.id
}

function ConnectionRow({
  connection,
  isCrossZone,
  tree,
  onNodeSelect,
}: {
  connection: NodeConnection
  isCrossZone: boolean
  tree: ProjectTree
  onNodeSelect: (nodeId: string) => void
}) {
  const [schemaOpen, setSchemaOpen] = useState(false)
  const isCollection = connection.type === 'collection'
  const connectedNode = tree.nodesById[connection.id]
  const schema = isCollection ? String(connectedNode?.metadata?.schemaSummary ?? '') : ''

  return (
    <div className="rounded-md border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
      <button
        type="button"
        onClick={() => onNodeSelect(connection.id)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-xs text-stone-700 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-500 dark:text-stone-200 dark:hover:bg-stone-800 dark:focus-visible:ring-stone-300"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold underline underline-offset-2">{connection.label}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {relationLabel(connection.relation)}
            {connection.context ? ` · ${connection.context}` : ''}
          </p>
        </div>
        <div className="shrink-0 space-x-1.5">
          <Badge label={connection.type} color="var(--pi-color-level2)" />
          {isCrossZone ? (
            <span className="rounded bg-sky-100 px-1 text-[10px] text-sky-700 dark:bg-sky-950 dark:text-sky-300">cross-zone</span>
          ) : null}
        </div>
      </button>

      {isCollection && schema ? (
        <>
          <button
            type="button"
            onClick={() => setSchemaOpen((prev) => !prev)}
            className="flex w-full items-center gap-1.5 border-t border-stone-100 px-2.5 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-700 dark:border-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          >
            <Database size={12} className="shrink-0" />
            <span>View schema</span>
            {schemaOpen ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
          </button>
          {schemaOpen ? (
            <div className="border-t border-stone-100 px-2.5 py-2 dark:border-stone-800">
              <div className="flex flex-wrap gap-1">
                {schema.split(',').map((field) => (
                  <span
                    key={field.trim()}
                    className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-600 dark:bg-stone-800 dark:text-stone-300"
                  >
                    {field.trim()}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function ConnectionList({ currentNodeId, tree, connections, onNodeSelect }: ConnectionListProps) {
  const currentRoot = topLevelAncestorId(tree, currentNodeId)
  const outwardConnections = connections.filter((connection) => isOutwardRelation(connection.relation))
  const inboundConnectionsFromTree = tree.nodes
    .filter((node) => node.id !== currentNodeId)
    .flatMap((node) => {
      const matching = node.connections.filter((connection) => connection.id === currentNodeId)
      if (matching.length === 0) return []
      return matching.map((match) => {
        const sourceNode: ProjectNode = node
        return {
          id: sourceNode.id,
          label: sourceNode.label,
          type: sourceNode.type,
          relation: invertRelation(match.relation),
          context: match.context,
        } satisfies NodeConnection
      })
    })
  const inboundConnections = [...connections.filter((connection) => INWARD_RELATIONS.includes(connection.relation)), ...inboundConnectionsFromTree]
  const dedupInboundByKey = new Set<string>()
  const uniqueInboundConnections = inboundConnections.filter((connection) => {
    const key = `${connection.id}:${connection.relation}:${connection.context ?? ''}`
    if (dedupInboundByKey.has(key)) return false
    dedupInboundByKey.add(key)
    return true
  })

  return (
    <div className="space-y-2">
      {outwardConnections.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Depends on</p>
          {outwardConnections.map((connection) => {
            const connectionRoot = topLevelAncestorId(tree, connection.id)
            const isCrossZone = Boolean(currentRoot && connectionRoot && currentRoot !== connectionRoot)
            return (
              <ConnectionRow
                key={`out-${connection.id}-${connection.relation}-${connection.context ?? ''}`}
                connection={connection}
                isCrossZone={isCrossZone}
                tree={tree}
                onNodeSelect={onNodeSelect}
              />
            )
          })}
        </div>
      ) : null}
      {uniqueInboundConnections.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Used by / surfaces on</p>
          {uniqueInboundConnections.map((connection) => {
            const connectionRoot = topLevelAncestorId(tree, connection.id)
            const isCrossZone = Boolean(currentRoot && connectionRoot && currentRoot !== connectionRoot)
            return (
              <ConnectionRow
                key={`in-${connection.id}-${connection.relation}-${connection.context ?? ''}`}
                connection={connection}
                isCrossZone={isCrossZone}
                tree={tree}
                onNodeSelect={onNodeSelect}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
