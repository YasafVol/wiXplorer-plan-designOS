import { useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PanelRight, ChevronsUpDown, Pencil, FileCode2, Sparkles, ExternalLink } from 'lucide-react'
import { getProject } from '@/projects'
import extensionsFileRaw from '@/extensions.ts?raw'
import builderFileRaw from '@/server/jobs/my-job/my-job.extension.ts?raw'
import handlerFileRaw from '@/server/jobs/my-job/my-job.ts?raw'

type GraphNode = {
  id: string
  type: 'project' | 'page' | 'app' | 'table' | 'code' | 'analytics' | 'package'
  label: string
  meta: Record<string, unknown>
}

type NodePosition = { x: number; y: number; w: number; h: number }

const CANVAS_W = 1180
const CANVAS_H = 620

function shapeClassFor(type: GraphNode['type']): string {
  if (type === 'app') return 'rounded-none'
  if (type === 'table') return 'rounded-2xl border-2'
  if (type === 'page') return 'rounded-sm'
  if (type === 'code') return 'rounded-lg'
  return 'rounded-md'
}

function bgClassFor(type: GraphNode['type']): string {
  if (type === 'app') return 'bg-white dark:bg-slate-900 border-cyan-300 dark:border-cyan-800 border-l-4 text-slate-700 dark:text-slate-200'
  if (type === 'table') return 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 border-l-4 text-slate-700 dark:text-slate-200'
  if (type === 'page') return 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-800 border-l-4 text-slate-700 dark:text-slate-200'
  if (type === 'code') return 'bg-white dark:bg-slate-900 border-violet-300 dark:border-violet-800 border-l-4 text-slate-700 dark:text-slate-200'
  return 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 border-l-4 text-slate-700 dark:text-slate-200'
}

function humanizeCron(expr: string): string {
  if (expr === '0 * * * *') return 'Every hour (at minute 0)'
  if (expr === '*/5 * * * *') return 'Every 5 minutes'
  if (expr === '0 0 * * *') return 'Daily at 00:00'
  return 'Custom schedule'
}

