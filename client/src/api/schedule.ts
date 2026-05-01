import { api } from './client'

import type { ShiftResponse, CreateShiftBody, PatchShiftBody } from '../types/api'

export function getSchedule(storeNumber: number, from: string, to: string): Promise<ShiftResponse[]> {
  return api.get(`/schedule?store_number=${storeNumber}&from=${from}&to=${to}`)
}

export function createShift(body: CreateShiftBody): Promise<ShiftResponse> {
  return api.post('/schedule', body)
}

export function updateShift(shiftId: number, body: PatchShiftBody): Promise<ShiftResponse> {
  return api.patch(`/schedule/${shiftId}`, body)
}

export function deleteShift(shiftId: number): Promise<void> {
  return api.delete(`/schedule/${shiftId}`)
}
