import { Outlet } from 'react-router-dom'
import { LogOut, Clock } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'

export default function ExpediterLayout() {
  const { session, logout } = useAuth()
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-screen bg-canvas">
      {/* Top bar — minimal, per STYLE §4.3 */}
      <header className="h-10 flex-shrink-0 flex items-center justify-between px-4 bg-surface border-b border-subtle">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <Clock size={14} />
          <span className="font-mono tabular-nums">{now}</span>
        </div>
        <span className="text-sm font-medium text-primary">Kitchen</span>
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

      {/* Full-width ticket grid — Phase 5 will populate this */}
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
