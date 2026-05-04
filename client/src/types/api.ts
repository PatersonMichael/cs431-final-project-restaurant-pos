// Frontend API types — mirrors server/src/types/api.ts (backend is source of truth)

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface CreateTabBody {
  customer_name?: string
  store_number: number
  employee_id: number
}

export interface PatchTabBody {
  customer_name?: string
  tip?: string
}

export interface AddItemBody {
  item_id: number
  quantity: number
}

export interface PatchItemBody {
  quantity: number
}

export interface ApplyDiscountBody {
  discount_id: number
}

export interface AddPaymentBody {
  type: 'cash' | 'electronic'
  amount: string
  card?: {
    cardholder_name: string
    last_four: string
    brand: string
    expiration_month: number
    expiration_year: number
  }
}

export interface AdjustInventoryBody {
  quantity_change: number
  reason: string
  note?: string
}

export interface CreateShiftBody {
  employee_id: number
  role_id: number
  start_timestamp: string
  end_timestamp: string
}

export interface PatchShiftBody {
  start_timestamp?: string
  end_timestamp?: string
  role_id?: number
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface OrderItemRow {
  order_item_id: number
  item_id: number
  quantity: number
  price_at_purchase: string
  kitchen_status: string
  fired_at: string | null
  name: string
  item_type: string
}

export interface Round {
  fired_at: string
  items: OrderItemRow[]
}

export interface DiscountRow {
  discount_id: number
  name: string
  value: string
  type: string
}

export interface PaymentRow {
  payment_id: number
  type: string
  amount: string
  card?: {
    card_id: number
    cardholder_name: string
    last_four: string
    brand: string
    expiration_month: number
    expiration_year: number
  }
}

export interface TabSummary {
  order_id: number
  customer_name: string | null
  timestamp: string
  preparation_status: string
  payment_status: string
  store_number: number
  employee_id: number | null
  employee_name: string | null
  subtotal: string
  total: string
  tip: string | null
  tax_percent: string
  item_count: number
  has_ready_items: boolean
}

export interface TabDetail {
  order_id: number
  customer_name: string | null
  timestamp: string
  preparation_status: string
  payment_status: string
  store_number: number
  employee_id: number | null
  subtotal: string
  total: string
  tip: string | null
  tax_percent: string
  staged: OrderItemRow[]
  rounds: Round[]
  discounts: DiscountRow[]
  payments: PaymentRow[]
}

export interface MenuItemResponse {
  item_id: number
  item_type: 'product' | 'package'
  is_available: boolean
  name: string
  price: string
  product_type_id?: number
  product_type_name?: string
}

export interface ProductTypeResponse {
  product_type_id: number
  name: string
}

export interface DiscountListItem {
  discount_id: number
  name: string
  value: string
  type: string
}

export interface RestaurantResponse {
  storeNumber: number
  name: string
  phoneNumber: string
}

export interface TicketResponse {
  order_id: number
  customer_name: string | null
  fired_at: string
  items: {
    order_item_id: number
    name: string
    item_type: string
    quantity: number
    kitchen_status: string
  }[]
}

export interface InventoryRow {
  product_id: number
  name: string
  base_price: string
  product_type_id: number
  product_type_name: string
  is_available: boolean
  is_infinite: boolean
  on_hand: number
}

export interface InventoryTransaction {
  transaction_id: number
  quantity_change: number
  reason: string
  note: string | null
  timestamp: string
}

export interface EmployeeResponse {
  employee_id: number
  first_name: string
  last_name: string
  store_number: number
}

export interface RoleResponse {
  role_id: number
  name: string
}

export interface ShiftResponse {
  shift_id: number
  employee_id: number
  employee_name: string
  role_id: number
  role_name: string
  start_timestamp: string
  end_timestamp: string
  clock_in_timestamp: string | null
  clock_out_timestamp: string | null
}

export interface OrderSummary {
  order_id: number
  customer_name: string | null
  timestamp: string
  preparation_status: string
  payment_status: string
  store_number: number
  employee_id: number | null
  employee_name: string | null
  subtotal: string
  total: string
}

export interface OrderDetail {
  order_id: number
  customer_name: string | null
  timestamp: string
  preparation_status: string
  payment_status: string
  store_number: number
  employee_id: number | null
  employee_name: string | null
  subtotal: string
  total: string
  tip: string | null
  tax_percent: string
  staged: OrderItemRow[]
  rounds: Round[]
  discounts: DiscountRow[]
  payments: PaymentRow[]
}

export interface InventoryHistoryResponse {
  product_id: number
  name: string
  on_hand: number
  is_infinite: boolean
  transactions: {
    transaction_id: number
    quantity_change: number
    reason: string
    timestamp: string
  }[]
}

// ─── Analytics types (FR-ANALYTICS-1 – FR-ANALYTICS-7) ───────────────────────

export interface AnalyticsPeriod {
  from: string
  to: string
}

export interface AnalyticsSummaryResponse {
  total_revenue: string
  total_orders: number
  average_order_value: string
  total_tips: string
  period: AnalyticsPeriod
}

export interface EmployeeSalesRow {
  employee_id: number
  name: string
  total_sales: string
  order_count: number
  average_ticket: string
  total_tips: string
}

export interface SalesByEmployeeResponse {
  employees: EmployeeSalesRow[]
}

export interface TopProductRow {
  product_id: number
  name: string
  category: string
  quantity_sold: number
  revenue: string
}

export interface TopProductsResponse {
  by_quantity: TopProductRow[]
  by_revenue: TopProductRow[]
}

export interface RevenueDataPoint {
  period: string
  revenue: string
  order_count: number
}

export interface RevenueOverTimeResponse {
  granularity: 'hour' | 'day'
  data: RevenueDataPoint[]
}

export interface CategoryRow {
  type_id: number
  category: string
  quantity_sold: number
  revenue: string
  percentage_of_revenue: number
}

export interface SalesByCategoryResponse {
  categories: CategoryRow[]
}

export interface PaymentMethodRow {
  type: string
  count: number
  total: string
  percentage: number
}

export interface CardBrandRow {
  brand: string
  count: number
  total: string
}

export interface PaymentMethodsResponse {
  methods: PaymentMethodRow[]
  card_brands: CardBrandRow[]
}

export interface DiscountUsageRow {
  discount_id: number
  name: string
  times_used: number
  total_value: string
  type: string
}

export interface DiscountUsageResponse {
  discounts: DiscountUsageRow[]
  total_discount_value: string
}
