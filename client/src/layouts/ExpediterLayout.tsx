import { Outlet, NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { cn } from '../lib/cn'

export default function ExpediterLayout() {
  const { session, logout } = useAuth()

  return (
    <div className="flex flex-col h-screen bg-canvas">
      {/* Top bar */}
      <header className="h-10 flex-shrink-0 flex items-center justify-between px-4 bg-surface border-b border-subtle">
        {/* Board / Archive nav */}
        <nav className="flex items-center gap-1">
          <TabLink to="/expediter">Board</TabLink>
          <TabLink to="/expediter/archive">Archive</TabLink>
        </nav>

        <span className="text-sm font-medium text-primary">Kitchen</span>

        <div className="flex items-center gap-3">
          {session && (
            <span className="hidden sm:inline text-sm text-secondary">
              {session.first_name} {session.last_name}
            </span>
          )}
          <button
            onClick={logout}
            className="text-muted hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'px-3 py-1 text-sm rounded transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isActive
            ? 'bg-surface-2 text-primary font-medium'
            : 'text-muted hover:text-secondary',
        )
      }
    >
      {children}
    </NavLink>
  )
}
