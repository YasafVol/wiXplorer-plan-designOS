import { useState } from 'react'
import { BlameView } from '@/features/project-intelligence/components/inspector/BlameView'
import { InspectorEmpty } from '@/features/project-intelligence/components/inspector/InspectorEmpty'
import { InspectorLevel1 } from '@/features/project-intelligence/components/inspector/InspectorLevel1'
import { InspectorLevel2 } from '@/features/project-intelligence/components/inspector/InspectorLevel2'
import { InspectorLevel3 } from '@/features/project-intelligence/components/inspector/InspectorLevel3'
import type { ProjectNode, ProjectTree } from '@/features/project-intelligence/types'

interface InspectorPanelProps {
  tree: ProjectTree
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  onUpdateNode: (nodeId: string, updates: Partial<Pick<ProjectNode, 'label' | 'description'>>) => void
  onConfigQuickEdit: (params: {
    nodeId: string
    nodeLabel: string
    field: string
    metadataKey: string
    beforeValue: string
    nextValue: string
    beforeRaw: unknown
    beforeRawExists: boolean
  }) => void
  onFileQuickEdit: (nodeId: string, filePath: string) => void
}

export function InspectorPanel({
  tree,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onConfigQuickEdit,
  onFileQuickEdit,
}: InspectorPanelProps) {
  const selectedNode = selectedNodeId ? tree.nodesById[selectedNodeId] : null
  const [showBlame, setShowBlame] = useState(false)

  if (!selectedNode) {
    return <InspectorEmpty />
  }

  if (showBlame) {
    return <BlameView node={selectedNode} onClose={() => setShowBlame(false)} />
  }

  if (selectedNode.type === 'level1') {
    return <InspectorLevel1 node={selectedNode} tree={tree} onUpdateNode={onUpdateNode} onOpenBlame={() => setShowBlame(true)} />
  }

  if (selectedNode.type === 'level2') {
    return (
      <InspectorLevel2
        node={selectedNode}
        tree={tree}
        onSelectNode={onSelectNode}
        onUpdateNode={onUpdateNode}
        onOpenBlame={() => setShowBlame(true)}
      />
    )
  }

  return (
    <InspectorLevel3
      node={selectedNode}
      tree={tree}
      onSelectNode={onSelectNode}
      onUpdateNode={onUpdateNode}
      onConfigQuickEdit={onConfigQuickEdit}
      onFileQuickEdit={onFileQuickEdit}
      onOpenBlame={() => setShowBlame(true)}
    />
  )
}
