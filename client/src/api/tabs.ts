import { api } from './client'

import type {
  TabSummary,
  TabDetail,
  CreateTabBody,
  PatchTabBody,
  AddItemBody,
  PatchItemBody,
  ApplyDiscountBody,
  AddPaymentBody,
  OrderItemRow,
} from '../types/api'

export function getTabs(storeNumber: number): Promise<TabSummary[]> {
  return api.get(`/tabs?store_number=${storeNumber}`)
}

export function createTab(body: CreateTabBody): Promise<TabDetail> {
  return api.post('/tabs', body)
}

export function getTab(orderId: number): Promise<TabDetail> {
  return api.get(`/tabs/${orderId}`)
}

export function patchTab(orderId: number, body: PatchTabBody): Promise<TabDetail> {
  return api.patch(`/tabs/${orderId}`, body)
}

export function addItem(orderId: number, body: AddItemBody): Promise<OrderItemRow> {
  return api.post(`/tabs/${orderId}/items`, body)
}

export function updateItem(orderId: number, itemId: number, body: PatchItemBody): Promise<OrderItemRow> {
  return api.patch(`/tabs/${orderId}/items/${itemId}`, body)
}

export function removeItem(orderId: number, itemId: number): Promise<void> {
  return api.delete(`/tabs/${orderId}/items/${itemId}`)
}

export function fireTab(orderId: number): Promise<TabDetail> {
  return api.post(`/tabs/${orderId}/fire`)
}

export function applyDiscount(orderId: number, body: ApplyDiscountBody): Promise<TabDetail> {
  return api.post(`/tabs/${orderId}/discounts`, body)
}

export function addPayment(orderId: number, body: AddPaymentBody): Promise<TabDetail> {
  return api.post(`/tabs/${orderId}/payments`, body)
}

export function deletePayment(orderId: number, paymentId: number): Promise<TabDetail> {
  return api.delete(`/tabs/${orderId}/payments/${paymentId}`)
}

export function deleteDiscount(orderId: number, discountId: number): Promise<TabDetail> {
  return api.delete(`/tabs/${orderId}/discounts/${discountId}`)
}

export function closeTab(orderId: number): Promise<TabDetail> {
  return api.post(`/tabs/${orderId}/close`)
}
