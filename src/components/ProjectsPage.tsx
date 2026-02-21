import { useNavigate } from 'react-router-dom'
import { ArrowRight, Globe, Layers, GitBranch, Link2, Table2 } from 'lucide-react'
import { PROJECTS } from '@/projects'
import type { ProjectMeta } from '@/projects'

function ProjectCard({ project }: { project: ProjectMeta }) {
  const navigate = useNavigate()

  return (
    <div className="group relative rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 flex flex-col gap-5 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm transition-all duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-base font-semibold text-stone-900 dark:text-stone-100"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {project.name}
            </h2>
          </div>
          <div
            className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Globe className="w-3 h-3 shrink-0" />
            {project.domain}
          </div>
        </div>
      </div>

      {/* Description */}
      <p
        className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {project.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Layers, label: 'Pages', value: project.pageCount },
          { icon: GitBranch, label: 'Nodes', value: project.nodeCount },
          { icon: Link2, label: 'Edges', value: project.edgeCount },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3 h-3 text-stone-400 dark:text-stone-500" />
              <span
                className="text-[9px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {label}
              </span>
            </div>
            <span
              className="text-lg font-semibold text-stone-800 dark:text-stone-200 tabular-nums"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/projects/${project.id}`)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold hover:bg-stone-700 dark:hover:bg-white transition-colors"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Open in graph
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate(`/projects/${project.id}/inventory`)}
          title="Open inventory table"
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <Table2 className="w-4 h-4" />
          Inventory
        </button>
      </div>
    </div>
  )
}

export function ProjectsPage() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1
              className="text-sm font-semibold text-stone-900 dark:text-stone-100"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              wiXplorer
            </h1>
            <p
              className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Project Graph Explorer
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h2
            className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Sample Projects
          </h2>
          <p
            className="text-sm text-stone-500 dark:text-stone-400"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Load a sample project to explore in the interactive graph viewer.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </main>
    </div>
  )
}
