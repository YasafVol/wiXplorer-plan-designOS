import { Network, List, ShieldAlert, BookOpen } from 'lucide-react'
import { AppShell } from './components/AppShell'
import type { NavItem, SiteOption } from './components'

const navigationItems: NavItem[] = [
  { label: 'Project Graph', href: '/graph', icon: Network, isActive: true },
  { label: 'List Explorer', href: '/list', icon: List },
  { label: 'Health Monitor', href: '/health', icon: ShieldAlert, badgeCount: 2 },
  { label: 'Page Notebook', href: '/notebook', icon: BookOpen },
]

const sites: SiteOption[] = [
  { id: 'site-1', name: 'My Business Site', domain: 'mybusiness.wixsite.com' },
  { id: 'site-2', name: 'Portfolio', domain: 'portfolio.wixsite.com' },
  { id: 'site-3', name: 'Shop & Blog', domain: 'shopblog.wixsite.com' },
]

const user = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  avatarUrl: undefined,
}

export default function ShellPreview() {
  return (
    <AppShell
      navigationItems={navigationItems}
      user={user}
      sites={sites}
      activeSiteId="site-1"
      onNavigate={(href) => console.log('Navigate to:', href)}
      onSiteChange={(id) => console.log('Switch site:', id)}
      onLogout={() => console.log('Logout')}
      onSettings={() => console.log('Settings')}
    >
      {/* Sample content area */}
      <div className="p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-[Space_Grotesk]">
            Project Graph
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-[Inter]">
            The layered visualization of your project's entities and their connections will render here.
          </p>
          <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm font-[Inter]">
            Graph canvas
          </div>
        </div>
      </div>
    </AppShell>
  )
}
