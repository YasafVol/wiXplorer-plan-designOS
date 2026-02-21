import smallData from '@/../product/sections/project-graph/data.json'
import largeData from '@/../product/sections/project-graph/data.large.json'

export interface ProjectMeta {
  id: string
  name: string
  description: string
  domain: string
  pageCount: number
  nodeCount: number
  edgeCount: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export const PROJECTS: ProjectMeta[] = [
  {
    id: 'small',
    name: 'Small Site',
    description: 'A focused Wix site with a shop, blog, and a few pages. Good for exploring core graph patterns.',
    domain: (smallData.project as { meta: { domain: string } }).meta.domain,
    pageCount: smallData.nodes.filter((n) => n.type === 'page').length,
    nodeCount: smallData.nodes.length + 1,
    edgeCount: smallData.edges.length,
    data: smallData,
  },
  {
    id: 'large',
    name: 'Large Site',
    description: 'A 50-page lifestyle brand with store, blog, community, and full account management. Use this to stress-test the graph layout.',
    domain: (largeData.project as { meta: { domain: string } }).meta.domain,
    pageCount: largeData.nodes.filter((n: { type: string }) => n.type === 'page').length,
    nodeCount: largeData.nodes.length + 1,
    edgeCount: largeData.edges.length,
    data: largeData,
  },
]

export function getProject(id: string): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.id === id)
}
