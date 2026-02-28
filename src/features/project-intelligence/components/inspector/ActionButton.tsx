import { useState } from 'react'

interface ActionButtonProps {
  label: string
  onClick?: () => void
  stub?: boolean
}

export function ActionButton({ label, onClick, stub = false }: ActionButtonProps) {
  const [showStubTip, setShowStubTip] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (stub) {
            setShowStubTip(true)
            window.setTimeout(() => setShowStubTip(false), 2000)
            return
          }
          onClick?.()
        }}
        className="rounded-md border border-stone-200 bg-stone-100 px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
      >
        {label}
      </button>
      {showStubTip ? (
        <div className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-[11px] text-white dark:bg-stone-100 dark:text-stone-900">
          Coming in Phase 2
        </div>
      ) : null}
    </div>
  )
}
