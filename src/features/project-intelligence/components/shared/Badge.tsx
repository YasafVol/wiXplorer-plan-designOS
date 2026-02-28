interface BadgeProps {
  label: string
  color: string
  size?: 'sm' | 'md'
}

export function Badge({ label, color, size = 'sm' }: BadgeProps) {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${padding}`}
      style={{
        backgroundColor: `${color}22`,
        color,
      }}
    >
      {label}
    </span>
  )
}
