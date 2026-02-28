import { X } from 'lucide-react'
import type { ProjectNode } from '@/features/project-intelligence/types'

interface BlameViewProps {
  node: ProjectNode
  onClose: () => void
}

function formatRelative(iso: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return 'just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

export function BlameView({ node, onClose }: BlameViewProps) {
  const history = [...node.editHistory].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  return (
    <section className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-900">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Change History</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <X className="h-3 w-3" />
          Close
        </button>
      </header>
      <div className="space-y-3 p-4">
        {history.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">No edit history recorded yet.</p>
        ) : (
          history.map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="rounded-md border border-stone-200 p-3 dark:border-stone-700">
              <div className="mb-1 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span title={event.timestamp}>{formatRelative(event.timestamp)}</span>
                <span>·</span>
                <span>{event.author}</span>
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-200">{event.change}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
