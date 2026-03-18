import { useMemo, useRef, useState } from 'react'
import {
  Database,
  FileCode2,
  Globe,
  LayoutDashboard,
  Pencil,
  Plug2,
  Radio,
  Route,
  Timer,
  Zap,
} from 'lucide-react'
import { ActionButton } from '@/features/project-intelligence/components/inspector/ActionButton'
import { ConnectionList } from '@/features/project-intelligence/components/inspector/ConnectionList'
import { FileList } from '@/features/project-intelligence/components/inspector/FileList'
import { categoryColor, formatDateTime, sourceLabel } from '@/features/project-intelligence/components/inspector/inspectorUtils'
import { EditableText } from '@/features/project-intelligence/components/shared/EditableText'
import { StatusIndicator } from '@/features/project-intelligence/components/shared/StatusIndicator'
import { NODE_TYPE_LABELS } from '@/features/project-intelligence/types'
import type { InspectorAction, InspectorDetailTab, NodeType, ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

const NODE_TYPE_ICON: Record<string, typeof FileCode2> = {
  collection: Database,
  router: Route,
  api: Globe,
  action: Zap,
  event: Radio,
  job: Timer,
  'service-plugin': Plug2,
  'dashboard-page': LayoutDashboard,
  'dashboard-plugin': LayoutDashboard,
  'dashboard-modal': LayoutDashboard,
  'menu-plugin': LayoutDashboard,
}
const DEFAULT_NODE_ICON = FileCode2

interface InspectorLevel3Props {
  node: ProjectNode
  tree: ProjectTree
  onSelectNode: (nodeId: string) => void
  onUpdateNode: (nodeId: string, updates: Partial<Pick<ProjectNode, 'label' | 'description'>>) => void
  onConfigQuickEdit: (params: {
    nodeId: string
    nodeLabel: string
    field: string
    metadataKey: string
    beforeValue: string
    nextValue: string
    beforeRaw: unknown
    beforeRawExists: boolean
  }) => void
  onFileQuickEdit: (nodeId: string, filePath: string) => void
  onOpenBlame: () => void
  onOpenDetail: (tab: InspectorDetailTab) => void
}

interface MetadataRow {
  key: string
  metadataKey: string
  value: string
  rawValue: unknown
  rawExists: boolean
}

function metadataRows(node: ProjectNode): MetadataRow[] {
  const m = node.metadata
  const row = (key: string, metadataKey: string, fallback: unknown = '-'): MetadataRow => ({
    key,
    metadataKey,
    value: String(m[metadataKey] ?? fallback),
    rawValue: m[metadataKey],
    rawExists: Object.prototype.hasOwnProperty.call(m, metadataKey),
  })

  switch (node.type) {
    case 'collection':
      return [
        row('Row Count', 'rowCount'),
        row('Last Sync', 'lastSync'),
        row('Sync Status', 'syncStatus'),
        row('Schema', 'schemaSummary'),
      ]
    case 'job':
      return [
        row('Schedule', 'schedule'),
        row('Last Run', 'lastRun'),
        row('Last Run Status', 'lastRunStatus'),
        row('Next Run', 'nextRun'),
      ]
    case 'service-plugin':
      return [
        row('Plugin Type', 'pluginType'),
        row('Wix Solution', 'wixSolution'),
        row('Trigger Point', 'triggerPoint'),
      ]
    case 'action':
      return [
        row('Called From', 'calledFrom', Array.isArray(m.calledFrom) ? (m.calledFrom as string[]).join(', ') : '-'),
        row('Return Type', 'returnType'),
      ]
    case 'router':
      return [
        row('URL Pattern', 'urlPattern'),
        row('Auth Guard', 'authGuard', m.authGuard ? 'Yes' : 'No'),
      ]
    case 'api':
      return [
        row('Method', 'method'),
        row('Path', 'path'),
        row('Called By', 'calledBy', Array.isArray(m.calledBy) ? (m.calledBy as string[]).join(', ') : '-'),
      ]
    case 'dashboard-page':
      return [
        row('Route', 'route'),
        row('Visible To', 'visibleToRoles', Array.isArray(m.visibleToRoles) ? (m.visibleToRoles as string[]).join(', ') : '-'),
      ]
    case 'function-library':
      return [row('Bound Elements', 'boundElements', Array.isArray(m.boundElements) ? (m.boundElements as string[]).join(', ') : '-')]
    case 'context':
      return [
        row('Bound Elements', 'boundElements', Array.isArray(m.boundElements) ? (m.boundElements as string[]).join(', ') : '-'),
        row('State Shape', 'stateShape'),
      ]
    default:
      return []
  }
}

function actionsForType(type: NodeType): InspectorAction[] {
  const configure = { id: 'configure', label: 'Configure', type: 'open-modal' as const, target: 'configuration', stub: false }
  const schema = { id: 'schema', label: 'Schema', type: 'open-modal' as const, target: 'schema', stub: false }
  const code = { id: 'code', label: 'Code', type: 'open-modal' as const, target: 'code', stub: false }
  const history = { id: 'history', label: 'History', type: 'open-modal' as const, target: 'history', stub: false }
  const sendToChat = { id: 'open-chat', label: 'Send to chat', type: 'open-chat' as const, target: '', stub: true }
  const monitoring = { id: 'monitor', label: 'Go to monitoring', type: 'navigate' as const, target: '', stub: true }

  switch (type) {
    case 'collection':
      return [schema, history, monitoring]
    case 'job':
    case 'action':
    case 'service-plugin':
    case 'api':
      return [configure, schema, code, history, sendToChat, monitoring]
    case 'router':
    case 'event':
      return [configure, schema, code, history, sendToChat]
    case 'dashboard-page':
      return [configure, schema, code, history, monitoring]
    case 'dashboard-plugin':
    case 'dashboard-modal':
      return [configure, schema, code, history]
    case 'function-library':
    case 'context':
      return [schema, code, history]
    case 'embedded-script':
      return [code, history, monitoring]
    case 'style':
      return [code, history]
    default:
      return []
  }
}

export function InspectorLevel3({
  node,
  tree,
  onSelectNode,
  onUpdateNode,
  onConfigQuickEdit,
  onFileQuickEdit,
  onOpenBlame,
  onOpenDetail,
}: InspectorLevel3Props) {
  const descriptionRef = useRef<HTMLDivElement>(null)
  const [editingConfigKey, setEditingConfigKey] = useState<string | null>(null)
  const [editingConfigValue, setEditingConfigValue] = useState('')
  const rows = useMemo(() => metadataRows(node), [node])
  const actions = useMemo(() => actionsForType(node.type), [node.type])

  const parentLabels = node.parentIds.map((id) => tree.nodesById[id]).filter(Boolean)
  const typeLabel = NODE_TYPE_LABELS[node.type] ?? node.type
  const color = categoryColor(node.type)

  const Icon = NODE_TYPE_ICON[node.type] ?? DEFAULT_NODE_ICON

  return (
    <section className="space-y-4 p-4">
      {/* ── Header: icon + title + type subtitle ── */}
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: color, opacity: 0.15 }}>
            <Icon size={16} style={{ color }} />
          </span>
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-stone-900 dark:text-stone-100">
            {node.label}
          </h3>
          <span className="shrink-0 text-xs text-stone-500 dark:text-stone-400">{typeLabel}</span>
        </div>
      </div>

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

      {/* ── Editable description + pencil affordance ── */}
      <div className="space-y-1">
        <div ref={descriptionRef}>
          <EditableText
            value={node.description}
            placeholder="No description yet - add one"
            onSave={(value) => onUpdateNode(node.id, { description: value })}
            variant="description"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const btn = descriptionRef.current?.querySelector<HTMLElement>('button')
            btn?.click()
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>

      {/* ── Status + Intent source — one compact strip ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusIndicator status={node.healthStatus ?? node.status} label={node.healthStatus ?? node.status} />
        <span className="inline-flex shrink-0 rounded-full border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600 dark:border-stone-700 dark:text-stone-400">
          {node.activationStatus === 'disabled' ? 'disabled' : 'enabled'}
        </span>
        <span className="inline-flex shrink-0 rounded-full border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600 dark:border-stone-700 dark:text-stone-400">
          {sourceLabel(node)}
        </span>
      </div>

      {/* ── Configuration card ── */}
      {rows.length > 0 ? (
        <div className="rounded-lg border border-stone-200 dark:border-stone-700">
          <p className="border-b border-stone-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-700 dark:text-stone-400">
            Configuration
          </p>
          <div className="grid grid-cols-1 gap-2 p-3">
            {rows.map((row) => (
              <div key={row.key} className="grid grid-cols-[110px_1fr] gap-2 text-xs">
                <span className="uppercase tracking-wide text-stone-500 dark:text-stone-400">{row.key}</span>
                <div className="flex items-center gap-2">
                  {editingConfigKey === row.metadataKey ? (
                    <>
                      <input
                        value={editingConfigValue}
                        onChange={(event) => setEditingConfigValue(event.target.value)}
                        className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1 text-xs text-stone-800 outline-none focus:border-stone-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onConfigQuickEdit({
                            nodeId: node.id,
                            nodeLabel: node.label,
                            field: row.key,
                            metadataKey: row.metadataKey,
                            beforeValue: row.value,
                            nextValue: editingConfigValue,
                            beforeRaw: row.rawValue,
                            beforeRawExists: row.rawExists,
                          })
                          setEditingConfigKey(null)
                          setEditingConfigValue('')
                        }}
                        className="rounded border border-emerald-600 bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingConfigKey(null)
                          setEditingConfigValue('')
                        }}
                        className="rounded border border-stone-300 px-2 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 text-stone-700 dark:text-stone-200">{row.value}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingConfigKey(row.metadataKey)
                          setEditingConfigValue(row.value)
                        }}
                        className="rounded border border-stone-300 px-2 py-0.5 text-[11px] font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700"
                      >
                        Quick edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Connections card ── */}
      <div id="pi-connections" className="rounded-lg border border-stone-200 dark:border-stone-700">
        <p className="border-b border-stone-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-700 dark:text-stone-400">
          Connections
        </p>
        <div className="p-3">
          <ConnectionList currentNodeId={node.id} tree={tree} connections={node.connections} onNodeSelect={onSelectNode} />
        </div>
      </div>

      {/* ── Files card (includes path, files, last modified) ── */}
      {node.files.length > 0 ? (
        <div className="rounded-lg border border-stone-200 dark:border-stone-700">
          <p className="border-b border-stone-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-700 dark:text-stone-400">
            Files
          </p>
          <div className="p-3">
            <FileList files={node.files} onQuickEdit={(filePath) => onFileQuickEdit(node.id, filePath)} />
          </div>
          <div className="border-t border-stone-200 px-3 py-2 dark:border-stone-700">
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Last modified {formatDateTime(node.lastModified)} · {node.lastModifiedBy}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Last Modified</p>
          <p className="text-sm text-stone-700 dark:text-stone-200">
            {formatDateTime(node.lastModified)} · {node.lastModifiedBy}
          </p>
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-3 dark:border-stone-700">
        {actions.filter((action) => action.id !== 'open-ide').map((action) => (
          <ActionButton
            key={action.id}
            label={action.label}
            stub={action.stub}
            onClick={() => {
              if (action.id === 'schema') onOpenDetail('schema')
              if (action.id === 'configure') onOpenDetail('configuration')
              if (action.id === 'code') onOpenDetail('code')
              if (action.id === 'history') onOpenDetail('history')
            }}
          />
        ))}
      </div>

      <div className="border-t border-stone-200 pt-3 dark:border-stone-700">
        <button
          type="button"
          onClick={() => {
            onOpenDetail('history')
            onOpenBlame()
          }}
          className="text-xs font-medium text-stone-600 underline-offset-2 hover:underline dark:text-stone-300"
        >
          View change history
        </button>
      </div>

    </section>
  )
}
