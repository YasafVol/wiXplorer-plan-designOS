interface FileQuickEditModalProps {
  filePath: string
  nodeLabel: string
  draftText: string
  onDraftChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
}

export function FileQuickEditModal({
  filePath,
  nodeLabel,
  draftText,
  onDraftChange,
  onCancel,
  onSave,
}: FileQuickEditModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900">
        <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">Quick Edit File</h3>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {nodeLabel} · <span className="font-mono">{filePath}</span>
          </p>
        </div>

        <div className="space-y-2 px-4 py-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">Draft patch (phase 1 preview)</p>
          <textarea
            value={draftText}
            onChange={(event) => onDraftChange(event.target.value)}
            className="h-56 w-full resize-y rounded-md border border-stone-300 bg-stone-50 p-3 font-mono text-xs text-stone-700 outline-none focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:focus:border-stone-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-200 px-4 py-3 dark:border-stone-700">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Save draft change
          </button>
        </div>
      </div>
    </div>
  )
}
