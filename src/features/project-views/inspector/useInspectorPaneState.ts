import { useCallback, useRef, useState } from 'react'

interface InspectorPaneStateOptions {
  defaultOpen?: boolean
  defaultWidth?: number
  minWidth?: number
  maxWidthRatio?: number
}

export function useInspectorPaneState(options: InspectorPaneStateOptions = {}) {
  const {
    defaultOpen = true,
    defaultWidth = 380,
    minWidth = 320,
    maxWidthRatio = 0.33,
  } = options

  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [width, setWidth] = useState(defaultWidth)
  const isDragging = useRef(false)

  const toggle = useCallback(() => {
    setIsOpen((current) => !current)
  }, [])

  const startResize = useCallback(
    (event: React.MouseEvent<HTMLElement>, container: HTMLElement | null) => {
      event.preventDefault()
      isDragging.current = true
      const startX = event.clientX
      const startWidth = width

      const onMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return
        const containerWidth = container?.offsetWidth ?? window.innerWidth
        const maxWidth = containerWidth * maxWidthRatio
        const delta = startX - moveEvent.clientX
        const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
        setWidth(nextWidth)
      }

      const onUp = () => {
        isDragging.current = false
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [width, minWidth, maxWidthRatio],
  )

  return {
    isOpen,
    width,
    toggle,
    setIsOpen,
    startResize,
  }
}
