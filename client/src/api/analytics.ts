import { api } from './client'
import type {
  AnalyticsSummaryResponse,
  SalesByEmployeeResponse,
  TopProductsResponse,
  RevenueOverTimeResponse,
  SalesByCategoryResponse,
  PaymentMethodsResponse,
  DiscountUsageResponse,
} from '../types/api'

function dateParams(from: string, to: string, storeNumber?: number): string {
  const p = new URLSearchParams({ from, to })
  if (storeNumber != null) p.set('store_number', String(storeNumber))
  return p.toString()
}

export function getSummary(from: string, to: string, storeNumber?: number) {
  return api.get<AnalyticsSummaryResponse>(`/analytics/summary?${dateParams(from, to, storeNumber)}`)
}

export function getSalesByEmployee(from: string, to: string, storeNumber?: number) {
  return api.get<SalesByEmployeeResponse>(`/analytics/sales-by-employee?${dateParams(from, to, storeNumber)}`)
}

export function getTopProducts(from: string, to: string, limit = 10, storeNumber?: number) {
  const p = new URLSearchParams({ from, to, limit: String(limit) })
  if (storeNumber != null) p.set('store_number', String(storeNumber))
  return api.get<TopProductsResponse>(`/analytics/top-products?${p.toString()}`)
}

export function getRevenueOverTime(from: string, to: string, storeNumber?: number) {
  return api.get<RevenueOverTimeResponse>(`/analytics/revenue-over-time?${dateParams(from, to, storeNumber)}`)
}

export function getSalesByCategory(from: string, to: string, storeNumber?: number) {
  return api.get<SalesByCategoryResponse>(`/analytics/sales-by-category?${dateParams(from, to, storeNumber)}`)
}

export function getPaymentMethods(from: string, to: string, storeNumber?: number) {
  return api.get<PaymentMethodsResponse>(`/analytics/payment-methods?${dateParams(from, to, storeNumber)}`)
}

export function getDiscountUsage(from: string, to: string, storeNumber?: number) {
  return api.get<DiscountUsageResponse>(`/analytics/discounts?${dateParams(from, to, storeNumber)}`)
}
