import type { ReactNode } from 'react'

interface ProjectViewShellProps {
  topBar: ReactNode
  children: ReactNode
  className?: string
}

export function ProjectViewShell({ topBar, children, className }: ProjectViewShellProps) {
  return (
    <div className={className ?? 'h-screen flex flex-col overflow-hidden bg-stone-50 dark:bg-stone-950'}>
      {topBar}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
