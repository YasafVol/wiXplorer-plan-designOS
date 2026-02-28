import { useState } from 'react'
import { ChevronDown, ChevronRight, Database } from 'lucide-react'
import { Badge } from '@/features/project-intelligence/components/shared/Badge'
import type { NodeRef, ProjectTree } from '@/features/project-intelligence/types'

interface ConnectionListProps {
  currentNodeId: string
  tree: ProjectTree
  connections: NodeRef[]
  onNodeSelect: (nodeId: string) => void
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
  connection: NodeRef
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

  return (
    <div className="space-y-2">
      {connections.map((connection) => {
        const connectionRoot = topLevelAncestorId(tree, connection.id)
        const isCrossZone = Boolean(currentRoot && connectionRoot && currentRoot !== connectionRoot)

        return (
          <ConnectionRow
            key={connection.id}
            connection={connection}
            isCrossZone={isCrossZone}
            tree={tree}
            onNodeSelect={onNodeSelect}
          />
        )
      })}
    </div>
  )
}
