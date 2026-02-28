import { Search } from 'lucide-react'

export function InspectorEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Select a node to inspect</h3>
      <p className="text-xs text-stone-500 dark:text-stone-400">Click any block in the map to open details.</p>
    </div>
  )
}
