import client from "./client";
import type { InventoryItem, InventoryDetail } from "../types";

export interface CreateInventoryTransactionPayload {
  productId: number;
  quantityChange: number;
  reason: string;
}

export interface CreateInventoryTransactionResponse {
  transaction: InventoryDetail["transactions"][number];
  currentStock: number;
}

export const getInventory = () =>
  client.get<InventoryItem[]>("/inventory").then((r) => r.data);

export const getInventoryForProduct = (productId: number) =>
  client.get<InventoryDetail>(`/inventory/${productId}`).then((r) => r.data);

export const createInventoryTransaction = (payload: CreateInventoryTransactionPayload) =>
  client.post<CreateInventoryTransactionResponse>("/inventory", payload).then((r) => r.data);
