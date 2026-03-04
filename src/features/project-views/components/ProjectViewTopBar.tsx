import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface ProjectViewTopBarProps {
  projectName: string
  projectDomain: string
  viewLabel: string
  trailingContent?: ReactNode
}

export function ProjectViewTopBar({ projectName, projectDomain, viewLabel, trailingContent }: ProjectViewTopBarProps) {
  const navigate = useNavigate()

  return (
    <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Projects
      </button>
      <div className="h-3.5 w-px bg-stone-200 dark:bg-stone-700" />
      <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {projectName}
      </span>
      <span className="text-[10px] text-stone-400 dark:text-stone-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {projectDomain}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {viewLabel}
      </span>
      <div className="flex-1" />
      {trailingContent}
    </div>
  )
}
