import { buildTree } from '@/features/project-intelligence/lib/buildTree'
import { parseIntentDoc } from '@/features/project-intelligence/lib/parseIntentDoc'
import { getSampleProjectManifestEntry } from '@/projects/sampleProjectManifest'
import type { ActivationStatus, IntentSource, NodeStatus, ParsedIntentDoc, ProjectIndex, ProjectIndexNode, ProjectTree } from '@/features/project-intelligence/types'

function stripJsonComments(text: string): string {
  let output = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i += 1) {
    const current = text[i]
    const next = text[i + 1]

    if (inString) {
      output += current
      if (escaped) {
        escaped = false
      } else if (current === '\\') {
        escaped = true
      } else if (current === '"') {
        inString = false
      }
      continue
    }

    if (current === '"') {
      inString = true
      output += current
      continue
    }

    if (current === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') {
        i += 1
      }
      output += '\n'
      continue
    }

    if (current === '/' && next === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        i += 1
      }
      i += 1
      continue
    }

    output += current
  }

  return output
}

function parseProjectIndex(rawText: string): ProjectIndex {
  try {
    const sanitized = stripJsonComments(rawText)
    const parsed = JSON.parse(sanitized) as ProjectIndex

    if (!parsed || !Array.isArray(parsed.nodes) || !parsed.meta) {
      throw new Error('Expected root object with "meta" and "nodes"')
    }

    const duplicateIds = new Set<string>()
    const seenIds = new Set<string>()
    for (const node of parsed.nodes) {
      if (seenIds.has(node.id)) {
        duplicateIds.add(node.id)
      }
      seenIds.add(node.id)
    }

    if (duplicateIds.size > 0) {
      throw new Error(`Duplicate node ids in index: ${Array.from(duplicateIds).join(', ')}`)
    }

    const normalizedNodes = parsed.nodes.map((node) => normalizeIndexNode(node))
    return { ...parsed, nodes: normalizedNodes }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse project-intelligence.json: ${message}`)
  }
}

function normalizeIntentSource(intentSource: IntentSource): IntentSource {
  switch (intentSource) {
    case 'top-down':
      return 'user-chat'
    case 'bottom-up':
      return 'inferred-from-code'
    default:
      return intentSource
  }
}

function normalizeActivationStatus(activationStatus: ActivationStatus | undefined): ActivationStatus {
  return activationStatus === 'disabled' ? 'disabled' : 'enabled'
}

function normalizeHealthStatus(status: NodeStatus | undefined): NodeStatus {
  if (status === 'healthy' || status === 'warning' || status === 'error' || status === 'unknown') {
    return status
  }
  return 'unknown'
}

function normalizeIndexNode(node: ProjectIndexNode): ProjectIndexNode {
  const healthStatus = normalizeHealthStatus(node.healthStatus ?? node.status)
  const activationStatus = normalizeActivationStatus(node.activationStatus)
  return {
    ...node,
    intentSource: normalizeIntentSource(node.intentSource),
    healthStatus,
    status: healthStatus,
    activationStatus,
    connections: node.connections ?? [],
  }
}

function parseAllIntentDocs(rawDocs: Record<string, string>): ParsedIntentDoc[] {
  const entries = Object.entries(rawDocs).sort(([a], [b]) => a.localeCompare(b))

  if (entries.length === 0) {
    throw new Error('No intent markdown files found for the selected project')
  }

  return entries.map(([sourcePath, markdown]) => {
    return parseIntentDoc(markdown, sourcePath)
  })
}

function resolveProjectIntelligencePayload(projectId: string): { indexRaw: string; docsRaw: Record<string, string> } {
  const manifestEntry = getSampleProjectManifestEntry(projectId)
  if (!manifestEntry) {
    throw new Error(`Unknown project id "${projectId}"`)
  }

  return {
    indexRaw: manifestEntry.intelligenceIndexRaw,
    docsRaw: manifestEntry.intelligenceDocsRaw,
  }
}

export function loadProjectIndex(projectId = 'hotel-meridian'): ProjectIndex {
  const { indexRaw } = resolveProjectIntelligencePayload(projectId)
  return parseProjectIndex(indexRaw)
}

export function loadProjectTree(projectId = 'hotel-meridian'): ProjectTree {
  const { docsRaw } = resolveProjectIntelligencePayload(projectId)
  const index = loadProjectIndex(projectId)
  const intentDocs = parseAllIntentDocs(docsRaw)
  return buildTree(index, intentDocs)
}

export const PROJECT_TREE = loadProjectTree('hotel-meridian')