export function AltCodeViewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const project = projectId ? getProject(projectId) : undefined

  const [paneOpen, setPaneOpen] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [jobExploded, setJobExploded] = useState(false)
  const [highlightChain, setHighlightChain] = useState(false)

  const [logicSummary, setLogicSummary] = useState(
    'Runs hourly to sync Contacts submissions into a normalized pipeline and enqueue follow-up checks.'
  )
  const [logicPrompt, setLogicPrompt] = useState('')
  const [showLogicPrompt, setShowLogicPrompt] = useState(false)
  const [showQuickEdit, setShowQuickEdit] = useState(false)
  const [handlerCode, setHandlerCode] = useState(handlerFileRaw)
  const [builderCode, setBuilderCode] = useState(builderFileRaw)
  const [extensionsCode] = useState(extensionsFileRaw)
  const [cronEditOpen, setCronEditOpen] = useState(false)
  const [cron, setCron] = useState('0 * * * *')
  const [cronDraft, setCronDraft] = useState('0 * * * *')
  const [lastEditNote, setLastEditNote] = useState('')

  if (!project || project.id !== 'main-code') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Main Code project not found.</p>
      </div>
    )
  }

  const data = project.data
  const nodes = [data.project, ...data.nodes] as GraphNode[]
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) ?? null : null

  const visibleNodeIds = !jobExploded
    ? [
        'node-extensions-root',
        'node-job-my-job',
        'node-contact-collection',
        'node-app-wix-forms',
        'node-page-landing',
        'node-page-sign-up',
      ]
    : [
        'node-extensions-root',
        'node-job-builder-file',
        'node-job-handler-file',
        'node-contact-collection',
        'node-app-wix-forms',
        'node-page-landing',
        'node-page-sign-up',
      ]

  const positions: Record<string, NodePosition> = {
    'node-extensions-root': { x: 500, y: 56, w: 180, h: 64 },
    'node-job-my-job': { x: 500, y: 204, w: 180, h: 72 },
    'node-job-builder-file': { x: 380, y: 204, w: 180, h: 72 },
    'node-job-handler-file': { x: 620, y: 204, w: 180, h: 72 },
    'node-contact-collection': { x: 500, y: 376, w: 180, h: 68 },
    'node-app-wix-forms': { x: 290, y: 498, w: 180, h: 68 },
    'node-page-landing': { x: 610, y: 498, w: 150, h: 62 },
    'node-page-sign-up': { x: 790, y: 498, w: 150, h: 62 },
  }

  const edgeIds = new Set(
    (data.edges as Array<{ id: string; source: string; target: string }>).map((e) => e.id)
  )
  const visibleEdges: Array<{ source: string; target: string }> = []
  if (!jobExploded && edgeIds.has('edge-extensions-job')) {
    visibleEdges.push({ source: 'node-extensions-root', target: 'node-job-my-job' })
  }
  if (jobExploded) {
    visibleEdges.push({ source: 'node-extensions-root', target: 'node-job-builder-file' })
    visibleEdges.push({ source: 'node-job-builder-file', target: 'node-job-handler-file' })
  }
  visibleEdges.push({
    source: jobExploded ? 'node-job-handler-file' : 'node-job-my-job',
    target: 'node-contact-collection',
  })
  visibleEdges.push({ source: 'node-app-wix-forms', target: 'node-contact-collection' })
  visibleEdges.push({ source: 'node-page-landing', target: 'node-app-wix-forms' })
  visibleEdges.push({ source: 'node-page-sign-up', target: 'node-app-wix-forms' })

  const projectExtensions = data.nodes.filter((n: GraphNode) => {
    if (n.type !== 'code') return false
    const kind = String((n.meta as Record<string, unknown>).kind ?? '')
    return kind === 'scheduledJobGroup' || kind === 'builderFile' || kind === 'handlerFile'
  }) as GraphNode[]

  const handleApplyCron = () => {
    const nextCron = cronDraft.trim()
    if (!nextCron) return
    setCron(nextCron)
    setBuilderCode((prev) => prev.replace(/cron:\s*"[^"]+"/, `cron: "${nextCron}"`))
    setCronEditOpen(false)
    setLastEditNote('Updated builder file cron configuration.')
  }

  const applyNaturalLanguageEdit = () => {
    const prompt = logicPrompt.trim()
    if (!prompt) return
    setLogicSummary(prompt)
    setHandlerCode((prev) => `${prev}\n\n// AI edit intent: ${prompt}`)
    setLogicPrompt('')
    setShowLogicPrompt(false)
    setLastEditNote('Applied natural-language update to handler logic.')
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Main Code</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">alt-code view</span>
        <div className="flex-1" />
        <button
          onClick={() => setPaneOpen((v) => !v)}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
            paneOpen
              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={paneOpen ? 'Hide inspector' : 'Show inspector'}
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-auto">
          <div
            className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mx-auto"
            style={{ width: CANVAS_W, height: CANVAS_H }}
            onClick={() => setSelectedNodeId(null)}
          >
            <div
              className="absolute inset-0 pointer-events-none rounded-xl"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(100,116,139,0.22) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute top-4 left-4 text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">server / jobs</div>
            <div className="absolute left-[340px] top-[168px] w-[520px] h-[132px] rounded-xl border border-dashed border-violet-300/70 dark:border-violet-800/70 bg-violet-50/40 dark:bg-violet-950/20" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {visibleEdges.map((edge, idx) => {
                const src = positions[edge.source]
                const tgt = positions[edge.target]
                if (!src || !tgt) return null
                const x1 = src.x + src.w / 2
                const y1 = src.y + src.h
                const x2 = tgt.x + tgt.w / 2
                const y2 = tgt.y
                const active = highlightChain && (edge.source.includes('contact') || edge.target.includes('contact') || edge.source.includes('forms') || edge.target.includes('forms') || edge.source.includes('landing') || edge.target.includes('landing') || edge.source.includes('sign-up') || edge.target.includes('sign-up'))
                return (
                  <line
                    key={`${edge.source}-${edge.target}-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    strokeWidth={active ? 3 : 1.8}
                    className={active ? 'stroke-indigo-500' : 'stroke-slate-300 dark:stroke-slate-700'}
                  />
                )
              })}
            </svg>

            {visibleNodeIds.map((nodeId) => {
              const node = nodeById.get(nodeId)
              if (!node) return null
              const pos = positions[node.id]
              const isSelected = selectedNodeId === node.id
              const isApp = node.type === 'app'
              const style: CSSProperties = {
                left: pos.x,
                top: pos.y,
                width: pos.w,
                height: pos.h,
              }
              if (isApp) {
                style.clipPath = 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)'
              }
              return (
                <button
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedNodeId(node.id)
                  }}
                  className={`absolute border shadow-sm hover:shadow-md px-3 text-left transition-all ${shapeClassFor(node.type)} ${bgClassFor(node.type)} ${
                    isSelected ? 'ring-2 ring-indigo-500' : ''
                  } ${
                    highlightChain &&
                    ['node-contact-collection', 'node-app-wix-forms', 'node-page-landing', 'node-page-sign-up'].includes(node.id)
                      ? 'ring-2 ring-indigo-400'
                      : ''
                  }`}
                  style={style}
                >
                  <div className="text-[11px] font-semibold leading-tight">{node.label}</div>
                  <div className="text-[10px] mt-1 opacity-80">
                    {node.id === 'node-job-my-job'
                      ? jobExploded
                        ? 'grouped node (expanded)'
                        : 'grouped node'
                      : node.type}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {paneOpen && (
          <aside className="w-96 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Inspector</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {selectedNode?.label ?? 'No selection'}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {!selectedNode && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Extensions in this project
                  </div>
                  <ul className="space-y-1">
                    {projectExtensions.map((ext) => (
                      <li key={ext.id} className="text-[12px] text-slate-600 dark:text-slate-400">
                        {ext.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job grouping</div>
                  <button
                    onClick={() => setJobExploded((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronsUpDown className="w-3 h-3" />
                    {jobExploded ? 'Collapse' : 'Explode'}
                  </button>
                </div>
                <p className="text-[12px] text-slate-600 dark:text-slate-400">
                  Group node represents builder + handler files. Click explode to unpack composing files.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Logic (plain English)</div>
                  <button
                    onClick={() => setShowLogicPrompt((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <p className="text-[12px] text-slate-600 dark:text-slate-400 mt-2">{logicSummary}</p>

                {showLogicPrompt && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={logicPrompt}
                      onChange={(e) => setLogicPrompt(e.target.value)}
                      placeholder="Describe what should change in the handler logic..."
                      className="w-full h-20 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                    />
                    <button
                      onClick={applyNaturalLanguageEdit}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-indigo-600 text-white"
                    >
                      <Sparkles className="w-3 h-3" />
                      Apply natural language edit
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setShowQuickEdit((v) => !v)}
                    className="text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Quick edit
                  </button>
                  <button
                    onClick={() => setLastEditNote('Opened handler file in IDE.')}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Go to IDE
                  </button>
                </div>

                {showQuickEdit && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={handlerCode}
                      onChange={(e) => setHandlerCode(e.target.value)}
                      className="w-full h-40 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 font-mono"
                    />
                    <button
                      onClick={() => setLastEditNote('Saved quick edit to handler file view.')}
                      className="text-[11px] px-2 py-1 rounded bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                    >
                      Save quick edit
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cron configuration</div>
                  <button
                    onClick={() => setCronEditOpen((v) => !v)}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                </div>
                <div className="text-[12px] text-slate-700 dark:text-slate-300 mt-2 font-mono">{cron}</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">{humanizeCron(cron)}</div>
                {cronEditOpen && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={cronDraft}
                      onChange={(e) => setCronDraft(e.target.value)}
                      className="flex-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 font-mono"
                    />
                    <button
                      onClick={handleApplyCron}
                      className="text-[11px] px-2 py-1 rounded bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Connected entities</div>
                <button
                  onClick={() => setHighlightChain((v) => !v)}
                  className="text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-700 mb-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {highlightChain ? 'Clear highlight' : 'Highlight chain'}
                </button>
                <div className="text-[12px] text-slate-600 dark:text-slate-400">
                  Contact collection → Wix Forms app → Landing, Sign Up pages
                </div>
              </div>

              <details className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  File context snapshots
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">extensions.ts</div>
                    <pre className="text-[10px] p-2 rounded bg-slate-100 dark:bg-slate-800 overflow-x-auto">{extensionsCode}</pre>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">my-job.extension.ts</div>
                    <pre className="text-[10px] p-2 rounded bg-slate-100 dark:bg-slate-800 overflow-x-auto">{builderCode}</pre>
                  </div>
                </div>
              </details>

              {lastEditNote && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded p-2">
                  {lastEditNote}
                </div>
              )}

              <div className="text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                <FileCode2 className="w-3 h-3" />
                UI updates are reflected in file-backed code previews for this POC.
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
