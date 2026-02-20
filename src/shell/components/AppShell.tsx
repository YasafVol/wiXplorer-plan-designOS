import { useState } from 'react'
import { ChevronDown, ChevronsLeft, ChevronsRight, Menu, X, Globe } from 'lucide-react'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'
import type { NavItem } from './MainNav'

export interface SiteOption {
  id: string
  name: string
  domain?: string
}

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavItem[]
  user?: { name: string; email?: string; avatarUrl?: string }
  sites?: SiteOption[]
  activeSiteId?: string
  onNavigate?: (href: string) => void
  onSiteChange?: (siteId: string) => void
  onLogout?: () => void
  onSettings?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  sites = [],
  activeSiteId,
  onNavigate,
  onSiteChange,
  onLogout,
  onSettings,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [siteMenuOpen, setSiteMenuOpen] = useState(false)

  const activeSite = sites.find((s) => s.id === activeSiteId) ?? sites[0]

  const sidebarContent = (isMobile = false) => (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ${
        collapsed && !isMobile ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800 ${
          collapsed && !isMobile ? 'justify-center' : 'gap-2.5'
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-white" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-[Space_Grotesk]">
            wiXplorer
          </span>
        )}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Site Selector */}
      {activeSite && (
        <div className="px-2 py-3 border-b border-slate-100 dark:border-slate-800 relative">
          <button
            onClick={() => setSiteMenuOpen(!siteMenuOpen)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
              collapsed && !isMobile ? 'justify-center' : ''
            }`}
          >
            <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 font-[Inter]">
                {activeSite.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            {(!collapsed || isMobile) && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate font-[Space_Grotesk]">
                    {activeSite.name}
                  </div>
                  {activeSite.domain && (
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-[Inter]">
                      {activeSite.domain}
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    siteMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </>
            )}
          </button>

          {/* Site dropdown */}
          {siteMenuOpen && sites.length > 1 && (
            <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
              {sites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => {
                    onSiteChange?.(site.id)
                    setSiteMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left ${
                    site.id === activeSiteId ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 font-[Inter]">
                      {site.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate font-[Space_Grotesk]">
                      {site.name}
                    </div>
                    {site.domain && (
                      <div className="text-[11px] text-slate-400 truncate font-[Inter]">
                        {site.domain}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <MainNav items={navigationItems} onNavigate={onNavigate} collapsed={collapsed && !isMobile} />

      {/* User Menu */}
      {user && (
        <div className="px-2 py-3 border-t border-slate-100 dark:border-slate-800">
          <UserMenu
            user={user}
            onLogout={onLogout}
            onSettings={onSettings}
            collapsed={collapsed && !isMobile}
          />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">{sidebarContent()}</div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate-600 dark:text-slate-400"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white font-[Space_Grotesk]">
            wiXplorer
          </span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex flex-col w-72 max-w-[85vw]">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-full overflow-y-auto">{sidebarContent(true)}</div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
