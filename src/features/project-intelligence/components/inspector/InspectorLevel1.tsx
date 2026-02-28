import { ActionButton } from '@/features/project-intelligence/components/inspector/ActionButton'
import { Badge } from '@/features/project-intelligence/components/shared/Badge'
import { EditableText } from '@/features/project-intelligence/components/shared/EditableText'
import { countDescendantStatus, formatDateTime, sourceLabel } from '@/features/project-intelligence/components/inspector/inspectorUtils'
import type { ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

interface InspectorLevel1Props {
  node: ProjectNode
  tree: ProjectTree
  onUpdateNode: (nodeId: string, updates: Partial<Pick<ProjectNode, 'label' | 'description'>>) => void
  onOpenBlame: () => void
}

export function InspectorLevel1({ node, tree, onUpdateNode, onOpenBlame }: InspectorLevel1Props) {
  const warningCount = countDescendantStatus(tree, node, 'warning')
  const errorCount = countDescendantStatus(tree, node, 'error')

  return (
    <section className="space-y-5 p-4">
      <Badge label="Intent Zone" color="var(--pi-color-level1)" size="md" />

      <EditableText
        value={node.label}
        placeholder="Untitled intent zone"
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

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Health Rollup</p>
        <p className="text-sm text-stone-700 dark:text-stone-200">
          {warningCount} warnings · {errorCount} errors
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Last Modified</p>
        <p className="text-sm text-stone-700 dark:text-stone-200">
          {formatDateTime(node.lastModified)} · {node.lastModifiedBy}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-3 dark:border-stone-700">
        <ActionButton label="Edit label" onClick={() => onUpdateNode(node.id, { label: node.label })} />
        <ActionButton label="View all alerts" />
        <ActionButton label="View change history" onClick={onOpenBlame} />
      </div>
    </section>
  )
}
