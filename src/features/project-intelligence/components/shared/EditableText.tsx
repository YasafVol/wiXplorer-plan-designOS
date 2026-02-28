import { Check, Pencil, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

interface EditableTextProps {
  value: string | null
  placeholder: string
  onSave: (newValue: string) => void
  variant: 'label' | 'description'
}

export function EditableText({ value, placeholder, onSave, variant }: EditableTextProps) {
  const valueText = value ?? ''
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(valueText)
  const [showSaved, setShowSaved] = useState(false)
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (isEditing) {
      ref.current?.focus()
      if (variant === 'label' && ref.current instanceof HTMLInputElement) {
        ref.current.select()
      }
    }
  }, [isEditing, variant])

  const baseTextClass =
    variant === 'label'
      ? 'text-xl font-semibold text-stone-900 dark:text-stone-100'
      : 'text-sm leading-6 text-stone-700 dark:text-stone-300'

  const save = () => {
    onSave(draft.trim())
    setIsEditing(false)
    setShowSaved(true)
    window.setTimeout(() => setShowSaved(false), 2000)
  }

  const cancel = () => {
    setDraft(valueText)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        {variant === 'label' ? (
          <input
            ref={ref as RefObject<HTMLInputElement>}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                save()
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                cancel()
              }
            }}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xl font-semibold text-stone-900 outline-none ring-0 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        ) : (
          <textarea
            ref={ref as RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                cancel()
              }
              if (event.key === 'Enter' && event.metaKey) {
                event.preventDefault()
                save()
              }
            }}
            rows={4}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm leading-6 text-stone-900 outline-none ring-0 focus:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        )}
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={save}
            className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-emerald-700"
          >
            <Check className="h-3 w-3" />
            Save
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={cancel}
            className="inline-flex items-center gap-1 rounded bg-stone-100 px-2 py-1 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(valueText)
        setIsEditing(true)
      }}
      className={`group w-full text-left ${baseTextClass}`}
    >
      <span className={value ? '' : 'text-stone-400 dark:text-stone-500'}>{value ?? placeholder}</span>
      <Pencil className="ml-2 inline h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
      {showSaved ? <span className="ml-2 text-xs text-emerald-600">Saved</span> : null}
    </button>
  )
}
