export type NodeType = 'project' | 'page' | 'app' | 'table' | 'code' | 'analytics' | 'package'

export type EdgeType = 'contains' | 'hosts' | 'manages' | 'reads' | 'depends_on' | 'tracks' | 'imports' | 'triggers'

export type AlertSeverity = 'error' | 'warning' | 'info'

export type SourceSystem = 'DM' | 'DevCenter' | 'CMS' | 'Velo' | 'Analytics' | 'NPM'

export interface SchemaField {
  field: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'richtext' | 'array' | 'object'
}

export interface PageNodeMeta {
  url: string
  title: string
  isPublished: boolean
  hasPopup: boolean
  popupTrigger?: string
}

export interface AppNodeMeta {
  appId: string
  scope: 'site' | 'page'
  isManaged?: boolean
  languages?: string[]
  defaultLanguage?: string
  formCount?: number
  productCount?: number
  postCount?: number
}

export interface TableNodeMeta {
  collectionId: string
  rowCount: number
  schema: SchemaField[]
}

export interface CodeNodeMeta {
  path: string
  fileType: 'page' | 'backend' | 'site'
  linesOfCode: number
  lastModified: string
  schedule?: string
  description?: string
}

export interface PackageNodeMeta {
  packageName: string
  version: string
  registeredEvents: string[]
}

export interface AnalyticsNodeMeta {
  pageId: string
  views30d: number
  sessions30d: number
  bounceRate: number
  avgSessionDuration: number
}

export interface ProjectNodeMeta {
  domain: string
  publishedAt: string
  totalPages: number
  premium: boolean
}

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  source: SourceSystem
  meta: PageNodeMeta | AppNodeMeta | TableNodeMeta | CodeNodeMeta | AnalyticsNodeMeta | ProjectNodeMeta | PackageNodeMeta | Record<string, unknown>
  alertCount: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  hasAlert: boolean
}

export interface Alert {
  id: string
  nodeId: string
  severity: AlertSeverity
  message: string
  timestamp: string
  affectedEdgeIds: string[]
}

export interface LayerFilter {
  type: NodeType
  label: string
  color: string
  enabled: boolean
}

export interface ProjectGraphProps {
  project: GraphNode
  nodes: GraphNode[]
  edges: GraphEdge[]
  alerts: Alert[]
  layerFilters: LayerFilter[]
  /** Called when a node is single-clicked — highlights the node and its direct connections */
  onNodeSelect?: (nodeId: string | null) => void
  /** Called when a node is double-clicked — opens the Entity Detail drawer */
  onNodeOpen?: (nodeId: string) => void
  /** Called when a layer filter pill is toggled on or off */
  onLayerToggle?: (type: NodeType) => void
  /** Called when the search input changes */
  onSearch?: (query: string) => void
  /** Called when the fit-to-screen button is clicked */
  onFitToScreen?: () => void
  /** Called when "Go to Monitoring" is clicked on an alerted node */
  onGoToMonitoring?: (nodeId: string) => void
}
