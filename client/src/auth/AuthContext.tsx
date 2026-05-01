import { createContext, useContext, useState, useCallback } from 'react'

import type { RoleResponse } from '../types/api'

export interface Session {
  employee_id: number
  first_name: string
  last_name: string
  store_number: number
  roles: RoleResponse[]
  active_role: string   // 'server' | 'kitchen' | 'manager'
}

interface AuthContextValue {
  session: Session | null
  login: (session: Session) => void
  logout: () => void
}

const SESSION_KEY = 'pos_session'

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)

  const login = useCallback((s: Session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setSession(s)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Role-category helpers (FR-AUTH-3)
const SERVER_ROLES  = new Set(['server', 'cashier'])
const KITCHEN_ROLES = new Set(['cook', 'prep', 'expo', 'runner'])
const MANAGER_ROLES = new Set(['manager', 'gm', 'support'])

export type RoleCategory = 'server' | 'kitchen' | 'manager'

export function getRoleCategories(roles: RoleResponse[]): RoleCategory[] {
  const cats = new Set<RoleCategory>()
  for (const r of roles) {
    const name = r.name.toLowerCase()
    if (SERVER_ROLES.has(name))  cats.add('server')
    if (KITCHEN_ROLES.has(name)) cats.add('kitchen')
    if (MANAGER_ROLES.has(name)) cats.add('manager')
  }
  return Array.from(cats)
}
