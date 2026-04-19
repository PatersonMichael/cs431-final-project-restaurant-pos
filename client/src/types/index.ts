export interface Address {
  addressId: number;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Restaurant {
  storeNumber: number;
  phoneNumber: string;
  name: string;
  addressId: number;
  address?: Address;
}

export interface ProductType {
  typeId: number;
  name: string;
  description?: string;
}

export interface OrderableItem {
  itemId: number;
  itemType: "product" | "package";
  isAvailable: boolean;
}

export interface Product {
  productId: number;
  name: string;
  basePrice: string;
  typeId: number;
  productType?: ProductType;
  orderableItem?: OrderableItem;
}

export interface PackageProduct {
  productId: number;
  packageId: number;
  product?: Product;
}

export interface Package {
  packageId: number;
  name: string;
  bundlePrice: string;
  orderableItem?: OrderableItem;
  packageProducts?: PackageProduct[];
}

export interface OrderItem {
  orderItemId: number;
  orderId: number;
  itemId: number;
  quantity: number;
  priceAtPurchase: string;
  orderableItem?: OrderableItem & {
    product?: Product;
    package?: Package;
  };
}

export interface Card {
  cardId: number;
  cardholderName: string;
  token: string;
  lastFour: string;
  brand: string;
  expirationMonth: number;
  expirationYear: number;
}

export interface ElectronicPayment {
  cardId: number;
  paymentId: number;
  card?: Card;
}

export interface Payment {
  paymentId: number;
  orderId: number;
  type: string;
  amount: string;
  electronicPayments?: ElectronicPayment[];
}

export interface Discount {
  discountId: number;
  name: string;
  value: string;
  type: "percent" | "fixed";
}

export interface OrderDiscount {
  discountId: number;
  orderId: number;
  discount?: Discount;
}

export interface Order {
  orderId: number;
  customerName: string;
  timestamp: string;
  preparationStatus: string;
  storeNumber: number;
  discount?: string;
  total: string;
  subtotal: string;
  tip?: string;
  taxPercent: string;
  paymentStatus: string;
  employeeId?: number;
  orderItems?: OrderItem[];
  payments?: Payment[];
  orderDiscounts?: OrderDiscount[];
  balance?: number;
}

export interface Role {
  roleId: number;
  name: string;
  description?: string;
}

export interface EmployeeRole {
  employeeId: number;
  roleId: number;
  role?: Role;
}

export interface Shift {
  shiftId: number;
  employeeId: number;
  roleId: number;
  startTimestamp: string;
  endTimestamp: string;
  clockInTimestamp?: string;
  clockOutTimestamp?: string;
}

export interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  storeNumber: number;
  employmentStatus: string;
  dateOfBirth: string;
  hireDate: string;
  salary: string;
  addressId: number;
  address?: Address;
  employeeRoles?: EmployeeRole[];
  shifts?: Shift[];
}

export interface InventoryTransaction {
  transactionId: number;
  productId: number;
  quantityChange: number;
  reason: string;
  timestamp: string;
}

export interface InventoryItem {
  productId: number;
  name: string;
  basePrice: string;
  isAvailable: boolean;
  currentStock: number;
}

export interface InventoryDetail {
  productId: number;
  name: string;
  currentStock: number;
  transactions: InventoryTransaction[];
}

// Cart types for frontend state
export interface CartItem {
  itemId: number;
  name: string;
  quantity: number;
  priceAtPurchase: number;
  itemType: "product" | "package";
}
