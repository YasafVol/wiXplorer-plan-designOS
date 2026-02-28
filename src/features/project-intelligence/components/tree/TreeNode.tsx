import { NODE_CATEGORY } from '@/features/project-intelligence/types'
import type { ProjectNode } from '@/features/project-intelligence/types'

export type TreeNodeVariant = 'soft-card' | 'balanced-default' | 'focus-mode'

export interface TreeLayoutNode {
  id: string
  label: string
  type: ProjectNode['type']
  status: ProjectNode['status']
  depth: number
  parentId: string | null
  x: number
  y: number
  hasChildren: boolean
  isCollapsed: boolean
  isShared: boolean
  sharedParentCount: number
}

interface TreeNodeProps {
  node: TreeLayoutNode
  selected: boolean
  muted: boolean
  width: number
  variant: TreeNodeVariant
  onSelect: (nodeId: string) => void
  onToggleCollapse: (nodeId: string) => void
}

const CATEGORY_COLOR: Record<string, string> = {
  level1: 'var(--pi-color-level1)',
  level2: 'var(--pi-color-level2)',
  server: 'var(--pi-color-server)',
  dashboard: 'var(--pi-color-dashboard)',
  site: 'var(--pi-color-site)',
  data: 'var(--pi-color-data)',
}

const TOGGLE_SIZE = 14

function truncateLabel(label: string, width: number) {
  const usable = Math.max(0, width - 24)
  const estimatedChars = Math.floor(usable / 7)
  if (estimatedChars <= 2) return ''
  if (label.length <= estimatedChars) return label
  return `${label.slice(0, Math.max(estimatedChars - 1, 1))}…`
}

function variantStyle(variant: TreeNodeVariant) {
  if (variant === 'balanced-default') {
    return {
      height: 24,
      radius: 5,
      fontSize: 11,
      fontWeight: 600,
      fill: 'rgba(24,24,27,0.94)',
      stroke: 'rgba(120,113,108,0.5)',
      text: 'rgba(250,250,249,0.95)',
      toggleFill: 'rgba(39,39,42,0.95)',
      toggleStroke: 'rgba(82,82,91,0.85)',
      toggleText: 'rgba(231,229,228,0.95)',
    }
  }

  if (variant === 'focus-mode') {
    return {
      height: 26,
      radius: 8,
      fontSize: 11.5,
      fontWeight: 600,
      fill: null,
      stroke: 'rgba(17,24,39,0.28)',
      text: 'white',
      toggleFill: 'rgba(120,113,108,0.16)',
      toggleStroke: 'rgba(120,113,108,0.4)',
      toggleText: 'var(--pi-color-text-secondary)',
    }
  }

  return {
    height: 26,
    radius: 8,
    fontSize: 11.5,
    fontWeight: 600,
    fill: null,
    stroke: 'rgba(17,24,39,0.25)',
    text: 'white',
    toggleFill: 'rgba(120,113,108,0.14)',
    toggleStroke: 'rgba(120,113,108,0.35)',
    toggleText: 'var(--pi-color-text-secondary)',
  }
}

export function TreeNode({ node, selected, muted, width, variant, onSelect, onToggleCollapse }: TreeNodeProps) {
  const category = NODE_CATEGORY[node.type]
  const fill = CATEGORY_COLOR[category]
  const showStatus = node.status === 'warning' || node.status === 'error'
  const statusColor = node.status === 'warning' ? 'var(--pi-color-warning)' : 'var(--pi-color-error)'
  const style = variantStyle(variant)
  const nodeFill = style.fill ?? fill
  const label = truncateLabel(node.label, width)
  const baselineY = style.height / 2 + 4
  const opacity = muted ? 0.32 : 1

  return (
    <g transform={`translate(${node.x}, ${node.y})`} style={{ cursor: 'pointer', opacity }}>
      {node.hasChildren ? (
        <g
          transform={`translate(0, ${(style.height - TOGGLE_SIZE) / 2})`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleCollapse(node.id)
          }}
        >
          <rect
            width={TOGGLE_SIZE}
            height={TOGGLE_SIZE}
            rx={3}
            fill={style.toggleFill}
            stroke={style.toggleStroke}
            strokeWidth={1}
          />
          <text
            x={TOGGLE_SIZE / 2}
            y={TOGGLE_SIZE / 2 + 4}
            textAnchor="middle"
            fontSize={11}
            fill={style.toggleText}
            pointerEvents="none"
          >
            {node.isCollapsed ? '+' : '-'}
          </text>
        </g>
      ) : null}

      <g transform={`translate(${node.hasChildren ? TOGGLE_SIZE + 8 : 0}, 0)`} onClick={() => onSelect(node.id)}>
        <rect
          width={width}
          height={style.height}
          rx={style.radius}
          fill={nodeFill}
          stroke={selected ? 'var(--pi-color-text-primary)' : style.stroke}
          strokeWidth={selected ? 2 : 1}
          className="transition-all duration-150 hover:brightness-110 hover:shadow-lg"
        />
        <text
          x={10}
          y={baselineY}
          fill={style.text}
          fontSize={style.fontSize}
          fontWeight={style.fontWeight}
          pointerEvents="none"
        >
          {label}
        </text>
        {showStatus ? (
          <circle
            cx={Math.max(width - 10, 10)}
            cy={style.height / 2}
            r={4}
            fill={statusColor}
            stroke="white"
            strokeWidth={1}
          />
        ) : null}
        {node.isShared ? (
          <g transform={`translate(0, ${style.height + 2})`}>
            <rect width={64} height={14} rx={4} fill="rgba(255,255,255,0.9)" />
            <text x={5} y={10} fill="rgba(68,64,60,0.95)" fontSize={9.5} fontWeight={700}>
              Shared x{node.sharedParentCount}
            </text>
          </g>
        ) : null}
      </g>
    </g>
  )
}
