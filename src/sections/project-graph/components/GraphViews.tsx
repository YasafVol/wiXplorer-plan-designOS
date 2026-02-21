import { useState } from 'react'
import { X, Bookmark, Plus, Trash2, ShoppingBag, BookOpen, BarChart3 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphView {
  id: string
  name: string
  description: string
  nodeIds: Set<string>
  isBuiltIn: boolean
}

// ─── Built-in view icon map ───────────────────────────────────────────────────

const BUILTIN_ICONS: Record<string, typeof ShoppingBag> = {
  'view-purchase':  ShoppingBag,
  'view-content':   BookOpen,
  'view-analytics': BarChart3,
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GraphViewsProps {
  autoViews: GraphView[]
  customViews: GraphView[]
  activeViewId: string | null
  /** True when there are highlighted nodes that can be saved as a view */
  canSave: boolean
  onActivate: (id: string | null) => void
  onSave: (name: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GraphViews({
  autoViews,
  customViews,
  activeViewId,
  canSave,
  onActivate,
  onSave,
  onDelete,
  onClose,
}: GraphViewsProps) {
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')

  const handleSave = () => {
    const name = newName.trim()
    if (!name) return
    onSave(name)
    setNewName('')
    setSaving(false)
  }

  const renderViewCard = (view: GraphView) => {
    const isActive = view.id === activeViewId
    const Icon = BUILTIN_ICONS[view.id] ?? Bookmark

    return (
      <div key={view.id} className="flex items-stretch gap-0">
        <button
          onClick={() => onActivate(isActive ? null : view.id)}
          className={`flex-1 text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
            isActive
              ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
          }`}
        >
          <div
            className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5 transition-colors ${
              isActive
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[12px] font-semibold leading-tight ${
                  isActive
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {view.name}
              </span>
              <span
                className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-opacity ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 opacity-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100'
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {isActive ? 'active' : `${view.nodeIds.size} nodes`}
              </span>
            </div>
            <p
              className={`text-[11px] leading-snug mt-0.5 ${
                isActive
                  ? 'text-indigo-500 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {view.description}
            </p>
          </div>
        </button>

        {/* Delete button for custom views */}
        {!view.isBuiltIn && (
          <button
            onClick={() => onDelete(view.id)}
            title="Delete view"
            className="shrink-0 w-7 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 z-50 mt-1.5 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <span
          className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Views
        </span>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
        {/* Auto-generated views */}
        <div className="px-3 py-2.5">
          <p
            className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 px-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Auto-generated
          </p>
          <div className="space-y-0.5">
            {autoViews.map(renderViewCard)}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 mx-3" />

        {/* My Views */}
        <div className="px-3 py-2.5">
          <p
            className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 px-1"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            My Views
          </p>

          {customViews.length > 0 && (
            <div className="space-y-0.5 mb-1.5">
              {customViews.map(renderViewCard)}
            </div>
          )}

          {customViews.length === 0 && !saving && (
            <p
              className="text-[11px] italic text-slate-400 dark:text-slate-500 px-1 mb-1.5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              No saved views yet
            </p>
          )}

          {/* Save input */}
          {saving ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') { setSaving(false); setNewName('') }
                }}
                placeholder="View name…"
                className="flex-1 px-2.5 py-1.5 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 rounded-lg outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 transition-colors"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
              <button
                onClick={handleSave}
                disabled={!newName.trim()}
                className="px-2.5 py-1.5 text-[11px] font-semibold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => canSave && setSaving(true)}
              disabled={!canSave}
              title={canSave ? 'Save current highlighted nodes as a view' : 'Select a node or activate a view first'}
              className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-35 disabled:cursor-not-allowed text-slate-500 dark:text-slate-400 hover:enabled:bg-slate-50 dark:hover:enabled:bg-slate-800/60 hover:enabled:text-slate-700 dark:hover:enabled:text-slate-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Save current view
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
