import { buildTree } from '@/features/project-intelligence/lib/buildTree'
import { parseIntentDoc } from '@/features/project-intelligence/lib/parseIntentDoc'
import type { ParsedIntentDoc, ProjectIndex, ProjectTree } from '@/features/project-intelligence/types'

import rawIndexText from './project-intelligence.json?raw'

const intentDocsRaw = import.meta.glob('./*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

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

    return parsed
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse project-intelligence.json: ${message}`)
  }
}

function parseAllIntentDocs(): ParsedIntentDoc[] {
  const entries = Object.entries(intentDocsRaw)
    .filter(([sourcePath]) => !sourcePath.includes('/untitled folder/'))
    .sort(([a], [b]) => a.localeCompare(b))

  if (entries.length === 0) {
    throw new Error('No top-level intent markdown files found in data directory')
  }

  return entries.map(([sourcePath, markdown]) => {
    return parseIntentDoc(markdown as string, sourcePath)
  })
}

export function loadProjectIndex(): ProjectIndex {
  return parseProjectIndex(rawIndexText)
}

export function loadProjectTree(): ProjectTree {
  const index = loadProjectIndex()
  const intentDocs = parseAllIntentDocs()
  return buildTree(index, intentDocs)
}

export const PROJECT_TREE = loadProjectTree()
