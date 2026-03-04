import { ArrowLeft, Settings } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CirclePackingChart } from '@/features/project-intelligence/components/circle-packing/CirclePackingChart'
import { IcicleChart } from '@/features/project-intelligence/components/icicle/IcicleChart'
import { FileQuickEditModal } from '@/features/project-intelligence/components/inspector/FileQuickEditModal'
import { InspectorPanel } from '@/features/project-intelligence/components/inspector/InspectorPanel'
import { PendingChangesReviewModal } from '@/features/project-intelligence/components/inspector/PendingChangesReviewModal'
import { TreeChart } from '@/features/project-intelligence/components/tree/TreeChart'
import { useInspectorPaneState } from '@/features/project-views/inspector/useInspectorPaneState'
import type { TreeNodeVariant } from '@/features/project-intelligence/components/tree/TreeNode'
import { loadProjectTree } from '@/features/project-intelligence/data'
import type { PendingChange, ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

interface AppShellProps {
  projectId: string
}

type ViewMode = 'tree' | 'circle-packing' | 'icicle'

function updateTreeNode(
  tree: ProjectTree,
  nodeId: string,
  updates: Partial<Pick<ProjectNode, 'label' | 'description' | 'metadata'>>,
): ProjectTree {
  const nodes = tree.nodes.map((node) => {
    if (node.id !== nodeId) return node
    const nextMetadata = updates.metadata ? { ...node.metadata, ...updates.metadata } : node.metadata
    return { ...node, ...updates, metadata: nextMetadata }
  })
  const nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]))
  const roots = tree.roots.map((node) => nodesById[node.id] ?? node)
  return { ...tree, nodes, nodesById, roots }
}

function parseValueLikeCurrent(inputValue: string, currentRaw: unknown) {
  if (typeof currentRaw === 'boolean') {
    const lowered = inputValue.trim().toLowerCase()
    return lowered === 'yes' || lowered === 'true' || lowered === '1'
  }
  if (typeof currentRaw === 'number') {
    const parsed = Number(inputValue)
    return Number.isNaN(parsed) ? currentRaw : parsed
  }
  return inputValue
}

interface FileQuickEditTarget {
  nodeId: string
  nodeLabel: string
  filePath: string
}

