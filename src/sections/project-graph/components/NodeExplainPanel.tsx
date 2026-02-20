import {
  X,
  AlertTriangle,
  Globe,
  Layout,
  Package,
  Database,
  FileCode2,
  BarChart3,
} from 'lucide-react'
import type {
  GraphNode,
  Alert,
  NodeType,
  PageNodeMeta,
  AppNodeMeta,
  TableNodeMeta,
  CodeNodeMeta,
  AnalyticsNodeMeta,
  ProjectNodeMeta,
} from '@/../product/sections/project-graph/types'

// ─── Type maps ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<NodeType, typeof Globe> = {
  project: Globe,
  page: Layout,
  app: Package,
  table: Database,
  code: FileCode2,
  analytics: BarChart3,
}

const TYPE_COLOR: Record<NodeType, { header: string; icon: string; badge: string }> = {
  project: {
    header: 'bg-slate-50 dark:bg-slate-800/40',
    icon: 'text-slate-500 dark:text-slate-400',
    badge: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  },
  page: {
    header: 'bg-indigo-50 dark:bg-indigo-950/30',
    icon: 'text-indigo-500',
    badge: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
  },
  app: {
    header: 'bg-cyan-50 dark:bg-cyan-950/30',
    icon: 'text-cyan-500',
    badge: 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
  },
  table: {
    header: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-500',
    badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
  },
  code: {
    header: 'bg-violet-50 dark:bg-violet-950/30',
    icon: 'text-violet-500',
    badge: 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800',
  },
  analytics: {
    header: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-500',
    badge: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
  },
}

const NODE_DESCRIPTION: Record<NodeType, string> = {
  project:
    'The root node representing the entire Wix site. All pages, apps, tables, and code files are reachable from this entry point.',
  page:
    'A Wix page managed through Dashboard Manager. Pages are the primary user-facing surfaces — they can host apps, consume CMS collections, and run Velo scripts.',
  app:
    'An installed application from the Wix Dev Center. Apps extend site functionality with pre-built UI components, backend integrations, and data connections.',
  table:
    'A CMS collection storing structured content. Collections are queryable through the Wix Data API and can be consumed directly by pages or Velo backend code.',
  code:
    'A Velo code file containing custom frontend or backend logic. Code files can read/write CMS data, call external APIs, handle scheduled jobs, and respond to site events.',
  analytics:
    'An analytics snapshot tracking user behavior for a specific page over the last 30 days.',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span
        className="shrink-0 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {label}
      </span>
      <span
        className="text-[11px] text-slate-700 dark:text-slate-300 truncate text-right"
        style={{ fontFamily: mono ? "'JetBrains Mono', monospace" : "'Inter', sans-serif" }}
      >
        {value}
      </span>
    </div>
  )
}

