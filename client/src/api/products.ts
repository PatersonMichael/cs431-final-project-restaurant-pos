import client from "./client";
import type { Product } from "../types";

export interface CreateProductPayload {
  name: string;
  basePrice: number;
  typeId: number;
}

export const getProducts = () =>
  client.get<Product[]>("/products").then((r) => r.data);

export const getProduct = (id: number) =>
  client.get<Product>(`/products/${id}`).then((r) => r.data);

export const createProduct = (payload: CreateProductPayload) =>
  client.post<Product>("/products", payload).then((r) => r.data);

export const updateProductAvailability = (id: number, isAvailable: boolean) =>
  client.put<Product>(`/products/${id}/availability`, { isAvailable }).then((r) => r.data);
