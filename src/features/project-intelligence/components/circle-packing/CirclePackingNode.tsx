import { useState } from 'react'
import type { CirclePackingLayoutNode } from '@/features/project-intelligence/components/circle-packing/useCirclePackingLayout'

interface CirclePackingNodeProps {
  node: CirclePackingLayoutNode
  cx: number
  cy: number
  radius: number
  selected: boolean
  suppressInlineLabel?: boolean
  onActivate: (nodeId: string) => void
}

function truncateLabel(label: string, radius: number) {
  const estimatedChars = Math.floor((radius * 1.85) / 6.6)
  if (estimatedChars <= 2) return ''
  if (label.length <= estimatedChars) return label
  return `${label.slice(0, Math.max(estimatedChars - 1, 1))}…`
}

export function CirclePackingNode({
  node,
  cx,
  cy,
  radius,
  selected,
  suppressInlineLabel = false,
  onActivate,
}: CirclePackingNodeProps) {
  const [hovered, setHovered] = useState(false)
  const lightness = Math.max(88, 97 - node.depth * 2.7)
  const fill = selected ? '#f2f2f2' : `hsl(0 0% ${lightness}%)`
  const label = truncateLabel(node.label, radius)
  const showStatus = selected && (node.status === 'warning' || node.status === 'error') && radius >= 12
  const statusColor = node.status === 'warning' ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.85)'
  const showLabel = !suppressInlineLabel && Boolean(label) && (radius >= 26 || selected || hovered)

  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation()
        onActivate(node.id)
      }}
      style={{ cursor: 'pointer' }}
      className="transition-opacity duration-300"
    >
      <circle
        r={Math.max(radius - 0.75, 0)}
        fill={selected ? fill : node.isMultiParent && hovered ? 'url(#pi-circle-diagonal-hatch)' : fill}
        stroke={selected ? '#111111' : hovered ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.34)'}
        strokeWidth={selected ? 2 : hovered ? 1.2 : 1}
        className="transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
      />
      {showLabel ? (
        <text
          x={0}
          y={0}
          fill="#111111"
          fontSize={Math.max(10.5, Math.min(13, radius / 3.4))}
          fontWeight={selected ? 600 : 500}
          dominantBaseline="middle"
          textAnchor="middle"
          pointerEvents="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={2}
          paintOrder="stroke"
        >
          {label}
        </text>
      ) : null}
      {showStatus ? (
        <circle
          cx={Math.max(radius - 6, 6)}
          cy={-Math.max(radius - 6, 6)}
          r={3.4}
          fill={statusColor}
          stroke="white"
          strokeWidth={0.9}
        />
      ) : null}
      <title>{`${node.label}${node.description ? ` — ${node.description.slice(0, 120)}` : ''}`}</title>
    </g>
  )
}
