import { ExternalLink, BookOpen, Compass, ShieldAlert } from 'lucide-react'
import type { GraphNode } from '@/../product/sections/project-graph/types'

const GOTO_LABELS: Record<string, string> = {
  project: 'Open Project',
  page: 'Go to Page',
  app: 'Open App',
  table: 'Open Table',
  code: 'Open File',
  analytics: 'View Analytics',
}

interface NodeActionMenuProps {
  anchor: { x: number; y: number }
  node: GraphNode | null   // null when a cluster is selected
  alertCount: number
  isCluster?: boolean
  onGoTo: () => void
  onExplain: () => void
  onExplore: () => void
  onGoToMonitoring?: () => void
}

export function NodeActionMenu({
  anchor,
  node,
  alertCount,
  isCluster,
  onGoTo,
  onExplain,
  onExplore,
  onGoToMonitoring,
}: NodeActionMenuProps) {
  const hasAlerts = alertCount > 0
  const showGoTo = !isCluster

  return (
    <div
      style={{
        position: 'absolute',
        left: anchor.x,
        top: anchor.y + 10,
        transform: 'translateX(-50%)',
        zIndex: 50,
        pointerEvents: 'all',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Caret pointing up to node */}
      <div
        className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white dark:bg-slate-900 border-l border-t border-slate-200 dark:border-slate-700 rotate-45"
        style={{ zIndex: 1 }}
      />

      {/* Action bar */}
      <div className="relative flex items-stretch bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-slate-950/60 overflow-hidden">
        {showGoTo && (
          <ActionButton
            icon={ExternalLink}
            label={node ? (GOTO_LABELS[node.type] ?? 'Go to') : 'Go to'}
            onClick={onGoTo}
            divider
          />
        )}
        <ActionButton
          icon={BookOpen}
          label="Explain"
          onClick={onExplain}
          divider
        />
        <ActionButton
          icon={Compass}
          label="Explore"
          onClick={onExplore}
          divider={hasAlerts}
        />
        {hasAlerts && (
          <ActionButton
            icon={ShieldAlert}
            label="Go to Monitoring"
            onClick={() => onGoToMonitoring?.()}
            alert
          />
        )}
      </div>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  divider,
  alert,
}: {
  icon: typeof ExternalLink
  label: string
  onClick: () => void
  divider?: boolean
  alert?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors${
        alert
          ? ' text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300'
          : ' text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }${divider ? ' border-r border-slate-100 dark:border-slate-800' : ''}`}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </button>
  )
}
