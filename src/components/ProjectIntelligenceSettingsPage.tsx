import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadProjectIndex } from '@/features/project-intelligence/data'

function StubToggle({ label }: { label: string }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-stone-200 px-3 py-2 text-sm dark:border-stone-700">
      <span>{label}</span>
      <input type="checkbox" disabled className="accent-stone-600" />
    </label>
  )
}

export function ProjectIntelligenceSettingsPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const index = loadProjectIndex(projectId ?? 'hotel-meridian')

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-6 dark:bg-stone-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}/project-intelligence`)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Project Intelligence Settings</h1>
        </div>

        <section className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-semibold">Edit Permissions</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Any team member with project access can edit intent labels and descriptions.
          </p>
          <StubToggle label="Require confirmation for label changes" />
        </section>

        <section className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-semibold">Inference Configuration</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            The intent engine analyzes import-level connections between artifacts to infer intent.
          </p>
          <div className="grid gap-2 text-sm">
            <div className="rounded-md bg-stone-100 px-3 py-2 dark:bg-stone-800">Inference level: Import</div>
            <div className="rounded-md bg-stone-100 px-3 py-2 dark:bg-stone-800">
              Hook trigger: On build / publish / agent action
            </div>
          </div>
        </section>

        <section className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-semibold">Drift Alerts</h2>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            When an artifact&apos;s inferred intent diverges from its confirmed label, a drift indicator appears on the node.
          </p>
          <StubToggle label="Email notifications for drift alerts" />
        </section>

        <section className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-semibold">Notification Preferences</h2>
          <div className="grid gap-2">
            <StubToggle label="Drift detected" />
            <StubToggle label="Label edited" />
            <StubToggle label="Sync failure" />
          </div>
        </section>

        <section className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
          <h2 className="text-sm font-semibold">Project Metadata</h2>
          <div className="grid gap-1 text-sm text-stone-700 dark:text-stone-200">
            <div>Project name: {index.meta.projectName}</div>
            <div>Project slug: {index.meta.projectSlug}</div>
            <div>Last hook run: {new Date(index.meta.lastHookRun).toLocaleString()}</div>
            <div>Version: {index.meta.version}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
