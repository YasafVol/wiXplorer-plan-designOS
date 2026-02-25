import { Layers, ChevronRight, ChevronDown } from 'lucide-react'
import { NODE_W, NODE_H } from './GraphNode'
import type { ClusterNode } from './clusterUtils'

interface ClusterNodeCardProps {
  cluster: ClusterNode
  x: number
  y: number
  isExpanded: boolean
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  isSearchMatch: boolean
  onClick: () => void
  onToggleExpand: (e: React.MouseEvent) => void
  showToggle?: boolean
  toggleLabel?: string
}

export function ClusterNodeCard({
  cluster,
  x,
  y,
  isExpanded,
  isSelected,
  isHighlighted,
  isDimmed,
  isSearchMatch,
  onClick,
  onToggleExpand,
  showToggle = true,
  toggleLabel,
}: ClusterNodeCardProps) {
  const ringClass = isSearchMatch
    ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-950'
    : isSelected
    ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-950'
    : ''

  return (
    <div
      data-node="true"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H,
        zIndex: 30,
        opacity: isDimmed ? 0.12 : 1,
        transition: 'opacity 150ms ease, box-shadow 150ms ease',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      className={[
        'rounded-md border border-indigo-200 dark:border-indigo-800/70 border-l-4 border-l-indigo-500',
        'bg-indigo-50/70 dark:bg-indigo-950/40',
        isHighlighted || isSelected ? 'shadow-md' : 'shadow-sm hover:shadow-md',
        ringClass,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {/* Top row: icon + label + alert badge */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
        <Layers className="w-3.5 h-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
        <span
          className="flex-1 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200 truncate leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {cluster.label}
        </span>
        {cluster.alertCount > 0 && (
          <span className="shrink-0 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {cluster.alertCount > 9 ? '9+' : cluster.alertCount}
          </span>
        )}
      </div>

      {/* Bottom row: member count + expand toggle */}
      <div className="px-2 pb-1.5 flex items-center justify-between">
        <span
          className="text-[9px] uppercase tracking-widest font-semibold text-indigo-400/70 dark:text-indigo-500/60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {cluster.memberCount} {cluster.memberLabel ?? 'pages'}
        </span>
        {showToggle && (
          <button
            onClick={onToggleExpand}
            className={`${
              toggleLabel
                ? 'h-5 px-1.5 rounded text-[9px] uppercase tracking-wider font-semibold border border-indigo-200 dark:border-indigo-800'
                : 'w-3.5 h-3.5'
            } flex items-center justify-center text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 transition-colors`}
            style={toggleLabel ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
          >
            {toggleLabel ? (
              toggleLabel
            ) : (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