export function AppShell({ projectId }: AppShellProps) {
  const navigate = useNavigate()
  const [tree, setTree] = useState<ProjectTree>(() => loadProjectTree(projectId))
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [zoomRootId, setZoomRootId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [treeAppearance, setTreeAppearance] = useState<TreeNodeVariant>('focus-mode')
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [showPendingChangesModal, setShowPendingChangesModal] = useState(false)
  const [fileQuickEditTarget, setFileQuickEditTarget] = useState<FileQuickEditTarget | null>(null)
  const [fileQuickEditDraft, setFileQuickEditDraft] = useState('')
  const zoomLabel = useMemo(() => (zoomRootId ? tree.nodesById[zoomRootId]?.label ?? 'Zoomed' : null), [tree, zoomRootId])
  const hasPendingChanges = pendingChanges.length > 0

  const containerRef = useRef<HTMLDivElement>(null)
  const { width: inspectorWidth, startResize } = useInspectorPaneState({
    defaultOpen: true,
    defaultWidth: 380,
    minWidth: 320,
    maxWidthRatio: 0.33,
  })

  const createPendingChangeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const pushPendingChange = (change: Omit<PendingChange, 'id' | 'timestamp'>) => {
    setPendingChanges((prev) => [...prev, { ...change, id: createPendingChangeId(), timestamp: new Date().toISOString() }])
  }

  const handleConfigQuickEdit = (params: {
    nodeId: string
    nodeLabel: string
    field: string
    metadataKey: string
    beforeValue: string
    nextValue: string
    beforeRaw: unknown
    beforeRawExists: boolean
  }) => {
    const node = tree.nodesById[params.nodeId]
    if (!node) return

    const nextRawValue = parseValueLikeCurrent(params.nextValue, params.beforeRaw)
    const nextDisplay = typeof nextRawValue === 'string' ? nextRawValue : String(nextRawValue)
    if (nextDisplay === params.beforeValue) return

    setTree((prev) =>
      updateTreeNode(prev, params.nodeId, {
        metadata: { [params.metadataKey]: nextRawValue },
      }),
    )
    pushPendingChange({
      nodeId: params.nodeId,
      nodeLabel: params.nodeLabel,
      section: 'configuration',
      field: params.field,
      beforeValue: params.beforeValue,
      afterValue: nextDisplay,
      source: 'inline-quick-edit',
      metadataKey: params.metadataKey,
      beforeRaw: params.beforeRaw,
      beforeRawExists: params.beforeRawExists,
    })
  }

  const handleOpenFileQuickEdit = (nodeId: string, filePath: string) => {
    const node = tree.nodesById[nodeId]
    if (!node) return
    setFileQuickEditTarget({ nodeId, nodeLabel: node.label, filePath })
    setFileQuickEditDraft(`// Draft update for ${filePath}\n`)
  }

  const handleSaveFileQuickEdit = () => {
    if (!fileQuickEditTarget) return
    pushPendingChange({
      nodeId: fileQuickEditTarget.nodeId,
      nodeLabel: fileQuickEditTarget.nodeLabel,
      section: 'file',
      field: fileQuickEditTarget.filePath,
      beforeValue: '(file content not loaded in phase 1)',
      afterValue: fileQuickEditDraft.trim() || '(empty draft)',
      source: 'modal-quick-edit',
      filePath: fileQuickEditTarget.filePath,
    })
    setFileQuickEditTarget(null)
    setFileQuickEditDraft('')
  }

  const handleRevertPendingChange = (changeId: string) => {
    const change = pendingChanges.find((entry) => entry.id === changeId)
    if (!change) return

    if (change.section === 'configuration') {
      const metadataKey = change.metadataKey
      if (!metadataKey) return
      setTree((prev) => {
        const node = prev.nodesById[change.nodeId]
        if (!node) return prev
        const nextMetadata = { ...node.metadata }
        if (change.beforeRawExists) {
          nextMetadata[metadataKey] = change.beforeRaw
        } else {
          delete nextMetadata[metadataKey]
        }
        return updateTreeNode(prev, change.nodeId, { metadata: nextMetadata })
      })
    }

    setPendingChanges((prev) => prev.filter((entry) => entry.id !== changeId))
  }

  return (
    <div className="pi-shell flex h-screen flex-col bg-[var(--pi-color-bg)] text-[var(--pi-color-text-primary)]">
      <header className="flex h-14 items-center justify-between border-b border-[var(--pi-color-border)] bg-[var(--pi-color-header-bg)] px-3 text-[var(--pi-color-header-text)]">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-white/10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Projects
          </button>
          <span className="opacity-70">·</span>
          <span className="font-semibold">{tree.meta.projectName}</span>
          <span className="opacity-70">· Last hook run {new Date(tree.meta.lastHookRun).toLocaleString()}</span>
          {viewMode !== 'tree' && zoomLabel ? <span className="rounded bg-white/15 px-2 py-0.5">Zoom: {zoomLabel}</span> : null}
          {hasPendingChanges ? (
            <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
              Publish required · {pendingChanges.length}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-white/20 bg-white/5">
            {([
              ['tree', 'TREE'],
              ['circle-packing', 'ZOOMABLE CIRCLE PACKING'],
              ['icicle', 'ICICLE'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  viewMode === mode ? 'bg-white text-stone-900' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {viewMode === 'tree' ? (
            <div className="flex overflow-hidden rounded-md border border-white/20 bg-white/5">
              {([
                ['soft-card', 'SOFT'],
                ['balanced-default', 'BALANCED'],
                ['focus-mode', 'FOCUS'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTreeAppearance(mode)}
                  className={`px-2 py-1 text-[10px] font-semibold transition-colors ${
                    treeAppearance === mode ? 'bg-white text-stone-900' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          {hasPendingChanges ? (
            <>
              <button
                type="button"
                onClick={() => setShowPendingChangesModal(true)}
                className="rounded-md border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
              >
                View changes
              </button>
              <button
                type="button"
                onClick={() => setPendingChanges([])}
                className="rounded-md border border-emerald-400/60 bg-emerald-500/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
              >
                Publish
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/project-intelligence/settings`)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/10"
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex h-[calc(100vh-56px)]">
        <section className="h-full min-w-0 flex-1 border-r border-[var(--pi-color-border)]">
          {viewMode === 'icicle' ? (
            <IcicleChart
              tree={tree}
              selectedNodeId={selectedNodeId}
              zoomRootId={zoomRootId}
              onNodeClick={(id) => setSelectedNodeId(id)}
              onNodeDoubleClick={(id) => {
                if (zoomRootId !== id) setZoomRootId(id)
              }}
              onZoomOut={() => setZoomRootId(null)}
            />
          ) : viewMode === 'circle-packing' ? (
            <CirclePackingChart
              tree={tree}
              selectedNodeId={selectedNodeId}
              zoomRootId={zoomRootId}
              onNodeClick={(id) => setSelectedNodeId(id)}
              onNodeDoubleClick={(id) => {
                if (zoomRootId !== id) setZoomRootId(id)
              }}
              onZoomOut={() => setZoomRootId(null)}
            />
          ) : (
            <TreeChart
              tree={tree}
              selectedNodeId={selectedNodeId}
              variant={treeAppearance}
              onNodeClick={(id) => setSelectedNodeId(id)}
            />
          )}
        </section>
        <div
          onMouseDown={(event) => startResize(event, containerRef.current)}
          className="group relative z-10 h-full w-1 shrink-0 cursor-col-resize"
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--pi-color-inspector-border)] transition-colors group-hover:bg-stone-400 group-active:bg-stone-500 dark:group-hover:bg-stone-500 dark:group-active:bg-stone-400" />
        </div>
        <aside
          style={{ width: inspectorWidth }}
          className="h-full shrink-0 overflow-y-auto border-l border-[var(--pi-color-inspector-border)] bg-[var(--pi-color-inspector-bg)]"
        >
          <InspectorPanel
            tree={tree}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onUpdateNode={(nodeId, updates) => setTree((prev) => updateTreeNode(prev, nodeId, updates))}
            onConfigQuickEdit={handleConfigQuickEdit}
            onFileQuickEdit={handleOpenFileQuickEdit}
          />
        </aside>
      </div>

      {showPendingChangesModal ? (
        <PendingChangesReviewModal
          changes={pendingChanges}
          onClose={() => setShowPendingChangesModal(false)}
          onRevert={handleRevertPendingChange}
          onJumpToNode={(nodeId) => {
            setSelectedNodeId(nodeId)
            setShowPendingChangesModal(false)
          }}
        />
      ) : null}

      {fileQuickEditTarget ? (
        <FileQuickEditModal
          filePath={fileQuickEditTarget.filePath}
          nodeLabel={fileQuickEditTarget.nodeLabel}
          draftText={fileQuickEditDraft}
          onDraftChange={setFileQuickEditDraft}
          onCancel={() => setFileQuickEditTarget(null)}
          onSave={handleSaveFileQuickEdit}
        />
      ) : null}
    </div>
  )
}
