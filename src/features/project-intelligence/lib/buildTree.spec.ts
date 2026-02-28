import guestDiscoveryMarkdown from '@/features/project-intelligence/data/guest-discovery.md?raw'
import bookingFlowMarkdown from '@/features/project-intelligence/data/booking-flow.md?raw'
import loyaltyProgramMarkdown from '@/features/project-intelligence/data/loyalty-program.md?raw'
import staffOperationsMarkdown from '@/features/project-intelligence/data/staff-operations.md?raw'
import pmsIntegrationMarkdown from '@/features/project-intelligence/data/pms-integration.md?raw'
import retailMarkdown from '@/features/project-intelligence/data/retail.md?raw'
import { loadProjectIndex } from '@/features/project-intelligence/data'
import { buildTree } from '@/features/project-intelligence/lib/buildTree'
import { parseIntentDoc } from '@/features/project-intelligence/lib/parseIntentDoc'
import type { ParsedIntentDoc, ProjectIndex } from '@/features/project-intelligence/types'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`buildTree.spec failed: ${message}`)
  }
}

export function runBuildTreeSpec() {
  const projectIndex = loadProjectIndex() as ProjectIndex
  const docs: ParsedIntentDoc[] = [
    parseIntentDoc(guestDiscoveryMarkdown, 'guest-discovery.md'),
    parseIntentDoc(bookingFlowMarkdown, 'booking-flow.md'),
    parseIntentDoc(loyaltyProgramMarkdown, 'loyalty-program.md'),
    parseIntentDoc(staffOperationsMarkdown, 'staff-operations.md'),
    parseIntentDoc(pmsIntegrationMarkdown, 'pms-integration.md'),
    parseIntentDoc(retailMarkdown, 'retail.md'),
  ]

  const tree = buildTree(projectIndex, docs)
  assert(tree.nodes.length === projectIndex.nodes.length, 'node count should match index node count')
  assert(tree.roots.length === 6, 'should produce six level1 roots')
  assert(tree.nodesById['availability-cache']?.isMultiParent, 'availability-cache should be marked multi-parent')
  assert(tree.nodesById['room-status-collection']?.isMultiParent, 'room-status-collection should be marked multi-parent')
  assert(tree.nodesById['loyalty-ledger']?.isMultiParent, 'loyalty-ledger should be marked multi-parent')
  assert(tree.nodesById['availability-sync-job']?.isMultiParent, 'availability-sync-job should be marked multi-parent')
  assert(tree.nodesById['booking-flow']?.description !== null, 'booking-flow should have merged description')
  assert(tree.nodesById['siteminder-sync']?.status === 'warning', 'siteminder-sync should remain warning')
  assert(
    tree.nodes.filter((node) => node.description === null).length === 0,
    'all nodes in current fixture should have descriptions',
  )
  assert(
    tree.nodesById['availability-cache']?.connections.some((connection) => connection.id === 'availability-sync-job'),
    'availability-cache connections should be resolved to refs',
  )
  assert(
    tree.nodesById['availability-cache']?.connections.some((connection) => connection.id === 'availability-library'),
    'availability-cache should include cross-zone connection refs',
  )
}
