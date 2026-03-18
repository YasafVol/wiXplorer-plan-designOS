import { AppShell } from '@/features/project-intelligence/components/AppShell'
import type { ProjectMeta } from '@/projects'
import { CodeNavigationView } from '@/components/CodeNavigationPage'
import { ProjectGraph } from '@/sections/project-graph/components'
import type { Alert, GraphEdge, GraphNode, LayerFilter, NodeType } from '@/../product/sections/project-graph/types'

export type ProjectViewMode = 'graph' | 'code-navigation' | 'intelligence'

interface ProjectViewRendererHostProps {
  project: ProjectMeta
  mode: ProjectViewMode
  focusNodeId?: string
}

export function ProjectViewRendererHost({ project, mode, focusNodeId }: ProjectViewRendererHostProps) {
  if (mode === 'intelligence') {
    return <AppShell key={project.id} projectId={project.id} initialSelectedNodeId={focusNodeId} />
  }

  if (mode === 'code-navigation') {
    return <CodeNavigationView project={project} />
  }

  const data = project.graphData as {
    project: GraphNode
    nodes: GraphNode[]
    edges: GraphEdge[]
    alerts: Alert[]
    layerFilters: LayerFilter[]
  }

  return (
    <ProjectGraph
      project={data.project}
      nodes={data.nodes}
      edges={data.edges}
      alerts={data.alerts}
      layerFilters={data.layerFilters}
      initialSelectedNodeId={focusNodeId}
      onNodeSelect={(id) => console.log('[wiXplorer] Node selected:', id)}
      onNodeOpen={(id) => console.log('[wiXplorer] Open entity detail:', id)}
      onLayerToggle={(type: NodeType) => console.log('[wiXplorer] Layer toggled:', type)}
      onSearch={(q) => console.log('[wiXplorer] Search:', q)}
      onFitToScreen={() => console.log('[wiXplorer] Fit to screen')}
      onGoToMonitoring={(id) => console.log('[wiXplorer] Go to monitoring:', id)}
    />
  )
}