function NodeMeta({ node }: { node: GraphNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = node.meta as any

  if (node.type === 'page') {
    const meta = m as PageNodeMeta
    return (
      <div className="space-y-0.5">
        <MetaRow label="URL" value={meta.url} mono />
        <MetaRow label="Status" value={meta.isPublished ? 'Published' : 'Draft'} />
        {meta.hasPopup && <MetaRow label="Popup" value={meta.popupTrigger ?? 'Enabled'} />}
      </div>
    )
  }

  if (node.type === 'app') {
    const meta = m as AppNodeMeta
    return (
      <div className="space-y-0.5">
        <MetaRow label="App ID" value={meta.appId} mono />
        <MetaRow label="Scope" value={meta.scope} />
        {meta.formCount != null && <MetaRow label="Forms" value={String(meta.formCount)} />}
        {meta.productCount != null && (
          <MetaRow label="Products" value={String(meta.productCount)} />
        )}
        {meta.postCount != null && <MetaRow label="Posts" value={String(meta.postCount)} />}
        {meta.languages && (
          <MetaRow label="Languages" value={meta.languages.join(', ')} />
        )}
      </div>
    )
  }

  if (node.type === 'table') {
    const meta = m as TableNodeMeta
    return (
      <div className="space-y-0.5">
        <MetaRow label="Collection" value={meta.collectionId} mono />
        <MetaRow label="Rows" value={meta.rowCount.toLocaleString()} />
        <MetaRow label="Fields" value={String(meta.schema?.length ?? 0)} />
      </div>
    )
  }

  if (node.type === 'code') {
    const meta = m as CodeNodeMeta
    return (
      <div className="space-y-0.5">
        <MetaRow label="Path" value={meta.path} mono />
        <MetaRow label="Type" value={meta.fileType} />
        <MetaRow label="Lines" value={String(meta.linesOfCode)} />
        <MetaRow
          label="Modified"
          value={new Date(meta.lastModified).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        />
        {meta.schedule && <MetaRow label="Schedule" value={meta.schedule} mono />}
        {meta.description && (
          <p
            className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {meta.description}
          </p>
        )}
      </div>
    )
  }

  if (node.type === 'analytics') {
    const meta = m as AnalyticsNodeMeta
    return (
      <div className="space-y-0.5">
        <MetaRow label="Views (30d)" value={meta.views30d.toLocaleString()} />
        <MetaRow label="Sessions" value={meta.sessions30d.toLocaleString()} />
        <MetaRow label="Bounce rate" value={`${Math.round(meta.bounceRate * 100)}%`} />
        <MetaRow label="Avg session" value={`${meta.avgSessionDuration}s`} />
      </div>
    )
  }

  if (node.type === 'project') {
    const meta = m as ProjectNodeMeta
    return (
      <div className="space-y-0.5">
        <MetaRow label="Domain" value={meta.domain} mono />
        <MetaRow
          label="Published"
          value={new Date(meta.publishedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        />
        <MetaRow label="Pages" value={String(meta.totalPages)} />
        <MetaRow label="Plan" value={meta.premium ? 'Premium' : 'Free'} />
      </div>
    )
  }

  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NodeExplainPanelProps {
  node: GraphNode
  connectedNodes: GraphNode[]
  nodeAlerts: Alert[]
  onClose: () => void
}

export function NodeExplainPanel({
  node,
  connectedNodes,
  nodeAlerts,
  onClose,
}: NodeExplainPanelProps) {
  const Icon = TYPE_ICON[node.type]
  const colors = TYPE_COLOR[node.type]

  // Group connections by type
  const byType = new Map<NodeType, GraphNode[]>()
  connectedNodes.forEach((n) => {
    if (!byType.has(n.type)) byType.set(n.type, [])
    byType.get(n.type)!.push(n)
  })

  return (
    <div className="w-72 shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div
        className={`${colors.header} border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-3`}
      >
        <div className="flex items-start gap-2 justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${colors.icon}`} />
            <span
              className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {node.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${colors.badge}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {node.type}
          </span>
          <span
            className="text-[10px] text-slate-400 dark:text-slate-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            via {node.source}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {/* Description */}
        <div className="px-4 py-3">
          <p
            className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {NODE_DESCRIPTION[node.type]}
          </p>
        </div>

        {/* Type-specific metadata */}
        <div className="px-4 py-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Details
          </p>
          <NodeMeta node={node} />
        </div>

        {/* Alerts */}
        {nodeAlerts.length > 0 && (
          <div className="px-4 py-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Alerts ({nodeAlerts.length})
            </p>
            <div className="space-y-2">
              {nodeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-0.5"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {alert.severity}
                    </p>
                    <p
                      className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        <div className="px-4 py-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Connections ({connectedNodes.length})
          </p>
          {connectedNodes.length === 0 ? (
            <p
              className="text-[11px] italic text-slate-400 dark:text-slate-500"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              No direct connections
            </p>
          ) : (
            <div className="space-y-3">
              {[...byType.entries()].map(([type, typeNodes]) => {
                const TypeIcon = TYPE_ICON[type]
                const typeColors = TYPE_COLOR[type]
                return (
                  <div key={type}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TypeIcon className={`w-3 h-3 ${typeColors.icon}`} />
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {type} ({typeNodes.length})
                      </span>
                    </div>
                    <div className="space-y-0.5 pl-4">
                      {typeNodes.map((n) => (
                        <div key={n.id} className="flex items-center justify-between gap-2">
                          <span
                            className="text-[11px] text-slate-600 dark:text-slate-400 truncate"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            {n.label}
                          </span>
                          {n.alertCount > 0 && (
                            <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold text-red-500">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {n.alertCount}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
