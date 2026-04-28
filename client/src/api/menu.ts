import { api } from './client'

import type { MenuItemResponse, ProductTypeResponse, DiscountListItem } from '../types/api'

export function getMenu(): Promise<MenuItemResponse[]> {
  return api.get('/menu')
}

export function getProductTypes(): Promise<ProductTypeResponse[]> {
  return api.get('/menu/product-types')
}

export function getDiscounts(): Promise<DiscountListItem[]> {
  return api.get('/menu/discounts')
}
