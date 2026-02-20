import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings, ChevronUp } from 'lucide-react'

interface UserMenuProps {
  user: { name: string; email?: string; avatarUrl?: string }
  onLogout?: () => void
  onSettings?: () => void
  collapsed?: boolean
}

export function UserMenu({ user, onLogout, onSettings, collapsed = false }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-white font-[Inter]">{initials}</span>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate font-[Space_Grotesk]">
                {user.name}
              </div>
              {user.email && (
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-[Inter]">
                  {user.email}
                </div>
              )}
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute z-50 bottom-full mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden ${
            collapsed ? 'left-full ml-2 w-48' : 'left-0 right-0'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-[Space_Grotesk]">
              {user.name}
            </div>
            {user.email && (
              <div className="text-xs text-slate-500 dark:text-slate-400 font-[Inter] mt-0.5">
                {user.email}
              </div>
            )}
          </div>
          <div className="py-1">
            {onSettings && (
              <button
                onClick={() => { onSettings(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-[Inter]"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )}
            {onLogout && (
              <button
                onClick={() => { onLogout(); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-[Inter]"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
