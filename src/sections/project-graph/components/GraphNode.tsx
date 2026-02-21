import { Globe, Layout, Package, Database, FileCode2, BarChart3, Box } from 'lucide-react'
import type { GraphNode as GraphNodeType, NodeType } from '@/../product/sections/project-graph/types'

export const NODE_W = 144
export const NODE_H = 54

type LucideIcon = typeof Globe

interface NodeTypeConfig {
  Icon: LucideIcon
  borderClass: string
  iconClass: string
  sourceClass: string
  ringClass: string
  label: string
}

const NODE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  project: {
    Icon: Globe,
    borderClass: 'border-l-slate-400 dark:border-l-slate-500',
    iconClass: 'text-slate-500 dark:text-slate-400',
    sourceClass: 'text-slate-400 dark:text-slate-500',
    ringClass: 'ring-slate-400',
    label: 'Project',
  },
  page: {
    Icon: Layout,
    borderClass: 'border-l-indigo-500',
    iconClass: 'text-indigo-500 dark:text-indigo-400',
    sourceClass: 'text-indigo-400/70 dark:text-indigo-500/60',
    ringClass: 'ring-indigo-500',
    label: 'Page',
  },
  app: {
    Icon: Package,
    borderClass: 'border-l-cyan-500',
    iconClass: 'text-cyan-500 dark:text-cyan-400',
    sourceClass: 'text-cyan-400/70 dark:text-cyan-500/60',
    ringClass: 'ring-cyan-500',
    label: 'App',
  },
  table: {
    Icon: Database,
    borderClass: 'border-l-emerald-500',
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    sourceClass: 'text-emerald-400/70 dark:text-emerald-500/60',
    ringClass: 'ring-emerald-500',
    label: 'Table',
  },
  code: {
    Icon: FileCode2,
    borderClass: 'border-l-violet-500',
    iconClass: 'text-violet-500 dark:text-violet-400',
    sourceClass: 'text-violet-400/70 dark:text-violet-500/60',
    ringClass: 'ring-violet-500',
    label: 'Code',
  },
  analytics: {
    Icon: BarChart3,
    borderClass: 'border-l-amber-500',
    iconClass: 'text-amber-500 dark:text-amber-400',
    sourceClass: 'text-amber-400/70 dark:text-amber-500/60',
    ringClass: 'ring-amber-500',
    label: 'Analytics',
  },
  package: {
    Icon: Box,
    borderClass: 'border-l-fuchsia-500',
    iconClass: 'text-fuchsia-500 dark:text-fuchsia-400',
    sourceClass: 'text-fuchsia-400/70 dark:text-fuchsia-500/60',
    ringClass: 'ring-fuchsia-500',
    label: 'Package',
  },
}

interface GraphNodeCardProps {
  node: GraphNodeType
  x: number
  y: number
  isSelected: boolean
  isHighlighted: boolean
  isDimmed: boolean
  isSearchMatch: boolean
  onClick: () => void
  onDoubleClick: () => void
}

export function GraphNodeCard({
  node,
  x,
  y,
  isSelected,
  isHighlighted,
  isDimmed,
  isSearchMatch,
  onClick,
  onDoubleClick,
}: GraphNodeCardProps) {
  const config = NODE_CONFIGS[node.type]
  const { Icon } = config

  const ringClass = isSearchMatch
    ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-white dark:ring-offset-slate-950'
    : isSelected
    ? `ring-2 ${config.ringClass} ring-offset-1 ring-offset-white dark:ring-offset-slate-950`
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
        opacity: isDimmed ? 0.12 : 1,
        transition: 'opacity 150ms ease, box-shadow 150ms ease',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      className={[
        'rounded-md border border-slate-200 dark:border-slate-700/80 border-l-4',
        'bg-white dark:bg-slate-900',
        isHighlighted || isSelected ? 'shadow-md' : 'shadow-sm hover:shadow-md',
        config.borderClass,
        ringClass,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-0.5">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${config.iconClass}`} />
        <span
          className="flex-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {node.label}
        </span>
        {node.alertCount > 0 && (
          <span className="shrink-0 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {node.alertCount > 9 ? '9+' : node.alertCount}
          </span>
        )}
      </div>
      {/* Bottom row: source tag */}
      <div className="px-2 pb-1.5">
        <span
          className={`text-[9px] uppercase tracking-widest font-semibold ${config.sourceClass}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {node.source}
        </span>
      </div>
    </div>
  )
}
