import client from "./client";
import type { Order } from "../types";

export interface CreateOrderPayload {
  customerName: string;
  storeNumber: number;
  taxPercent: number;
  tip?: number;
  employeeId?: number;
  discountIds?: number[];
  items: { itemId: number; quantity: number; priceAtPurchase: number }[];
}

export const getOrders = () =>
  client.get<Order[]>("/orders").then((r) => r.data);

export const getOrder = (id: number) =>
  client.get<Order>(`/orders/${id}`).then((r) => r.data);

export const createOrder = (payload: CreateOrderPayload) =>
  client.post<Order>("/orders", payload).then((r) => r.data);

export const updateOrderStatus = (id: number, preparationStatus: string) =>
  client.put<Order>(`/orders/${id}/status`, { preparationStatus }).then((r) => r.data);
