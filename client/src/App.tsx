import { Navigate, Routes, Route } from 'react-router-dom'

import { useAuth } from './auth/AuthContext'
import Login from './auth/Login'

import ServerLayout    from './layouts/ServerLayout'
import ExpediterLayout from './layouts/ExpediterLayout'
import ManagerLayout   from './layouts/ManagerLayout'

import TabDetail        from './routes/ServerConsole/TabDetail'
import Closeout         from './routes/ServerConsole/Closeout'
import ExpediterBoard   from './routes/Expediter/ExpediterBoard'
import ExpediterArchive from './routes/Expediter/ExpediterArchive'
import OrdersList       from './routes/Manager/OrdersList'
import OrderDetail      from './routes/Manager/OrderDetail'
import Inventory        from './routes/Manager/Inventory'
import Schedule         from './routes/Manager/Schedule'
import Analytics        from './routes/Manager/Analytics'

// ─── Route guards ─────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (session.active_role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { session } = useAuth()

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          session
            ? <Navigate to={roleHome(session.active_role)} replace />
            : <Login />
        }
      />

      {/* Server console (FR-AUTH-3) */}
      <Route
        path="/server"
        element={
          <RequireRole role="server">
            <ServerLayout />
          </RequireRole>
        }
      >
        <Route
          index
          element={
            <div className="flex flex-1 items-center justify-center text-muted text-sm">
              Select a tab or create a new one.
            </div>
          }
        />
        <Route path="tabs/:orderId"          element={<TabDetail />} />
        <Route path="tabs/:orderId/closeout" element={<Closeout />} />
      </Route>

      {/* Expediter (FR-AUTH-3) */}
      <Route
        path="/expediter"
        element={
          <RequireRole role="kitchen">
            <ExpediterLayout />
          </RequireRole>
        }
      >
        <Route index        element={<ExpediterBoard />} />
        <Route path="archive" element={<ExpediterArchive />} />
      </Route>

      {/* Manager console (FR-AUTH-3, FR-MGR-1,2,3, FR-INV-1,2,3,4, FR-SCH-1,2,3,4) */}
      <Route
        path="/manager"
        element={
          <RequireRole role="manager">
            <ManagerLayout />
          </RequireRole>
        }
      >
        <Route index              element={<Navigate to="/manager/orders" replace />} />
        <Route path="orders"      element={<OrdersList />} />
        <Route path="orders/:orderId" element={<OrderDetail />} />
        <Route path="inventory"   element={<Inventory />} />
        <Route path="schedule"    element={<Schedule />} />
        <Route path="analytics"   element={<Analytics />} />
      </Route>

      {/* Root: redirect based on session */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Navigate to={session ? roleHome(session.active_role) : '/login'} replace />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function roleHome(role: string): string {
  if (role === 'server')  return '/server'
  if (role === 'kitchen') return '/expediter'
  if (role === 'manager') return '/manager'
  return '/login'
}
