import type { PendingChange } from '@/features/project-intelligence/types'

interface PendingChangesReviewModalProps {
  changes: PendingChange[]
  onClose: () => void
  onRevert: (changeId: string) => void
  onJumpToNode: (nodeId: string) => void
}

function formatChangeTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString()
}

export function PendingChangesReviewModal({ changes, onClose, onRevert, onJumpToNode }: PendingChangesReviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Pending Changes</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">{changes.length} changes require publish</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {changes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 px-3 py-4 text-sm text-stone-500 dark:border-stone-600 dark:text-stone-400">
              No pending changes.
            </p>
          ) : (
            <div className="space-y-2">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className="rounded-lg border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-700 dark:bg-stone-800/40"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onJumpToNode(change.nodeId)}
                      className="text-left text-sm font-semibold text-stone-800 underline-offset-2 hover:underline dark:text-stone-100"
                    >
                      {change.nodeLabel}
                    </button>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">{formatChangeTimestamp(change.timestamp)}</span>
                  </div>

                  <div className="grid gap-1 text-xs text-stone-700 dark:text-stone-200">
                    <p>
                      <span className="font-semibold">Section:</span> {change.section}
                    </p>
                    <p>
                      <span className="font-semibold">Field:</span> {change.field}
                    </p>
                    <p>
                      <span className="font-semibold">Before:</span> {change.beforeValue}
                    </p>
                    <p>
                      <span className="font-semibold">After:</span> {change.afterValue}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onRevert(change.id)}
                      className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700"
                    >
                      Revert change
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
