import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import TabsList from '../routes/ServerConsole/TabsList'

export default function ServerLayout() {
  const { session, logout } = useAuth()
  const [railOpen, setRailOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-canvas">
      {/* Top bar — 40px (STYLE §4.3) */}
      <header className="h-10 flex-shrink-0 flex items-center justify-between px-4 bg-surface border-b border-subtle z-10">
        <div className="flex items-center gap-3">
          {/* Mobile: tab list toggle */}
          <button
            onClick={() => setRailOpen(o => !o)}
            className="md:hidden text-muted hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            aria-label={railOpen ? 'Close tab list' : 'Open tab list'}
          >
            {railOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span className="text-sm font-medium text-primary">Server Console</span>
        </div>
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

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left rail — tab list (always visible on md+, slide-in on mobile) */}
        <aside
          className={[
            'w-72 flex-shrink-0 border-r border-subtle bg-surface flex flex-col overflow-y-auto',
            'absolute inset-y-0 left-0 z-20 transition-transform duration-150',
            'md:relative md:translate-x-0',
            railOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          ].join(' ')}
        >
          <TabsList onNavigate={() => setRailOpen(false)} />
        </aside>

        {/* Mobile overlay */}
        {railOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/60 md:hidden"
            onClick={() => setRailOpen(false)}
          />
        )}

        {/* Main panel */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
