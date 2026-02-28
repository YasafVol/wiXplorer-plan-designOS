export type NodeType =
  | 'level1'
  | 'level2'
  | 'collection'
  | 'action'
  | 'job'
  | 'router'
  | 'event'
  | 'api'
  | 'service-plugin'
  | 'dashboard-page'
  | 'dashboard-plugin'
  | 'dashboard-modal'
  | 'menu-plugin'
  | 'embedded-script'
  | 'style'
  | 'function-library'
  | 'context'

export type IntentSource = 'top-down' | 'bottom-up' | 'reconciled' | 'user-edited'
export type NodeStatus = 'healthy' | 'warning' | 'error' | 'unknown'

export interface NodeRef {
  id: string
  label: string
  type: NodeType
}

export interface EditEvent {
  timestamp: string
  author: string
  change: string
}

export interface ProjectNode {
  id: string
  type: NodeType
  label: string
  description: string | null
  intentSource: IntentSource
  status: NodeStatus
  lastModified: string
  lastModifiedBy: string
  parentIds: string[]
  children: NodeRef[]
  connections: NodeRef[]
  files: string[]
  isMultiParent: boolean
  metadata: Record<string, unknown>
  editHistory: EditEvent[]
}

export interface ProjectTree {
  meta: {
    projectName: string
    projectSlug: string
    lastHookRun: string
    version: string
  }
  nodes: ProjectNode[]
  nodesById: Record<string, ProjectNode>
  roots: ProjectNode[]
}

export interface ProjectIndexNode {
  id: string
  type: NodeType
  label: string
  intentSource: IntentSource
  status: NodeStatus
  lastModified: string
  lastModifiedBy: string
  parentIds: string[]
  children: string[]
  connections: string[]
  files: string[]
  isMultiParent: boolean
  metadata: Record<string, unknown>
}

export interface ProjectIndex {
  meta: ProjectTree['meta']
  nodes: ProjectIndexNode[]
}

export interface ParsedIntentNode {
  id: string
  label: string
  type?: NodeType
  description: string | null
  editHistory: EditEvent[]
}

export interface ParsedIntentDoc {
  sourcePath: string
  level1Id: string | null
  nodesById: Record<string, ParsedIntentNode>
}

export interface InspectorAction {
  id: string
  label: string
  type: 'navigate' | 'open-ide' | 'open-chat' | 'open-modal' | 'external-link'
  target: string
  condition?: 'always' | 'on-warning' | 'on-error'
  stub: boolean
}

export type PendingChangeSection = 'configuration' | 'file'
export type PendingChangeSource = 'inline-quick-edit' | 'modal-quick-edit'

export interface PendingChange {
  id: string
  nodeId: string
  nodeLabel: string
  section: PendingChangeSection
  field: string
  beforeValue: string
  afterValue: string
  source: PendingChangeSource
  timestamp: string
  metadataKey?: string
  beforeRaw?: unknown
  beforeRawExists?: boolean
  filePath?: string
}

export type NodeCategory = 'level1' | 'level2' | 'server' | 'dashboard' | 'site' | 'data'

export const NODE_CATEGORY: Record<NodeType, NodeCategory> = {
  level1: 'level1',
  level2: 'level2',
  action: 'server',
  api: 'server',
  event: 'server',
  router: 'server',
  job: 'server',
  'service-plugin': 'server',
  'dashboard-page': 'dashboard',
  'dashboard-plugin': 'dashboard',
  'dashboard-modal': 'dashboard',
  'menu-plugin': 'dashboard',
  'embedded-script': 'site',
  style: 'site',
  'function-library': 'site',
  context: 'site',
  collection: 'data',
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  level1: 'Intent Zone',
  level2: 'Feature Cluster',
  action: 'Server Action',
  api: 'HTTP Endpoint',
  event: 'Event Listener',
  router: 'Router',
  job: 'Scheduled Job',
  'service-plugin': 'Service Plugin',
  'dashboard-page': 'Dashboard Page',
  'dashboard-plugin': 'Dashboard Plugin',
  'dashboard-modal': 'Dashboard Modal',
  'menu-plugin': 'Menu Plugin',
  'embedded-script': 'Embedded Script',
  style: 'Global Style',
  'function-library': 'Function Library',
  context: 'Context',
  collection: 'Collection',
}
