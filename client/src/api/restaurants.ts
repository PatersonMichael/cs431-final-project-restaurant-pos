import { api } from './client'

import type { RestaurantResponse } from '../types/api'

export function getRestaurants(): Promise<RestaurantResponse[]> {
  return api.get('/restaurants')
}
