import { Network, List, ShieldAlert, BookOpen, Circle } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badgeCount?: number
  isActive?: boolean
}

interface MainNavProps {
  items: NavItem[]
  onNavigate?: (href: string) => void
  collapsed?: boolean
}

const DEFAULT_NAV_ITEMS: Omit<NavItem, 'isActive'>[] = [
  { label: 'Project Graph', href: '/graph', icon: Network },
  { label: 'List Explorer', href: '/list', icon: List },
  { label: 'Health Monitor', href: '/health', icon: ShieldAlert },
  { label: 'Page Notebook', href: '/notebook', icon: BookOpen },
]

export function MainNav({ items, onNavigate, collapsed = false }: MainNavProps) {
  return (
    <nav className="flex-1 overflow-y-auto py-2">
      <ul className="space-y-0.5 px-2">
        {items.map((item) => {
          const Icon = item.icon ?? Circle
          return (
            <li key={item.href}>
              <button
                onClick={() => onNavigate?.(item.href)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group relative ${
                  item.isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <div className="relative shrink-0">
                  <Icon
                    className={`w-5 h-5 ${
                      item.isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`}
                  />
                  {item.badgeCount != null && item.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center font-[Inter]">
                      {item.badgeCount > 9 ? '9+' : item.badgeCount}
                    </span>
                  )}
                </div>

                {!collapsed && (
                  <span
                    className={`text-sm font-medium font-[Space_Grotesk] ${
                      item.isActive ? 'text-indigo-600 dark:text-indigo-400' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-[Inter]">
                    {item.label}
                    {item.badgeCount != null && item.badgeCount > 0 && (
                      <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1 rounded-full">
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { DEFAULT_NAV_ITEMS }
