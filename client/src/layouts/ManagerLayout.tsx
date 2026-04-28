import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, ClipboardList, Package, Calendar } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { cn } from '../lib/cn'

const NAV_ITEMS = [
  { to: '/manager/orders',    label: 'Orders',    Icon: ClipboardList },
  { to: '/manager/inventory', label: 'Inventory', Icon: Package       },
  { to: '/manager/schedule',  label: 'Schedule',  Icon: Calendar      },
]

export default function ManagerLayout() {
  const { session, logout } = useAuth()

  return (
    <div className="flex flex-col h-screen bg-canvas">
      {/* Top bar */}
      <header className="h-10 flex-shrink-0 flex items-center justify-between px-4 bg-surface border-b border-subtle">
        <span className="text-sm font-medium text-primary">Manager Console</span>
        <div className="flex items-center gap-3">
          {session && (
            <span className="text-sm text-secondary">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <nav className="w-44 flex-shrink-0 bg-surface border-r border-subtle flex flex-col py-2">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'text-primary bg-accent-bg border-r-2 border-accent'
                    : 'text-secondary hover:text-primary hover:bg-surface-2',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Main content — Phase 6 will populate this */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
