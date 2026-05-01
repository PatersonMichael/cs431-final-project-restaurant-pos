import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { getEmployees, getEmployeeRoles } from '../api/employees'
import { getRestaurants } from '../api/restaurants'
import { useAuth, getRoleCategories } from './AuthContext'

import type { EmployeeResponse, RoleResponse, RestaurantResponse } from '../types/api'
import type { RoleCategory } from './AuthContext'

const ROLE_LABELS: Record<RoleCategory, string> = {
  server:  'Server Console',
  kitchen: 'Kitchen / Expediter',
  manager: 'Manager Console',
}

const ROLE_ROUTES: Record<RoleCategory, string> = {
  server:  '/server',
  kitchen: '/expediter',
  manager: '/manager',
}

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [stores,       setStores]       = useState<RestaurantResponse[]>([])
  const [storeNumber,  setStoreNumber]  = useState<number | ''>('')
  const [employees,    setEmployees]    = useState<EmployeeResponse[]>([])
  const [employeeId,   setEmployeeId]   = useState<number | ''>('')
  const [loadingEmps,  setLoadingEmps]  = useState(false)
  const [roles,        setRoles]        = useState<RoleResponse[]>([])
  const [categories,   setCategories]   = useState<RoleCategory[]>([])
  const [activeRole,   setActiveRole]   = useState<RoleCategory | ''>('')
  const [error,        setError]        = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  // Fetch stores on mount
  useEffect(() => {
    getRestaurants()
      .then(data => {
        setStores(data)
        if (data.length === 1) setStoreNumber(data[0]!.storeNumber)
      })
      .catch(() => setError('Could not load stores. Is the server running?'))
  }, [])

  useEffect(() => {
    if (storeNumber === '') return
    setLoadingEmps(true)
    setEmployeeId('')
    setRoles([])
    setCategories([])
    setActiveRole('')
    setError('')
    getEmployees(storeNumber)
      .then(setEmployees)
      .catch(() => setError('Could not load employees. Is the server running?'))
      .finally(() => setLoadingEmps(false))
  }, [storeNumber])

  useEffect(() => {
    if (employeeId === '') {
      setRoles([])
      setCategories([])
      setActiveRole('')
      return
    }
    getEmployeeRoles(employeeId)
      .then(r => {
        setRoles(r)
        const cats = getRoleCategories(r)
        setCategories(cats)
        setActiveRole(cats.length === 1 ? cats[0]! : '')
      })
      .catch(() => setError('Could not load roles for that employee.'))
  }, [employeeId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (employeeId === '' || activeRole === '') return
    setSubmitting(true)
    setError('')
    try {
      const emp = employees.find(em => em.employee_id === employeeId)
      if (!emp) { setError('Employee not found.'); return }
      login({
        employee_id:  emp.employee_id,
        first_name:   emp.first_name,
        last_name:    emp.last_name,
        store_number: emp.store_number,
        roles,
        active_role:  activeRole,
      })
      navigate(ROLE_ROUTES[activeRole])
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface border border-edge rounded-lg">
        <div className="px-6 py-4 border-b border-subtle">
          <h1 className="text-lg font-semibold text-primary">Restaurant POS</h1>
          <p className="text-sm text-secondary mt-0.5">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Store selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="store">
              Store
            </label>
            <select
              id="store"
              value={storeNumber}
              onChange={e => setStoreNumber(Number(e.target.value))}
              disabled={stores.length === 0}
              className="bg-input border border-edge text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:border-strong focus:ring-2 focus:ring-accent/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {stores.length === 0
                ? <option value="">Loading stores…</option>
                : stores.map(s => (
                    <option key={s.storeNumber} value={s.storeNumber}>
                      Store #{s.storeNumber} — {s.name}
                    </option>
                  ))
              }
            </select>
          </div>

          {/* Employee selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary" htmlFor="employee">
              Employee
            </label>
            <select
              id="employee"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={loadingEmps}
              className="bg-input border border-edge text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:border-strong focus:ring-2 focus:ring-accent/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingEmps ? 'Loading…' : '— select employee —'}
              </option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Role chooser (only when employee has multiple role categories) */}
          {categories.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary">
                Sign in as
              </label>
              <div className="flex flex-col gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveRole(cat)}
                    className={[
                      'px-4 py-2.5 rounded-md border text-sm font-medium text-left transition-colors duration-150',
                      activeRole === cat
                        ? 'bg-accent-bg border-accent text-accent'
                        : 'bg-surface-2 border-edge text-primary hover:bg-surface-3',
                    ].join(' ')}
                  >
                    {ROLE_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || employeeId === '' || activeRole === ''}
            className="mt-2 bg-accent hover:bg-accent-hover text-inverse font-medium rounded-md px-4 py-2.5 text-base transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
