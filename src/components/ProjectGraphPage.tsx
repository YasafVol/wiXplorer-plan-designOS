import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getProject } from '@/projects'
import { ProjectGraph } from '@/sections/project-graph/components'
import type { NodeType } from '@/../product/sections/project-graph/types'

export function ProjectGraphPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const focusNodeId = (location.state as { focusNodeId?: string } | null)?.focusNodeId

  const project = projectId ? getProject(projectId) : undefined

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <p
            className="text-stone-500 dark:text-stone-400 mb-4"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Project not found: <code className="font-mono">{projectId}</code>
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-stone-600 dark:text-stone-400 underline underline-offset-2"
          >
            Back to projects
          </button>
        </div>
      </div>
    )
  }

  const { data } = project

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50 dark:bg-stone-950">
      {/* Minimal header bar */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Projects
        </button>
        <div className="h-3.5 w-px bg-stone-200 dark:bg-stone-700" />
        <span
          className="text-[11px] font-semibold text-stone-700 dark:text-stone-300"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {project.name}
        </span>
        <span
          className="text-[10px] text-stone-400 dark:text-stone-500"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {project.domain}
        </span>
      </div>

      {/* Full-screen graph */}
      <div className="flex-1 overflow-hidden">
        <ProjectGraph
          project={data.project as any}
          nodes={data.nodes as any}
          edges={data.edges as any}
          alerts={data.alerts as any}
          layerFilters={data.layerFilters as any}
          initialSelectedNodeId={focusNodeId}
          onNodeSelect={(id) => console.log('[wiXplorer] Node selected:', id)}
          onNodeOpen={(id) => console.log('[wiXplorer] Open entity detail:', id)}
          onLayerToggle={(type: NodeType) => console.log('[wiXplorer] Layer toggled:', type)}
          onSearch={(q) => console.log('[wiXplorer] Search:', q)}
          onFitToScreen={() => console.log('[wiXplorer] Fit to screen')}
          onGoToMonitoring={(id) => console.log('[wiXplorer] Go to monitoring:', id)}
        />
      </div>
    </div>
  )
}
