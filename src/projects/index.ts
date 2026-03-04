import { SAMPLE_PROJECT_MANIFEST } from '@/projects/sampleProjectManifest'
import type { ProjectGraphPayload, ProjectViewCapabilities } from '@/projects/sampleProjectManifest'

export interface ProjectMeta {
  id: string
  name: string
  description: string
  domain: string
  viewCapabilities: ProjectViewCapabilities
  pageCount: number
  nodeCount: number
  edgeCount: number
  graphData: ProjectGraphPayload
  codeNavigationData: ProjectGraphPayload
  // Backward-compatible alias used by inventory and existing graph utilities.
  data: ProjectGraphPayload
}

export const PROJECTS: ProjectMeta[] = [
  ...SAMPLE_PROJECT_MANIFEST.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    domain: entry.domain,
    viewCapabilities: entry.views,
    pageCount: entry.graphData.nodes.filter((node) => node.type === 'page').length,
    nodeCount: entry.graphData.nodes.length + 1,
    edgeCount: entry.graphData.edges.length,
    graphData: entry.graphData,
    codeNavigationData: entry.codeNavigationData,
    data: entry.graphData,
  })),
]

export function getProject(id: string): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.id === id)
}
