import { NODE_CATEGORY } from '@/features/project-intelligence/types'
import type { IcicleLayoutNode } from '@/features/project-intelligence/components/icicle/useIcicleLayout'

interface IcicleNodeProps {
  node: IcicleLayoutNode
  selected: boolean
  onClick: (nodeId: string) => void
  onDoubleClick: (nodeId: string) => void
}

const CATEGORY_COLOR: Record<string, string> = {
  level1: 'var(--pi-color-level1)',
  level2: 'var(--pi-color-level2)',
  server: 'var(--pi-color-server)',
  dashboard: 'var(--pi-color-dashboard)',
  site: 'var(--pi-color-site)',
  data: 'var(--pi-color-data)',
}

function truncateLabel(label: string, width: number) {
  const usable = Math.max(0, width - 16)
  const estimatedChars = Math.floor(usable / 6.5)
  if (estimatedChars <= 2) return ''
  if (label.length <= estimatedChars) return label
  return `${label.slice(0, Math.max(estimatedChars - 1, 1))}…`
}

export function IcicleNode({ node, selected, onClick, onDoubleClick }: IcicleNodeProps) {
  const category = node.type === 'virtual-root' ? 'level1' : NODE_CATEGORY[node.type]
  const fill = CATEGORY_COLOR[category]
  const showLabel = node.height >= 20
  const label = showLabel ? truncateLabel(node.label, node.width) : ''
  const isTruncated = label.length > 0 && label !== node.label
  const showStatus = node.status === 'warning' || node.status === 'error'
  const statusColor = node.status === 'warning' ? 'var(--pi-color-warning)' : 'var(--pi-color-error)'

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={() => onClick(node.id)}
      onDoubleClick={() => onDoubleClick(node.id)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        width={Math.max(node.width - 1, 0)}
        height={Math.max(node.height - 1, 0)}
        fill={node.isMultiParent ? 'url(#pi-diagonal-hatch)' : fill}
        stroke={selected ? 'var(--pi-color-text-primary)' : 'rgba(17,24,39,0.25)'}
        strokeWidth={selected ? 2 : 0.5}
        rx={2}
        className="transition-all duration-400 ease-[cubic-bezier(0.33,1,0.68,1)] hover:brightness-110"
      />
      {label ? (
        <text x={8} y={16} fill="white" fontSize={11} fontWeight={500} pointerEvents="none">
          {label}
        </text>
      ) : null}
      {showStatus ? (
        <circle cx={Math.max(node.width - 8, 8)} cy={8} r={4} fill={statusColor} stroke="white" strokeWidth={1} />
      ) : null}
      {isTruncated ? (
        <title>{`${node.label}${node.description ? ` — ${node.description.slice(0, 80)}` : ''}`}</title>
      ) : null}
    </g>
  )
}
