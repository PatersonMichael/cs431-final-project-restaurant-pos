import { api } from './client'

import type { InventoryRow, InventoryTransaction, AdjustInventoryBody } from '../types/api'

export function getInventory(productTypeId?: number): Promise<InventoryRow[]> {
  const qs = productTypeId != null ? `?product_type_id=${productTypeId}` : ''
  return api.get(`/inventory${qs}`)
}

export function getInventoryHistory(productId: number): Promise<InventoryTransaction[]> {
  return api.get(`/inventory/${productId}/history`)
}

export function adjustInventory(productId: number, body: AdjustInventoryBody): Promise<void> {
  return api.post(`/inventory/${productId}/adjust`, body)
}
