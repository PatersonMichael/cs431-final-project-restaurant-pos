import { api } from './client'

import type { EmployeeResponse, RoleResponse } from '../types/api'

export function getEmployees(storeNumber?: number): Promise<EmployeeResponse[]> {
  const qs = storeNumber != null ? `?store_number=${storeNumber}` : ''
  return api.get(`/employees${qs}`)
}

export function getEmployeeRoles(employeeId: number): Promise<RoleResponse[]> {
  return api.get(`/employees/${employeeId}/roles`)
}
