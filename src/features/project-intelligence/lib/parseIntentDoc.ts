import type { EditEvent, NodeType, ParsedIntentDoc } from '@/features/project-intelligence/types'

const ID_COMMENT = /^<!--\s*id:\s*([a-z0-9-]+)\s*-->$/i
const TYPE_COMMENT = /^<!--\s*type:\s*([a-z0-9-]+)\s*-->$/i

function parseEditHistory(lines: string[]): EditEvent[] {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2))
    .map((value) => {
      const parts = value.split(/\s[—-]\s/)
      const left = parts[0] ?? ''
      const change = parts.slice(1).join(' - ')
      const [timestamp = '', author = 'unknown'] = left.trim().split(/\s+/, 2)
      return {
        timestamp,
        author,
        change: change.trim(),
      }
    })
    .filter((entry) => entry.timestamp.length > 0)
}

function cleanDescription(lines: string[]): string | null {
  const text = lines
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
  return text.length > 0 ? text : null
}

export function parseIntentDoc(markdown: string, sourcePath: string): ParsedIntentDoc {
  const lines = markdown.split(/\r?\n/)
  const nodesById: ParsedIntentDoc['nodesById'] = {}

  let activeNodeId: string | null = null
  let activeNodeLabel = ''
  let activeNodeType: NodeType | undefined
  let activeHeadingLevel: 1 | 2 | 3 | null = null
  let descriptionBuffer: string[] = []
  let editHistoryBuffer: string[] = []
  let inEditHistory = false
  let level1Id: string | null = null
  const headingByNodeId = new Map<string, string>()

  function contextMessage(message: string, lineNumber: number, heading?: string) {
    const headingPart = heading ? ` (heading: "${heading}")` : ''
    return `${message} at ${sourcePath}:${lineNumber}${headingPart}`
  }

  function flushNode() {
    if (!activeNodeId) {
      descriptionBuffer = []
      editHistoryBuffer = []
      inEditHistory = false
      return
    }

    nodesById[activeNodeId] = {
      id: activeNodeId,
      label: activeNodeLabel,
      type: activeNodeType,
      description: cleanDescription(descriptionBuffer),
      editHistory: parseEditHistory(editHistoryBuffer),
    }

    descriptionBuffer = []
    editHistoryBuffer = []
    inEditHistory = false
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (line === '---') {
      i += 1
      continue
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line)
    if (headingMatch) {
      const level = headingMatch[1].length
      const title = headingMatch[2].trim()

      if (level === 2 && title.toLowerCase() === 'edit history' && activeHeadingLevel === 1) {
        inEditHistory = true
        i += 1
        continue
      }

      if (level <= 3) {
        flushNode()
        activeHeadingLevel = level as 1 | 2 | 3
        activeNodeLabel = title
        activeNodeId = null
        activeNodeType = undefined
        inEditHistory = false

        const idLine = (lines[i + 1] ?? '').trim()
        const idMatch = ID_COMMENT.exec(idLine)
        if (!idMatch) {
          throw new Error(contextMessage('Missing id comment after heading', i + 1, title))
        }

        activeNodeId = idMatch[1]
        if (headingByNodeId.has(activeNodeId)) {
          throw new Error(
            contextMessage(
              `Duplicate node id "${activeNodeId}" already defined by heading "${headingByNodeId.get(activeNodeId) ?? 'unknown'}"`,
              i + 1,
              title,
            ),
          )
        }
        headingByNodeId.set(activeNodeId, title)

        if (level === 1) {
          level1Id = activeNodeId
        }
        i += 2

        // Optional type comment only for level-3 nodes
        if (level === 3) {
          const maybeTypeLine = (lines[i] ?? '').trim()
          const typeMatch = TYPE_COMMENT.exec(maybeTypeLine)
          if (typeMatch) {
            activeNodeType = typeMatch[1] as NodeType
            i += 1
          }
        }

        continue
      }

      if (level === 4 && title.toLowerCase() === 'edit history') {
        if (activeHeadingLevel !== 3) {
          throw new Error(
            contextMessage('Artifact edit history appears under non-artifact block', i + 1, activeNodeLabel),
          )
        }
        inEditHistory = true
        i += 1
        continue
      }
    }

    if (/^##\s+Edit History$/i.test(line) && activeHeadingLevel === 1) {
      inEditHistory = true
      i += 1
      continue
    }

    if (inEditHistory) {
      editHistoryBuffer.push(lines[i])
    } else {
      descriptionBuffer.push(lines[i])
    }
    i += 1
  }

  flushNode()

  return {
    sourcePath,
    level1Id,
    nodesById,
  }
}
