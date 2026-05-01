import { api } from './client'

import type { OrderSummary, OrderDetail } from '../types/api'

export interface OrderFilters {
  from?: string
  to?: string
  status?: string
  employee_id?: number
  store_number?: number
}

export function getOrders(filters: OrderFilters = {}): Promise<OrderSummary[]> {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.status) params.set('status', filters.status)
  if (filters.employee_id != null) params.set('employee_id', String(filters.employee_id))
  if (filters.store_number != null) params.set('store_number', String(filters.store_number))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return api.get(`/orders${qs}`)
}

export function getOrderDetail(orderId: number): Promise<OrderDetail> {
  return api.get(`/orders/${orderId}`)
}
