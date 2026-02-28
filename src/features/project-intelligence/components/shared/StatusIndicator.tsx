import type { NodeStatus } from '@/features/project-intelligence/types'

interface StatusIndicatorProps {
  status: NodeStatus
  label?: string
}

const STATUS_COLOR: Record<NodeStatus, string> = {
  healthy: 'var(--pi-color-healthy)',
  warning: 'var(--pi-color-warning)',
  error: 'var(--pi-color-error)',
  unknown: 'var(--pi-color-unknown)',
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: STATUS_COLOR[status] }}
        aria-hidden
      />
      {label ? <span>{label}</span> : null}
    </span>
  )
}
