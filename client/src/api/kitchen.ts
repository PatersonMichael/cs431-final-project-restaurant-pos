import { api } from './client'

import type { TicketResponse } from '../types/api'

export function getTickets(storeNumber: number): Promise<TicketResponse[]> {
  return api.get(`/kitchen/tickets?store_number=${storeNumber}`)
}

export function updateItemStatus(itemId: number, kitchen_status: string): Promise<void> {
  return api.patch(`/kitchen/items/${itemId}`, { kitchen_status })
}

export function bumpTicket(orderId: number, firedAt: string): Promise<void> {
  return api.patch(`/kitchen/tickets/${orderId}/${encodeURIComponent(firedAt)}`)
}
