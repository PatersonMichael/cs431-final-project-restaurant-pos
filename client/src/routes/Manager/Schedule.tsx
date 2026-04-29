import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useAuth } from '../../auth/AuthContext'
import { getSchedule, createShift, updateShift, deleteShift } from '../../api/schedule'
import { getEmployees, getEmployeeRoles } from '../../api/employees'
import { Modal } from '../../components/Modal'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import { cn } from '../../lib/cn'
import type { ShiftResponse, EmployeeResponse, RoleResponse } from '../../types/api'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateForm {
  employee_id: number
  date: string        // YYYY-MM-DD
  role_id: number | ''
  start_time: string  // HH:MM
  end_time: string
}

interface EditForm {
  shift: ShiftResponse
  role_id: number | ''
  start_time: string
  end_time: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Schedule() {
  const { session } = useAuth()

  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [shifts, setShifts]       = useState<ShiftResponse[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Create modal
  const [createForm, setCreateForm] = useState<CreateForm | null>(null)
  const [createRoles, setCreateRoles] = useState<RoleResponse[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)

  // Edit / view modal
  const [editForm, setEditForm]   = useState<EditForm | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const storeNumber = session?.store_number

  useEffect(() => {
    if (storeNumber == null) return
    getEmployees(storeNumber).then(setEmployees).catch(() => {})
  }, [storeNumber])

  const fetchShifts = useCallback(async () => {
    if (storeNumber == null) return
    setLoading(true)
    setError(null)
    try {
      const from = weekStart.toISOString()
      const to   = addDays(weekStart, 7).toISOString()
      setShifts(await getSchedule(storeNumber, from, to))
    } catch {
      setError('Failed to load schedule.')
    } finally {
      setLoading(false)
    }
  }, [storeNumber, weekStart])

  useEffect(() => { void fetchShifts() }, [fetchShifts])

  // Build grid: key `${employeeId}-${dayIndex}` → ShiftResponse[]
  const grid = new Map<string, ShiftResponse[]>()
  for (const shift of shifts) {
    const shiftDate = new Date(shift.start_timestamp)
    const dayIdx = weekDays.findIndex(d => isSameDay(d, shiftDate))
    if (dayIdx === -1) continue
    const key = `${shift.employee_id}-${dayIdx}`
    const bucket = grid.get(key) ?? []
    bucket.push(shift)
    grid.set(key, bucket)
  }

  // ─── Open create modal ──────────────────────────────────────────────────────

  async function openCreate(employee: EmployeeResponse, dayIdx: number) {
    const date = localDateStr(weekDays[dayIdx]!)
    setCreateForm({
      employee_id: employee.employee_id,
      date,
      role_id: '',
      start_time: '09:00',
      end_time: '17:00',
    })
    setCreateError(null)
    setCreateRoles([])
    try {
      const roles = await getEmployeeRoles(employee.employee_id)
      setCreateRoles(roles)
    } catch {
      // roles stay empty — backend will reject invalid role
    }
  }

  async function submitCreate() {
    if (!createForm || createForm.role_id === '') {
      setCreateError('Select a role.')
      return
    }
    const start = new Date(`${createForm.date}T${createForm.start_time}:00`)
    const end   = new Date(`${createForm.date}T${createForm.end_time}:00`)
    if (end <= start) {
      setCreateError('End time must be after start time.')
      return
    }
    setCreateLoading(true)
    setCreateError(null)
    try {
      await createShift({
        employee_id:     createForm.employee_id,
        role_id:         createForm.role_id,
        start_timestamp: start.toISOString(),
        end_timestamp:   end.toISOString(),
      })
      setCreateForm(null)
      void fetchShifts()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create shift.'
      setCreateError(msg.includes('role') ? 'Employee does not hold that role.' : msg)
    } finally {
      setCreateLoading(false)
    }
  }

  // ─── Open edit modal ────────────────────────────────────────────────────────

  function openEdit(shift: ShiftResponse) {
    setEditForm({
      shift,
      role_id:    shift.role_id,
      start_time: new Date(shift.start_timestamp).toTimeString().slice(0, 5),
      end_time:   new Date(shift.end_timestamp).toTimeString().slice(0, 5),
    })
    setEditError(null)
  }

  async function submitEdit() {
    if (!editForm || editForm.role_id === '') {
      setEditError('Select a role.')
      return
    }
    const shiftDate = localDateStr(new Date(editForm.shift.start_timestamp))
    const start = new Date(`${shiftDate}T${editForm.start_time}:00`)
    const end   = new Date(`${shiftDate}T${editForm.end_time}:00`)
    if (end <= start) {
      setEditError('End time must be after start time.')
      return
    }
    setEditLoading(true)
    setEditError(null)
    try {
      await updateShift(editForm.shift.shift_id, {
        role_id:         editForm.role_id,
        start_timestamp: start.toISOString(),
        end_timestamp:   end.toISOString(),
      })
      setEditForm(null)
      void fetchShifts()
    } catch {
      setEditError('Failed to update shift.')
    } finally {
      setEditLoading(false)
    }
  }

  async function submitDelete() {
    if (!editForm) return
    setEditLoading(true)
    setEditError(null)
    try {
      await deleteShift(editForm.shift.shift_id)
      setEditForm(null)
      void fetchShifts()
    } catch {
      setEditError('Failed to cancel shift.')
    } finally {
      setEditLoading(false)
    }
  }

  const clocked = editForm?.shift.clock_in_timestamp !== null

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-primary">Schedule</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(w => addDays(w, -7))}
            className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-primary min-w-40 text-center">
            {fmtDate(weekStart)} — {fmtDate(addDays(weekStart, 6))}
          </span>
          <button
            onClick={() => setWeekStart(w => addDays(w, 7))}
            className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="ml-2 text-xs text-accent hover:underline"
          >
            Today
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Grid */}
      <div className="bg-surface border border-edge rounded-md overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-subtle">
              <th className="px-3 py-2 text-left font-medium text-secondary w-36">Employee</th>
              {weekDays.map((d, i) => (
                <th key={i} className="px-2 py-2 text-center font-medium text-secondary">
                  <div>{DAY_NAMES[i]}</div>
                  <div className={cn(
                    'text-xs font-normal mt-0.5',
                    isSameDay(d, new Date()) ? 'text-accent font-semibold' : 'text-muted',
                  )}>
                    {fmtDate(d)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">Loading…</td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">No employees found.</td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.employee_id} className="border-b border-subtle last:border-0">
                  <td className="px-3 py-2 text-primary font-medium align-top">
                    {emp.first_name} {emp.last_name}
                  </td>
                  {weekDays.map((_, dayIdx) => {
                    const cellShifts = grid.get(`${emp.employee_id}-${dayIdx}`) ?? []
                    return (
                      <td
                        key={dayIdx}
                        className="px-1 py-1 align-top border-l border-subtle min-w-[100px] cursor-pointer hover:bg-surface-2 transition-colors"
                        onClick={() => void openCreate(emp, dayIdx)}
                      >
                        <div className="space-y-1 min-h-[2.5rem]">
                          {cellShifts.map(shift => (
                            <button
                              key={shift.shift_id}
                              onClick={e => { e.stopPropagation(); openEdit(shift) }}
                              className={cn(
                                'w-full text-left px-2 py-1 rounded text-xs font-medium transition-colors',
                                shift.clock_in_timestamp !== null
                                  ? 'bg-success-bg text-success'
                                  : 'bg-info-bg text-info hover:bg-accent hover:text-white',
                              )}
                            >
                              <div>{fmtTime(shift.start_timestamp)}–{fmtTime(shift.end_timestamp)}</div>
                              <div className="opacity-75">{shift.role_name}</div>
                            </button>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create shift modal */}
      <Modal
        open={createForm !== null}
        onClose={() => setCreateForm(null)}
        title="Add Shift"
        footer={
          <>
            <Button intent="secondary" onClick={() => setCreateForm(null)}>Cancel</Button>
            <Button intent="primary" loading={createLoading} onClick={() => void submitCreate()}>
              Create
            </Button>
          </>
        }
      >
        {createForm && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-secondary mb-1">Employee</label>
              <p className="text-sm text-primary font-medium">
                {employees.find(e => e.employee_id === createForm.employee_id)?.first_name}{' '}
                {employees.find(e => e.employee_id === createForm.employee_id)?.last_name}
              </p>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Date</label>
              <p className="text-sm text-primary">{createForm.date}</p>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Role</label>
              <select
                value={createForm.role_id}
                onChange={e => setCreateForm(f => f && ({ ...f, role_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full bg-input border border-edge text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="">Select role…</option>
                {createRoles.map(r => (
                  <option key={r.role_id} value={r.role_id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-secondary mb-1">Start</label>
                <Input
                  type="time"
                  value={createForm.start_time}
                  onChange={e => setCreateForm(f => f && ({ ...f, start_time: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-secondary mb-1">End</label>
                <Input
                  type="time"
                  value={createForm.end_time}
                  onChange={e => setCreateForm(f => f && ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
            {createError && <p className="text-sm text-danger">{createError}</p>}
          </div>
        )}
      </Modal>

      {/* Edit / view shift modal */}
      <Modal
        open={editForm !== null}
        onClose={() => setEditForm(null)}
        title={clocked ? 'Shift (Clocked In)' : 'Edit Shift'}
        footer={
          clocked ? (
            <Button intent="secondary" onClick={() => setEditForm(null)}>Close</Button>
          ) : (
            <>
              <Button intent="danger" loading={editLoading} onClick={() => void submitDelete()}>
                Cancel Shift
              </Button>
              <Button intent="primary" loading={editLoading} onClick={() => void submitEdit()}>
                Save
              </Button>
            </>
          )
        }
      >
        {editForm && (
          <div className="space-y-4">
            {clocked && (
              <p className="text-sm text-warning bg-warning-bg rounded px-3 py-2">
                Employee has clocked in — this shift cannot be edited.
              </p>
            )}
            <div>
              <label className="block text-xs text-secondary mb-1">Employee</label>
              <p className="text-sm text-primary">{editForm.shift.employee_name}</p>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Role</label>
              {clocked ? (
                <p className="text-sm text-primary">{editForm.shift.role_name}</p>
              ) : (
                <select
                  value={editForm.role_id}
                  onChange={e => setEditForm(f => f && ({ ...f, role_id: Number(e.target.value) }))}
                  className="w-full bg-input border border-edge text-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  disabled={clocked}
                >
                  <option value={editForm.shift.role_id}>{editForm.shift.role_name}</option>
                </select>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-secondary mb-1">Start</label>
                <Input
                  type="time"
                  value={editForm.start_time}
                  onChange={e => setEditForm(f => f && ({ ...f, start_time: e.target.value }))}
                  disabled={clocked}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-secondary mb-1">End</label>
                <Input
                  type="time"
                  value={editForm.end_time}
                  onChange={e => setEditForm(f => f && ({ ...f, end_time: e.target.value }))}
                  disabled={clocked}
                />
              </div>
            </div>
            {editError && <p className="text-sm text-danger">{editError}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
