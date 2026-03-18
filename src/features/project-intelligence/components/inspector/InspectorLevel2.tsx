import { ActionButton } from '@/features/project-intelligence/components/inspector/ActionButton'
import { ConnectionList } from '@/features/project-intelligence/components/inspector/ConnectionList'
import { Badge } from '@/features/project-intelligence/components/shared/Badge'
import { EditableText } from '@/features/project-intelligence/components/shared/EditableText'
import { formatDateTime, sourceLabel } from '@/features/project-intelligence/components/inspector/inspectorUtils'
import type { InspectorDetailTab, ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

interface InspectorLevel2Props {
  node: ProjectNode
  tree: ProjectTree
  onSelectNode: (nodeId: string) => void
  onUpdateNode: (nodeId: string, updates: Partial<Pick<ProjectNode, 'label' | 'description'>>) => void
  onOpenBlame: () => void
  onOpenDetail: (tab: InspectorDetailTab) => void
}

export function InspectorLevel2({ node, tree, onSelectNode, onUpdateNode, onOpenBlame, onOpenDetail }: InspectorLevel2Props) {
  const parentLabels = node.parentIds.map((id) => tree.nodesById[id]).filter(Boolean)
  const involvedSolutions = Array.isArray(node.metadata.involvedSolutions)
    ? (node.metadata.involvedSolutions as string[])
    : []

  return (
    <section className="space-y-5 p-4">
      <Badge label="Feature Cluster" color="var(--pi-color-level2)" size="md" />

      {node.isMultiParent ? (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Shared Across</p>
          <div className="flex flex-wrap gap-1.5">
            {parentLabels.map((parent) => (
              <button
                key={parent.id}
                type="button"
                onClick={() => onSelectNode(parent.id)}
                className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                {parent.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <EditableText
        value={node.label}
        placeholder="Untitled feature cluster"
        onSave={(value) => onUpdateNode(node.id, { label: value })}
        variant="label"
      />

      <EditableText
        value={node.description}
        placeholder="No description yet - add one"
        onSave={(value) => onUpdateNode(node.id, { description: value })}
        variant="description"
      />

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Intent Source</p>
        <span className="inline-flex rounded-full border border-stone-200 px-2 py-1 text-xs text-stone-700 dark:border-stone-700 dark:text-stone-300">
          {sourceLabel(node)}
        </span>
      </div>

      {involvedSolutions.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Involved Solutions</p>
          <div className="flex flex-wrap gap-1.5">
            {involvedSolutions.map((solution) => (
              <span
                key={solution}
                className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-200"
              >
                {solution}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Connections</p>
        <ConnectionList currentNodeId={node.id} tree={tree} connections={node.connections} onNodeSelect={onSelectNode} />
      </div>

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Last Modified</p>
        <p className="text-sm text-stone-700 dark:text-stone-200">
          {formatDateTime(node.lastModified)} · {node.lastModifiedBy}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-3 dark:border-stone-700">
        <ActionButton label="Go to Wix dashboard" stub />
        <ActionButton label="View connections" onClick={() => document.getElementById('pi-connections')?.scrollIntoView({ behavior: 'smooth' })} />
        <ActionButton label="Open detail view" onClick={() => onOpenDetail('overview')} />
        <ActionButton label="View change history" onClick={onOpenBlame} />
      </div>
    </section>
  )
}
