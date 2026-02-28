import { buildBreadcrumb, buildCanonicalTreeProjection, buildDisplayTree } from '@/features/project-intelligence/lib/displayTree'
import type { ProjectTree } from '@/features/project-intelligence/types'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(`displayTree.spec failed: ${message}`)
  }
}

function fixtureTree(): ProjectTree {
  const root = {
    id: 'root',
    type: 'level1' as const,
    label: 'Root',
    description: null,
    intentSource: 'top-down' as const,
    status: 'healthy' as const,
    lastModified: '',
    lastModifiedBy: '',
    parentIds: [],
    children: [{ id: 'child', label: 'Child', type: 'level2' as const }],
    connections: [],
    files: [],
    isMultiParent: false,
    metadata: {},
    editHistory: [],
  }
  const child = {
    id: 'child',
    type: 'level2' as const,
    label: 'Child',
    description: null,
    intentSource: 'top-down' as const,
    status: 'healthy' as const,
    lastModified: '',
    lastModifiedBy: '',
    parentIds: ['root'],
    children: [{ id: 'leaf', label: 'Leaf', type: 'action' as const }],
    connections: [],
    files: [],
    isMultiParent: false,
    metadata: {},
    editHistory: [],
  }
  const leaf = {
    id: 'leaf',
    type: 'action' as const,
    label: 'Leaf',
    description: null,
    intentSource: 'top-down' as const,
    status: 'warning' as const,
    lastModified: '',
    lastModifiedBy: '',
    parentIds: ['child', 'root-b'],
    children: [],
    connections: [],
    files: [],
    isMultiParent: false,
    metadata: {},
    editHistory: [],
  }
  const secondaryRoot = {
    id: 'root-b',
    type: 'level1' as const,
    label: 'Root B',
    description: null,
    intentSource: 'top-down' as const,
    status: 'healthy' as const,
    lastModified: '',
    lastModifiedBy: '',
    parentIds: [],
    children: [{ id: 'leaf', label: 'Leaf', type: 'action' as const }],
    connections: [],
    files: [],
    isMultiParent: false,
    metadata: {},
    editHistory: [],
  }

  return {
    meta: {
      projectName: 'Fixture',
      projectSlug: 'fixture',
      lastHookRun: '',
      version: '1',
    },
    nodes: [root, child, leaf, secondaryRoot],
    nodesById: { root, child, leaf, 'root-b': secondaryRoot },
    roots: [root, secondaryRoot],
  }
}

export function runDisplayTreeSpec() {
  const tree = fixtureTree()
  const full = buildDisplayTree(tree, null)
  assert(full.children.length === 1, 'virtual root should include root node')
  assert(full.children[0]?.children[0]?.children[0]?.id === 'leaf', 'full tree should include leaf')

  const collapsed = buildDisplayTree(tree, null, new Set(['child']))
  assert(collapsed.children[0]?.children[0]?.id === 'child', 'collapsed tree should still include collapsed node')
  assert(collapsed.children[0]?.children[0]?.children.length === 0, 'collapsed node should hide descendants')

  const breadcrumb = buildBreadcrumb(tree, 'leaf')
  assert(breadcrumb.join(' > ') === 'root > child > leaf', 'breadcrumb should walk first-parent lineage')

  const canonical = buildCanonicalTreeProjection(tree)
  const allIds = new Set<string>()
  const walk = (node: (typeof canonical.children)[number]) => {
    assert(!allIds.has(node.id), `canonical projection should emit each node once: ${node.id}`)
    allIds.add(node.id)
    node.children.forEach(walk)
  }
  canonical.children.forEach(walk)

  assert(allIds.has('leaf'), 'canonical projection should still include shared node')
  const sharedLeaf = canonical.children[0]?.children[0]?.children[0]
  assert(Boolean(sharedLeaf?.isShared), 'shared leaf should be marked shared')
  assert(sharedLeaf?.sharedParentCount === 2, 'shared leaf should retain parent count metadata')
}
