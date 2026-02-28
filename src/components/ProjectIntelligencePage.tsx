import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/features/project-intelligence/components/AppShell'
import { getProject } from '@/projects'

export function ProjectIntelligencePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const project = projectId ? getProject(projectId) : undefined

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

  return <AppShell projectId={project.id} />
}
