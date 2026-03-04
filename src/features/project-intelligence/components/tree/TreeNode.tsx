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

const NODE_RADIUS = 6
const TOGGLE_RADIUS = 7

function truncateLabel(label: string) {
  const estimatedChars = 26
  if (estimatedChars <= 2) return ''
  if (label.length <= estimatedChars) return label
  return `${label.slice(0, Math.max(estimatedChars - 1, 1))}…`
}

export function TreeNode({ node, selected, muted, onSelect, onToggleCollapse }: TreeNodeProps) {
  const category = NODE_CATEGORY[node.type]
  const nodeStroke = CATEGORY_COLOR[category]
  const showStatus = node.status === 'warning' || node.status === 'error'
  const statusColor = node.status === 'warning' ? 'var(--pi-color-warning)' : 'var(--pi-color-error)'
  const label = truncateLabel(node.label)
  const opacity = muted ? 0.32 : 1

  return (
    <g transform={`translate(${node.x}, ${node.y})`} style={{ opacity }}>
      {node.hasChildren ? (
        <g
          transform={`translate(${-18}, 0)`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleCollapse(node.id)
          }}
          style={{ cursor: 'pointer' }}
        >
          <circle
            r={TOGGLE_RADIUS}
            fill="white"
            stroke="rgba(15,23,42,0.6)"
            strokeWidth={1}
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize={11}
            fill="rgba(15,23,42,0.9)"
            fontWeight={700}
            pointerEvents="none"
          >
            {node.isCollapsed ? '+' : '-'}
          </text>
        </g>
      ) : null}

      <g onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }}>
        <circle
          r={NODE_RADIUS}
          fill="white"
          stroke={selected ? 'rgba(15,23,42,1)' : nodeStroke}
          strokeWidth={selected ? 2.6 : 1.5}
          className="transition-all duration-150"
        />
        <text
          x={NODE_RADIUS + 8}
          y={4}
          fill={selected ? 'rgba(15,23,42,1)' : 'rgba(15,23,42,0.9)'}
          fontSize={12}
          fontWeight={selected ? 700 : 500}
          pointerEvents="none"
        >
          {label}
        </text>
        {showStatus ? (
          <circle cx={NODE_RADIUS + 4} cy={-NODE_RADIUS + 1} r={3.1} fill={statusColor} stroke="white" strokeWidth={0.9} />
        ) : null}
        {node.isShared ? (
          <text x={NODE_RADIUS + 8} y={18} fill="rgba(71,85,105,0.95)" fontSize={10.5} fontWeight={600} pointerEvents="none">
            Shared x{node.sharedParentCount}
          </text>
        ) : null}
      </g>
    </g>
  )
}
