import client from "./client";
import type { Restaurant } from "../types";

export interface CreateRestaurantPayload {
  phoneNumber: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface UpdateRestaurantPayload {
  phoneNumber?: string;
  name?: string;
}

export const getRestaurants = () =>
  client.get<Restaurant[]>("/restaurants").then((r) => r.data);

export const getRestaurant = (id: number) =>
  client.get<Restaurant>(`/restaurants/${id}`).then((r) => r.data);

export const createRestaurant = (payload: CreateRestaurantPayload) =>
  client.post<Restaurant>("/restaurants", payload).then((r) => r.data);

export const updateRestaurant = (id: number, payload: UpdateRestaurantPayload) =>
  client.put<Restaurant>(`/restaurants/${id}`, payload).then((r) => r.data);
