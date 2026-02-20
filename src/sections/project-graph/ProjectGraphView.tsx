import data from '@/../product/sections/project-graph/data.json'
import { ProjectGraph } from './components/ProjectGraph'
import type { NodeType } from '@/../product/sections/project-graph/types'

export default function ProjectGraphView() {
  return (
    <ProjectGraph
      project={data.project as any}
      nodes={data.nodes as any}
      edges={data.edges as any}
      alerts={data.alerts as any}
      layerFilters={data.layerFilters as any}
      onNodeSelect={(id) => console.log('Node selected:', id)}
      onNodeOpen={(id) => console.log('Open entity detail:', id)}
      onLayerToggle={(type: NodeType) => console.log('Layer toggled:', type)}
      onSearch={(q) => console.log('Search:', q)}
      onFitToScreen={() => console.log('Fit to screen')}
      onGoToMonitoring={(id) => console.log('Go to monitoring for:', id)}
    />
  )
}
