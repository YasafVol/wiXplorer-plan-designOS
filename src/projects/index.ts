import smallData from '@/../product/sections/project-graph/data.json'
import largeData from '@/../product/sections/project-graph/data.large.json'
import mainCodeData from '@/../product/sections/project-graph/data.main-code.json'

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

const EMPTY_CODE_GRAPH = {
  project: {
    id: 'empty-code-project',
    type: 'project',
    label: 'Empty Code Project',
    source: 'DM',
    meta: {
      domain: 'empty.local',
      publishedAt: '2026-02-24T12:00:00Z',
      totalPages: 0,
      premium: false,
    },
    alertCount: 0,
  },
  nodes: [],
  edges: [],
  alerts: [],
  layerFilters: [
    { type: 'page', label: 'Pages', color: 'indigo', enabled: true },
    { type: 'app', label: 'Apps', color: 'cyan', enabled: true },
    { type: 'table', label: 'Tables', color: 'emerald', enabled: true },
    { type: 'code', label: 'Code', color: 'violet', enabled: true },
    { type: 'package', label: 'Packages', color: 'fuchsia', enabled: false },
    { type: 'analytics', label: 'Analytics', color: 'amber', enabled: false },
  ],
}

const CODE_CLIENT_SERVER_GRAPH = {
  ...EMPTY_CODE_GRAPH,
  project: {
    ...EMPTY_CODE_GRAPH.project,
    id: 'code-client-server-project',
    label: 'Code: Client & Server',
    meta: {
      ...EMPTY_CODE_GRAPH.project.meta,
      domain: 'code-client-server.local',
    },
  },
  nodes: [
    {
      id: 'node-extensions-root',
      type: 'code',
      label: 'extensions.ts',
      source: 'Velo',
      meta: {
        path: 'src/extensions.ts',
        fileType: 'site',
        linesOfCode: 12,
        lastModified: '2026-02-25T12:00:00Z',
        kind: 'extensionsRoot',
      },
      alertCount: 0,
    },
    {
      id: 'node-context-custom-context',
      type: 'code',
      label: 'custom-context',
      source: 'Velo',
      meta: {
        fileType: 'site',
        kind: 'scheduledJobGroup',
        subGraph: 'CONTEXTS',
        builderPath: 'src/client/contexts/custom-context/custom-context.extension.ts',
        handlerPath: 'src/client/contexts/custom-context/custom-context.ts',
        source: './custom-context.ts',
        linesOfCode: 24,
        lastModified: '2026-02-25T12:00:00Z',
      },
      alertCount: 0,
    },
    {
      id: 'node-context-builder-file',
      type: 'code',
      label: 'custom-context.extension.ts',
      source: 'Velo',
      meta: {
        path: 'src/client/contexts/custom-context/custom-context.extension.ts',
        fileType: 'site',
        kind: 'builderFile',
        subGraph: 'CONTEXTS',
        linesOfCode: 10,
        lastModified: '2026-02-25T12:00:00Z',
      },
      alertCount: 0,
    },
    {
      id: 'node-context-handler-file',
      type: 'code',
      label: 'custom-context.ts',
      source: 'Velo',
      meta: {
        path: 'src/client/contexts/custom-context/custom-context.ts',
        fileType: 'site',
        kind: 'handlerFile',
        subGraph: 'CONTEXTS',
        linesOfCode: 14,
        lastModified: '2026-02-25T12:00:00Z',
      },
      alertCount: 0,
    },
    {
      id: 'node-context-custom-context-2',
      type: 'code',
      label: 'custom-context-2',
      source: 'Velo',
      meta: {
        fileType: 'site',
        kind: 'scheduledJobGroup',
        subGraph: 'CONTEXTS',
        builderPath: 'src/client/contexts/custom-context-2/custom-context-2.extension.ts',
        handlerPath: 'src/client/contexts/custom-context-2/custom-context-2.ts',
        source: './custom-context-2.ts',
        linesOfCode: 26,
        lastModified: '2026-02-25T12:00:00Z',
      },
      alertCount: 0,
    },
    {
      id: 'node-context-2-builder-file',
      type: 'code',
      label: 'custom-context-2.extension.ts',
      source: 'Velo',
      meta: {
        path: 'src/client/contexts/custom-context-2/custom-context-2.extension.ts',
        fileType: 'site',
        kind: 'builderFile',
        subGraph: 'CONTEXTS',
        linesOfCode: 11,
        lastModified: '2026-02-25T12:00:00Z',
      },
      alertCount: 0,
    },
    {
      id: 'node-context-2-handler-file',
      type: 'code',
      label: 'custom-context-2.ts',
      source: 'Velo',
      meta: {
        path: 'src/client/contexts/custom-context-2/custom-context-2.ts',
        fileType: 'site',
        kind: 'handlerFile',
        subGraph: 'CONTEXTS',
        linesOfCode: 15,
        lastModified: '2026-02-25T12:00:00Z',
      },
      alertCount: 0,
    },
  ],
  edges: [
    {
      id: 'edge-extensions-custom-context',
      source: 'node-extensions-root',
      target: 'node-context-custom-context',
      type: 'contains',
      hasAlert: false,
    },
    {
      id: 'edge-custom-context-builder',
      source: 'node-context-custom-context',
      target: 'node-context-builder-file',
      type: 'contains',
      hasAlert: false,
    },
    {
      id: 'edge-custom-context-handler',
      source: 'node-context-custom-context',
      target: 'node-context-handler-file',
      type: 'contains',
      hasAlert: false,
    },
    {
      id: 'edge-extensions-custom-context-2',
      source: 'node-extensions-root',
      target: 'node-context-custom-context-2',
      type: 'contains',
      hasAlert: false,
    },
    {
      id: 'edge-custom-context-2-builder',
      source: 'node-context-custom-context-2',
      target: 'node-context-2-builder-file',
      type: 'contains',
      hasAlert: false,
    },
    {
      id: 'edge-custom-context-2-handler',
      source: 'node-context-custom-context-2',
      target: 'node-context-2-handler-file',
      type: 'contains',
      hasAlert: false,
    },
  ],
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
  {
    id: 'main-code',
    name: 'Code: Single Extension',
    description:
      'Code-first POC for Wix CLI extensions with a scheduled job group, explode/unpack behavior, and editable job inspector.',
    domain: (mainCodeData.project as { meta: { domain: string } }).meta.domain,
    pageCount: mainCodeData.nodes.filter((n) => n.type === 'page').length,
    nodeCount: mainCodeData.nodes.length + 1,
    edgeCount: mainCodeData.edges.length,
    data: mainCodeData,
  },
  {
    id: 'code-client-server',
    name: 'Code: Client & Server',
    description: 'Empty placeholder project for a future client/server code navigation scenario.',
    domain: 'code-client-server.local',
    pageCount: CODE_CLIENT_SERVER_GRAPH.nodes.filter((n) => n.type === 'page').length,
    nodeCount: CODE_CLIENT_SERVER_GRAPH.nodes.length + 1,
    edgeCount: CODE_CLIENT_SERVER_GRAPH.edges.length,
    data: CODE_CLIENT_SERVER_GRAPH,
  },
  {
    id: 'code-large-complicated',
    name: 'Code: Large, Complicated',
    description: 'Empty placeholder project for a future large-scale and complex code navigation scenario.',
    domain: 'code-large-complicated.local',
    pageCount: 0,
    nodeCount: 1,
    edgeCount: 0,
    data: {
      ...EMPTY_CODE_GRAPH,
      project: {
        ...EMPTY_CODE_GRAPH.project,
        id: 'code-large-complicated-project',
        label: 'Code: Large, Complicated',
        meta: {
          ...EMPTY_CODE_GRAPH.project.meta,
          domain: 'code-large-complicated.local',
        },
      },
    },
  },
]

export function getProject(id: string): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.id === id)
}
