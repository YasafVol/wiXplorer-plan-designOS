import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowUp, ArrowDown, ArrowUpDown,
  AlertTriangle, Network, Globe, Package, Database,
  FileCode2,
} from 'lucide-react'
import { getProject } from '@/projects'

// ─── Row types ────────────────────────────────────────────────────────────────

interface PageRow {
  id: string
  name: string
  url: string
  pageType: 'static' | 'dynamic' | 'template'
  cluster: string
  clusterId: string
  isPublished: boolean
  depth: number
  views30d: number | null
  alertCount: number
  alertSeverity: 'error' | 'warning' | 'info' | null
  depCount: number
  hasAnalytics: boolean
  isOrphan: boolean
}

interface AppRow {
  id: string
  name: string
  appId: string
  scope: string
  alertCount: number
  productCount?: number
  postCount?: number
  formCount?: number
}

interface TableRow {
  id: string
  name: string
  collectionId: string
  rowCount: number
  fieldCount: number
  alertCount: number
  alertSeverity: 'error' | 'warning' | 'info' | null
}

interface CodeRow {
  id: string
  name: string
  path: string
  context: 'Client' | 'Server'
  linesOfCode: number
  lastModified: string
  schedule?: string
  alertCount: number
}

// ─── Data derivation ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deriveInventory(data: any) {
  const allNodes = [data.project, ...data.nodes]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeMap = new Map(allNodes.map((n: any) => [n.id, n]))

  const pageParent = new Map<string, string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.edges.forEach((e: any) => {
    if (e.type !== 'contains') return
    const src = nodeMap.get(e.source)
    const tgt = nodeMap.get(e.target)
    if (tgt?.type === 'page' && (src?.type === 'page' || src?.type === 'project')) {
      pageParent.set(e.target, e.source)
    }
  })

  const inboundCount = new Map<string, number>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.edges.forEach((e: any) => {
    inboundCount.set(e.target, (inboundCount.get(e.target) ?? 0) + 1)
  })

  const pageAnalytics = new Map<string, unknown>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.edges.forEach((e: any) => {
    const src = nodeMap.get(e.source)
    const tgt = nodeMap.get(e.target)
    if (src?.type === 'analytics' && tgt?.type === 'page' && e.type === 'tracks') {
      pageAnalytics.set(tgt.id, src)
    }
  })

  const nodeAlertsMap = new Map<string, unknown[]>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.alerts.forEach((a: any) => {
    if (!nodeAlertsMap.has(a.nodeId)) nodeAlertsMap.set(a.nodeId, [])
    nodeAlertsMap.get(a.nodeId)!.push(a)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function maxSev(alerts: any[]): 'error' | 'warning' | 'info' | null {
    if (!alerts.length) return null
    if (alerts.some(a => a.severity === 'error')) return 'error'
    if (alerts.some(a => a.severity === 'warning')) return 'warning'
    return 'info'
  }

  function getRootAncestor(id: string): string {
    let cur = id
    while (pageParent.has(cur)) {
      const p = pageParent.get(cur)!
      if (nodeMap.get(p)?.type === 'project') break
      cur = p
    }
    return cur
  }

  function getDepth(id: string): number {
    let depth = 0, cur = id
    while (pageParent.has(cur)) {
      const p = pageParent.get(cur)!
      if (nodeMap.get(p)?.type === 'project') break
      cur = p; depth++
    }
    return depth
  }

  function inferType(url: string): 'static' | 'dynamic' | 'template' {
    if (url.includes('{')) return 'template'
    if (url.includes(':')) return 'dynamic'
    return 'static'
  }

  function depCount(pageId: string): number {
    const connected = new Set<string>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.edges.forEach((e: any) => {
      if (e.type === 'contains') return
      const otherId = e.source === pageId ? e.target : e.target === pageId ? e.source : null
      if (!otherId) return
      const n = nodeMap.get(otherId)
      if (n && n.type !== 'page' && n.type !== 'project') connected.add(otherId)
    })
    return connected.size
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pages: PageRow[] = data.nodes.filter((n: any) => n.type === 'page').map((n: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = n.meta as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analytics = pageAnalytics.get(n.id) as any
    const alerts = (nodeAlertsMap.get(n.id) ?? []) as unknown[]
    const rootId = getRootAncestor(n.id)
    const rootNode = nodeMap.get(rootId)
    return {
      id: n.id, name: n.label,
      url: meta.url ?? '/',
      pageType: inferType(meta.url ?? '/'),
      cluster: rootId === n.id ? '—' : (rootNode?.label ?? '—'),
      clusterId: rootId,
      isPublished: meta.isPublished ?? true,
      depth: getDepth(n.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      views30d: analytics?.meta?.views30d ?? null,
      alertCount: n.alertCount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alertSeverity: maxSev(alerts as any[]),
      depCount: depCount(n.id),
      hasAnalytics: !!analytics,
      isOrphan: (inboundCount.get(n.id) ?? 0) === 0,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apps: AppRow[] = data.nodes.filter((n: any) => n.type === 'app').map((n: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = n.meta as any
    return { id: n.id, name: n.label, appId: meta.appId ?? '', scope: meta.scope ?? 'site',
      alertCount: n.alertCount, productCount: meta.productCount, postCount: meta.postCount, formCount: meta.formCount }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tables: TableRow[] = data.nodes.filter((n: any) => n.type === 'table').map((n: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = n.meta as any
    const alerts = (nodeAlertsMap.get(n.id) ?? []) as unknown[]
    return { id: n.id, name: n.label, collectionId: meta.collectionId ?? '', rowCount: meta.rowCount ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fieldCount: meta.schema?.length ?? 0, alertCount: n.alertCount, alertSeverity: maxSev(alerts as any[]) }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code: CodeRow[] = data.nodes.filter((n: any) => n.type === 'code').map((n: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = n.meta as any
    return { id: n.id, name: n.label, path: meta.path ?? '', context: meta.fileType === 'backend' ? 'Server' : 'Client',
      linesOfCode: meta.linesOfCode ?? 0, lastModified: meta.lastModified ?? '', schedule: meta.schedule, alertCount: n.alertCount }
  })

  return { pages, apps, tables, code }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString()
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'

function sortRows<T>(rows: T[], key: keyof T, dir: SortDir): T[] {
  return [...rows].sort((a, b) => {
    const av = a[key], bv = b[key]
    if (av == null) return 1; if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: string; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="w-3 h-3 opacity-30" />
  return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
}

// ─── Shared UI atoms ─────────────────────────────────────────────────────────

function AlertBadge({ count, severity }: { count: number; severity: 'error' | 'warning' | 'info' | null }) {
  if (!count) return <span className="text-stone-300 dark:text-stone-700">—</span>
  const cls = severity === 'error'
    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
    : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${cls}`}>
      <AlertTriangle className="w-2.5 h-2.5" />
      {count}
    </span>
  )
}

function StatusBadge({ published }: { published: boolean }) {
  return published
    ? <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">Published</span>
    : <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-1.5 py-0.5 rounded">Draft</span>
}

function TypeBadge({ type }: { type: 'static' | 'dynamic' | 'template' }) {
  const cls = {
    static: 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700',
    dynamic: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
    template: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800',
  }[type]
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>{type}</span>
}

function Th({
  label, col, sortKey, sortDir, onSort, className = '',
}: {
  label: string; col: string; sortKey: string; sortDir: SortDir
  onSort: (k: string) => void; className?: string
}) {
  return (
    <th
      className={`px-3 py-2.5 text-left cursor-pointer select-none whitespace-nowrap group ${className}`}
      onClick={() => onSort(col)}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </div>
    </th>
  )
}

// ─── Filter chips ────────────────────────────────────────────────────────────

function FilterChip({
  active, label, onClick,
}: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-100 ${
        active
          ? 'bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-800 dark:border-stone-100'
          : 'bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
      }`}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {active && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {label}
    </button>
  )
}

// ─── Pages tab ───────────────────────────────────────────────────────────────

function PagesTab({ rows, onOpenGraph }: { rows: PageRow[]; onOpenGraph: (id: string) => void }) {
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [alertsOnly, setAlertsOnly] = useState(false)
  const [orphanOnly, setOrphanOnly] = useState(false)
  const [noAnalytics, setNoAnalytics] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'static' | 'dynamic' | 'template'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  const handleSort = (k: string) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let r = rows
    if (alertsOnly) r = r.filter(x => x.alertCount > 0)
    if (orphanOnly) r = r.filter(x => x.isOrphan)
    if (noAnalytics) r = r.filter(x => !x.hasAnalytics)
    if (typeFilter !== 'all') r = r.filter(x => x.pageType === typeFilter)
    if (statusFilter === 'published') r = r.filter(x => x.isPublished)
    if (statusFilter === 'draft') r = r.filter(x => !x.isPublished)
    return sortRows(r, sortKey as keyof PageRow, sortDir)
  }, [rows, alertsOnly, orphanOnly, noAnalytics, typeFilter, statusFilter, sortKey, sortDir])

  const alertCount = rows.filter(x => x.alertCount > 0).length

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filter bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40">
        {alertCount > 0 && (
          <FilterChip active={alertsOnly} label={`has:alerts (${alertCount})`} onClick={() => setAlertsOnly(v => !v)} />
        )}
        <FilterChip active={orphanOnly} label="orphan" onClick={() => setOrphanOnly(v => !v)} />
        <FilterChip active={noAnalytics} label="missing:analytics" onClick={() => setNoAnalytics(v => !v)} />

        <div className="h-4 w-px bg-stone-200 dark:bg-stone-700" />

        {(['all', 'static', 'dynamic', 'template'] as const).map(t => (
          <FilterChip key={t} active={typeFilter === t} label={`type:${t}`} onClick={() => setTypeFilter(t)} />
        ))}

        <div className="h-4 w-px bg-stone-200 dark:bg-stone-700" />

        {(['all', 'published', 'draft'] as const).map(s => (
          <FilterChip key={s} active={statusFilter === s} label={s} onClick={() => setStatusFilter(s)} />
        ))}

        <span
          className="ml-auto text-[11px] text-stone-400 dark:text-stone-500 tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {filtered.length} / {rows.length}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse" style={{ fontFamily: "'Inter', sans-serif" }}>
          <thead className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 z-10">
            <tr>
              <Th label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="sticky left-0 bg-white dark:bg-stone-900 z-10 min-w-[180px]" />
              <Th label="URL" col="url" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[160px]" />
              <Th label="Type" col="pageType" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th label="Cluster" col="cluster" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th label="Status" col="isPublished" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th label="Traffic" col="views30d" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th label="Alerts" col="alertCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <Th label="Deps" col="depCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-stone-100 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-800/30 group transition-colors"
              >
                {/* Name */}
                <td className="px-3 py-2 sticky left-0 bg-white dark:bg-stone-900 group-hover:bg-stone-50 dark:group-hover:bg-stone-800/30 transition-colors">
                  <div className="flex items-center gap-1.5">
                    {row.depth > 0 && (
                      <div className="flex gap-0.5 shrink-0">
                        {Array.from({ length: row.depth }).map((_, i) => (
                          <div key={i} className="w-px h-3.5 bg-stone-200 dark:bg-stone-700 rounded" />
                        ))}
                      </div>
                    )}
                    <span className="text-[12px] font-medium text-stone-800 dark:text-stone-200 truncate max-w-[160px]">
                      {row.name}
                    </span>
                    {row.isOrphan && (
                      <span className="shrink-0 text-[9px] font-bold text-stone-400 dark:text-stone-600 border border-stone-200 dark:border-stone-700 px-1 py-0.5 rounded">
                        orphan
                      </span>
                    )}
                  </div>
                </td>
                {/* URL */}
                <td className="px-3 py-2">
                  <span
                    className="text-[11px] text-stone-500 dark:text-stone-400 truncate block max-w-[200px]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    title={row.url}
                  >
                    {row.url}
                  </span>
                </td>
                {/* Type */}
                <td className="px-3 py-2"><TypeBadge type={row.pageType} /></td>
                {/* Cluster */}
                <td className="px-3 py-2">
                  <span className="text-[12px] text-stone-500 dark:text-stone-400">{row.cluster}</span>
                </td>
                {/* Status */}
                <td className="px-3 py-2"><StatusBadge published={row.isPublished} /></td>
                {/* Traffic */}
                <td className="px-3 py-2">
                  {row.views30d != null ? (
                    <span className="text-[12px] font-medium text-stone-700 dark:text-stone-300 tabular-nums">
                      {fmtNum(row.views30d)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-300 dark:text-stone-700 italic">no data</span>
                  )}
                </td>
                {/* Alerts */}
                <td className="px-3 py-2">
                  <AlertBadge count={row.alertCount} severity={row.alertSeverity} />
                </td>
                {/* Deps */}
                <td className="px-3 py-2">
                  {row.depCount > 0 ? (
                    <span className="text-[12px] text-stone-500 dark:text-stone-400 tabular-nums">{row.depCount}</span>
                  ) : (
                    <span className="text-stone-300 dark:text-stone-700">—</span>
                  )}
                </td>
                {/* Actions */}
                <td className="px-3 py-2">
                  <button
                    onClick={() => onOpenGraph(row.id)}
                    title="Open in graph"
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700"
                  >
                    <Network className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-stone-400 dark:text-stone-600">
                  No pages match the active filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Apps tab ─────────────────────────────────────────────────────────────────

function AppsTab({ rows, onOpenGraph }: { rows: AppRow[]; onOpenGraph: (id: string) => void }) {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const handleSort = (k: string) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }
  const sorted = sortRows(rows, sortKey as keyof AppRow, sortDir)

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse" style={{ fontFamily: "'Inter', sans-serif" }}>
        <thead className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 z-10">
          <tr>
            <Th label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[160px]" />
            <Th label="App ID" col="appId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Scope" col="scope" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Alerts" col="alertCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-stone-100 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-800/30 group transition-colors">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 shrink-0 text-cyan-500" />
                  <span className="text-[12px] font-medium text-stone-800 dark:text-stone-200">{row.name}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <span className="text-[11px] text-stone-400 dark:text-stone-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {row.appId.slice(0, 20)}{row.appId.length > 20 ? '…' : ''}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  row.scope === 'site'
                    ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800'
                    : 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                }`}>{row.scope}</span>
              </td>
              <td className="px-3 py-2"><AlertBadge count={row.alertCount} severity={row.alertCount ? 'warning' : null} /></td>
              <td className="px-3 py-2">
                <button onClick={() => onOpenGraph(row.id)} title="Open in graph" className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700">
                  <Network className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tables tab ───────────────────────────────────────────────────────────────

function TablesTab({ rows, onOpenGraph }: { rows: TableRow[]; onOpenGraph: (id: string) => void }) {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const handleSort = (k: string) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }
  const sorted = sortRows(rows, sortKey as keyof TableRow, sortDir)

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse" style={{ fontFamily: "'Inter', sans-serif" }}>
        <thead className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 z-10">
          <tr>
            <Th label="Name" col="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[160px]" />
            <Th label="Collection ID" col="collectionId" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Rows" col="rowCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Fields" col="fieldCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Alerts" col="alertCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-stone-100 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-800/30 group transition-colors">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span className="text-[12px] font-medium text-stone-800 dark:text-stone-200">{row.name}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <span className="text-[11px] text-stone-400 dark:text-stone-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{row.collectionId}</span>
              </td>
              <td className="px-3 py-2">
                <span className="text-[12px] font-medium text-stone-700 dark:text-stone-300 tabular-nums">{fmtNum(row.rowCount)}</span>
              </td>
              <td className="px-3 py-2">
                <span className="text-[12px] text-stone-500 dark:text-stone-400 tabular-nums">{row.fieldCount}</span>
              </td>
              <td className="px-3 py-2"><AlertBadge count={row.alertCount} severity={row.alertSeverity} /></td>
              <td className="px-3 py-2">
                <button onClick={() => onOpenGraph(row.id)} title="Open in graph" className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700">
                  <Network className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Code tab ─────────────────────────────────────────────────────────────────

function CodeTab({ rows, onOpenGraph }: { rows: CodeRow[]; onOpenGraph: (id: string) => void }) {
  const [sortKey, setSortKey] = useState('path')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const handleSort = (k: string) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }
  const sorted = sortRows(rows, sortKey as keyof CodeRow, sortDir)

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse" style={{ fontFamily: "'Inter', sans-serif" }}>
        <thead className="sticky top-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 z-10">
          <tr>
            <Th label="File" col="path" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[200px]" />
            <Th label="Context" col="context" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Lines" col="linesOfCode" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Modified" col="lastModified" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Schedule" col="schedule" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <Th label="Alerts" col="alertCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-stone-100 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-800/30 group transition-colors">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${row.context === 'Server' ? 'text-violet-600 dark:text-violet-400' : 'text-violet-400 dark:text-violet-300'}`} />
                  <span className="text-[11px] text-stone-600 dark:text-stone-300 font-mono">{row.path}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                  row.context === 'Server'
                    ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800'
                    : 'text-violet-500 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900'
                }`}>{row.context}</span>
              </td>
              <td className="px-3 py-2">
                <span className="text-[12px] text-stone-500 dark:text-stone-400 tabular-nums">{row.linesOfCode}</span>
              </td>
              <td className="px-3 py-2">
                <span className="text-[11px] text-stone-400 dark:text-stone-500">{fmtDate(row.lastModified)}</span>
              </td>
              <td className="px-3 py-2">
                {row.schedule ? (
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                    {row.schedule}
                  </span>
                ) : (
                  <span className="text-stone-300 dark:text-stone-700">—</span>
                )}
              </td>
              <td className="px-3 py-2"><AlertBadge count={row.alertCount} severity={row.alertCount ? 'warning' : null} /></td>
              <td className="px-3 py-2">
                <button onClick={() => onOpenGraph(row.id)} title="Open in graph" className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700">
                  <Network className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'pages' | 'apps' | 'tables' | 'code'

const TAB_CONFIG: Array<{ id: Tab; label: string; icon: typeof Globe }> = [
  { id: 'pages', label: 'Pages', icon: Globe },
  { id: 'apps', label: 'Apps', icon: Package },
  { id: 'tables', label: 'Tables', icon: Database },
  { id: 'code', label: 'Code', icon: FileCode2 },
]

export function ProjectInventoryPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('pages')

  const project = projectId ? getProject(projectId) : undefined

  const inventory = useMemo(
    () => (project ? deriveInventory(project.data) : null),
    [project]
  )

  if (!project || !inventory) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="text-stone-500 dark:text-stone-400 text-sm">Project not found.</p>
      </div>
    )
  }

  if (project.viewCapabilities.codeNavigation) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center space-y-3">
          <p className="text-stone-600 dark:text-stone-400 text-sm">
            Inventory view is disabled for code projects.
          </p>
          <button
            onClick={() => navigate(`/projects/${projectId}/code-navigation`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-sm"
          >
            Open code navigation
          </button>
        </div>
      </div>
    )
  }

  const counts: Record<Tab, number> = {
    pages: inventory.pages.length,
    apps: inventory.apps.length,
    tables: inventory.tables.length,
    code: inventory.code.length,
  }

  const handleOpenGraph = (nodeId: string) => {
    const targetPath = `/projects/${projectId}`
    navigate(targetPath, { state: { focusNodeId: nodeId } })
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </button>
        <div className="h-3.5 w-px bg-stone-200 dark:bg-stone-700" />
        <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {project.name}
        </span>
        <span className="text-[10px] text-stone-400 dark:text-stone-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {project.domain}
        </span>

        <div className="flex-1" />

        {/* Open in graph button */}
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-200 dark:border-stone-700"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <Network className="w-3.5 h-3.5" />
          Open graph
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 px-4 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-bold ${
              tab === id
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600'
            }`}>
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {tab === 'pages' && <PagesTab rows={inventory.pages} onOpenGraph={handleOpenGraph} />}
        {tab === 'apps' && <AppsTab rows={inventory.apps} onOpenGraph={handleOpenGraph} />}
        {tab === 'tables' && <TablesTab rows={inventory.tables} onOpenGraph={handleOpenGraph} />}
        {tab === 'code' && <CodeTab rows={inventory.code} onOpenGraph={handleOpenGraph} />}
      </div>
    </div>
  )
}
