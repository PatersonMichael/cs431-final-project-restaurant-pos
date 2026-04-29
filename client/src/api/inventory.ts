import { api } from './client'

import type { InventoryRow, InventoryHistoryResponse, AdjustInventoryBody } from '../types/api'

export function getInventory(productTypeId?: number): Promise<InventoryRow[]> {
  const qs = productTypeId != null ? `?product_type_id=${productTypeId}` : ''
  return api.get(`/inventory${qs}`)
}

export function getInventoryHistory(productId: number): Promise<InventoryHistoryResponse> {
  return api.get(`/inventory/${productId}/history`)
}

export function setAvailability(productId: number, isAvailable: boolean): Promise<void> {
  return api.patch(`/inventory/${productId}/availability`, { is_available: isAvailable })
}

export function adjustInventory(
  productId: number,
  body: AdjustInventoryBody,
): Promise<{ transaction_id: number; on_hand: number }> {
  return api.post(`/inventory/${productId}/adjust`, body)
}
