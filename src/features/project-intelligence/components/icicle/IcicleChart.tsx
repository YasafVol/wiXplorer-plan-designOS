import { useEffect, useMemo, useRef, useState } from 'react'
import { IcicleNode } from '@/features/project-intelligence/components/icicle/IcicleNode'
import { useIcicleLayout } from '@/features/project-intelligence/components/icicle/useIcicleLayout'
import type { ProjectTree } from '@/features/project-intelligence/types'

interface IcicleChartProps {
  tree: ProjectTree
  selectedNodeId: string | null
  zoomRootId: string | null
  onNodeClick: (nodeId: string) => void
  onNodeDoubleClick: (nodeId: string) => void
  onZoomOut: () => void
}

export function IcicleChart({
  tree,
  selectedNodeId,
  zoomRootId,
  onNodeClick,
  onNodeDoubleClick,
  onZoomOut,
}: IcicleChartProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const target = wrapRef.current
    if (!target) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      })
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  const { nodes, breadcrumb } = useIcicleLayout(tree, zoomRootId, size.width, size.height - (zoomRootId ? 36 : 0))
  const breadcrumbNodes = useMemo(() => breadcrumb.map((id) => tree.nodesById[id]).filter(Boolean), [breadcrumb, tree])

  return (
    <div ref={wrapRef} className="flex h-full flex-col overflow-hidden">
      {zoomRootId ? (
        <div className="flex h-9 items-center gap-1 border-b border-stone-200 bg-white px-3 text-xs dark:border-stone-700 dark:bg-stone-900">
          <button type="button" onClick={onZoomOut} className="font-medium text-stone-600 hover:underline dark:text-stone-300">
            {tree.meta.projectName}
          </button>
          {breadcrumbNodes.map((crumb) => (
            <div key={crumb.id} className="inline-flex items-center gap-1">
              <span className="text-stone-400">/</span>
              <button
                type="button"
                onClick={() => onNodeDoubleClick(crumb.id)}
                className="text-stone-600 hover:underline dark:text-stone-300"
              >
                {crumb.label}
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <svg className="h-full w-full bg-[var(--pi-color-bg)]">
        <defs>
          <pattern id="pi-diagonal-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="var(--pi-color-data)" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          </pattern>
        </defs>
        {nodes.map((node) => (
          <IcicleNode
            key={`${node.id}-${node.x}-${node.y}`}
            node={node}
            selected={selectedNodeId === node.id}
            onClick={onNodeClick}
            onDoubleClick={onNodeDoubleClick}
          />
        ))}
      </svg>
    </div>
  )
}
