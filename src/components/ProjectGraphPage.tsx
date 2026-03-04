import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ProjectViewShell } from '@/features/project-views/components/ProjectViewShell'
import { ProjectViewRendererHost } from '@/features/project-views/components/ProjectViewRendererHost'
import { ProjectViewTopBar } from '@/features/project-views/components/ProjectViewTopBar'
import { getProject } from '@/projects'

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
            onClick={() => navigate('/')}
            className="text-sm text-stone-600 dark:text-stone-400 underline underline-offset-2"
          >
            Back to projects
          </button>
        </div>
      </div>
    )
  }

  if (!project.viewCapabilities.graph) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <p className="text-stone-500 dark:text-stone-400 mb-4">Graph view is disabled for this project.</p>
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

  return (
    <ProjectViewShell
      className="h-screen flex flex-col overflow-hidden bg-stone-50 dark:bg-stone-950"
      topBar={<ProjectViewTopBar projectName={project.name} projectDomain={project.domain} viewLabel="project graph" />}
    >
      <ProjectViewRendererHost project={project} mode="graph" focusNodeId={focusNodeId} />
    </ProjectViewShell>
  )
}
