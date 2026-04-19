import client from "./client";
import type { Package } from "../types";

export interface CreatePackagePayload {
  name: string;
  bundlePrice: number;
  productIds: number[];
}

export const getPackages = () =>
  client.get<Package[]>("/packages").then((r) => r.data);

export const getPackage = (id: number) =>
  client.get<Package>(`/packages/${id}`).then((r) => r.data);

export const createPackage = (payload: CreatePackagePayload) =>
  client.post<Package>("/packages", payload).then((r) => r.data);

export const updatePackageAvailability = (id: number, isAvailable: boolean) =>
  client.put<Package>(`/packages/${id}/availability`, { isAvailable }).then((r) => r.data);
