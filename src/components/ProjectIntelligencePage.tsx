import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ProjectViewRendererHost } from '@/features/project-views/components/ProjectViewRendererHost'
import { getProject } from '@/projects'

export function ProjectIntelligencePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const project = projectId ? getProject(projectId) : undefined
  const focusNodeId = searchParams.get('selected') ?? (location.state as { focusNodeId?: string } | null)?.focusNodeId

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <p className="text-stone-500 dark:text-stone-400 mb-4">
            Project not found: <code className="font-mono">{projectId}</code>
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-stone-600 dark:text-stone-400 underline underline-offset-2"
          >
            Back to projects
          </button>
        </div>
      </div>
    )
  }

  if (!project.viewCapabilities.intelligence) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <p className="text-stone-500 dark:text-stone-400 mb-4">Project intelligence is disabled for this project.</p>
          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="text-sm text-stone-600 dark:text-stone-400 underline underline-offset-2"
          >
            Open graph view
          </button>
        </div>
      </div>
    )
  }

  return <ProjectViewRendererHost project={project} mode="intelligence" focusNodeId={focusNodeId ?? undefined} />
}
