import { X } from 'lucide-react'
import type { InspectorDetailTab, ProjectNode } from '@/features/project-intelligence/types'

interface InspectorDetailViewProps {
  node: ProjectNode
  activeTab: InspectorDetailTab
  onChangeTab: (tab: InspectorDetailTab) => void
  onClose: () => void
}

const TABS: Array<{ id: InspectorDetailTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'schema', label: 'Schema/Preview' },
  { id: 'code', label: 'Code' },
  { id: 'history', label: 'History' },
]

export function InspectorDetailView({ node, activeTab, onChangeTab, onClose }: InspectorDetailViewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4">
      <div className="mx-auto h-full max-w-5xl overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700 dark:bg-stone-900">
        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Detail View</p>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{node.label}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <X className="h-3 w-3" />
            Close
          </button>
        </header>
        <div className="flex h-[calc(100%-57px)]">
          <nav className="w-44 shrink-0 border-r border-stone-200 p-2 dark:border-stone-700">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`mb-1 w-full rounded px-2 py-1.5 text-left text-xs font-medium ${
                  activeTab === tab.id
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <section className="min-w-0 flex-1 overflow-y-auto p-4">
            {activeTab === 'overview' ? (
              <p className="text-sm text-stone-700 dark:text-stone-200">{node.description ?? 'No description available yet.'}</p>
            ) : null}
            {activeTab === 'configuration' ? (
              <pre className="rounded bg-stone-100 p-3 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                {JSON.stringify(node.metadata, null, 2)}
              </pre>
            ) : null}
            {activeTab === 'schema' ? (
              <p className="text-sm text-stone-700 dark:text-stone-200">Schema and typed surface preview appears here in Phase 2 wiring.</p>
            ) : null}
            {activeTab === 'code' ? (
              <div className="space-y-2">
                {node.files.length === 0 ? (
                  <p className="text-sm text-stone-700 dark:text-stone-200">No linked implementation files.</p>
                ) : (
                  node.files.map((filePath) => (
                    <p key={filePath} className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-700 dark:border-stone-700 dark:text-stone-200">
                      {filePath}
                    </p>
                  ))
                )}
              </div>
            ) : null}
            {activeTab === 'history' ? (
              <div className="space-y-2">
                {node.editHistory.length === 0 ? (
                  <p className="text-sm text-stone-700 dark:text-stone-200">No history entries.</p>
                ) : (
                  node.editHistory.map((event, index) => (
                    <div key={`${event.timestamp}-${index}`} className="rounded border border-stone-200 p-2 dark:border-stone-700">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">{event.commitMessage}</p>
                      <p className="text-xs text-stone-600 dark:text-stone-300">{event.author}</p>
                      <p className="text-sm text-stone-700 dark:text-stone-200">{event.change}</p>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
