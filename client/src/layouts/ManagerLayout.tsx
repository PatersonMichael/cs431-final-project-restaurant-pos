import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, ClipboardList, Package, Calendar, BarChart2, Menu, X } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { cn } from '../lib/cn'

const NAV_ITEMS = [
  { to: '/manager/orders',    label: 'Orders',    Icon: ClipboardList },
  { to: '/manager/inventory', label: 'Inventory', Icon: Package       },
  { to: '/manager/schedule',  label: 'Schedule',  Icon: Calendar      },
  { to: '/manager/analytics', label: 'Analytics', Icon: BarChart2     },
]

export default function ManagerLayout() {
  const { session, logout } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-canvas">
      {/* Top bar */}
      <header className="h-10 flex-shrink-0 flex items-center justify-between px-4 bg-surface border-b border-subtle z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNavOpen(o => !o)}
            className="md:hidden text-muted hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          >
            {navOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span className="text-sm font-medium text-primary">Manager Console</span>
        </div>
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

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left nav — slide-in on mobile, always visible on md+ */}
        <nav
          className={cn(
            'w-44 flex-shrink-0 bg-surface border-r border-subtle flex flex-col py-2',
            'absolute inset-y-0 left-0 z-20 transition-transform duration-150',
            'md:relative md:translate-x-0',
            navOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setNavOpen(false)}
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

        {/* Mobile overlay */}
        {navOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/60 md:hidden"
            onClick={() => setNavOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
