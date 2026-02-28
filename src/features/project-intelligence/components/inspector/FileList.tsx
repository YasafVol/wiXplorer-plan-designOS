import { FileCode2, FolderTree, Pencil, SquareArrowOutUpRight } from 'lucide-react'

interface FileListProps {
  files: string[]
  onQuickEdit: (filePath: string) => void
}

function deriveDirectory(files: string[]) {
  const first = files[0]
  if (!first) return ''
  const slash = first.lastIndexOf('/')
  return slash >= 0 ? first.slice(0, slash + 1) : ''
}

function fileName(filePath: string) {
  const slash = filePath.lastIndexOf('/')
  return slash >= 0 ? filePath.slice(slash + 1) : filePath
}

export function FileList({ files, onQuickEdit }: FileListProps) {
  const directory = deriveDirectory(files)

  return (
    <div className="space-y-2">
      {directory ? (
        <div className="rounded-md border border-stone-200 bg-white px-2.5 py-2 dark:border-stone-700 dark:bg-stone-900">
          <p className="mb-1 text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-400">Path</p>
          <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-200">
            <FolderTree className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
            <span className="font-mono">{directory}</span>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 rounded border border-stone-300 px-2 py-0.5 text-[11px] font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700"
            >
              <SquareArrowOutUpRight className="h-3 w-3" />
              Open in IDE
            </button>
          </div>
        </div>
      ) : null}

      {files.map((file) => (
        <div
          key={file}
          className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-2 py-2 dark:border-stone-700 dark:bg-stone-900"
        >
          <FileCode2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
          <span className="min-w-0 flex-1 truncate text-xs font-mono text-stone-600 dark:text-stone-300">
            {fileName(file)}
          </span>
          <button
            type="button"
            className="rounded border border-stone-300 px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-700"
          >
            Open in IDE
          </button>
          <button
            type="button"
            onClick={() => onQuickEdit(file)}
            className="inline-flex items-center gap-1 rounded border border-violet-300 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-600 dark:bg-violet-900/30 dark:text-violet-200 dark:hover:bg-violet-900/45"
          >
            <Pencil className="h-3 w-3" />
            Quick edit
          </button>
        </div>
      ))}
    </div>
  )
}
