import bookingFlowMarkdown from '@/features/project-intelligence/data/booking-flow.md?raw'
import { parseIntentDoc } from '@/features/project-intelligence/lib/parseIntentDoc'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`parseIntentDoc.spec failed: ${message}`)
  }
}

export function runParseIntentDocSpec() {
  const parsed = parseIntentDoc(bookingFlowMarkdown, 'booking-flow.md')
  const nodeCount = Object.keys(parsed.nodesById).length

  assert(parsed.level1Id === 'booking-flow', 'level1 id should be booking-flow')
  assert(nodeCount >= 11, `expected at least 11 parsed nodes, got ${nodeCount}`)
  assert(Boolean(parsed.nodesById['availability-cache']), 'availability-cache node should exist')
  assert(
    parsed.nodesById['availability-cache']?.description?.includes('stale'),
    'availability-cache description should include stale context',
  )
  assert(
    (parsed.nodesById['availability-cache']?.editHistory.length ?? 0) > 0,
    'availability-cache edit history should be parsed',
  )
  assert(
    parsed.nodesById['availability-sync-job']?.editHistory[0]?.change.includes('scheduler'),
    'availability-sync-job edit history should parse em-dash separators',
  )
}
