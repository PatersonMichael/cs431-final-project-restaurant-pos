import client from "./client";
import type { Payment } from "../types";

export interface CardData {
  cardholderName: string;
  lastFour: string;
  brand: string;
  expirationMonth: number;
  expirationYear: number;
}

export interface CreatePaymentPayload {
  orderId: number;
  type: string;
  amount: number;
  cardData?: CardData;
}

export interface CreatePaymentResponse {
  payment: Payment;
  paymentStatus: string;
  balance: number;
}

export const getPaymentsForOrder = (orderId: number) =>
  client.get<Payment[]>(`/payments/orders/${orderId}`).then((r) => r.data);

export const createPayment = (payload: CreatePaymentPayload) =>
  client.post<CreatePaymentResponse>("/payments", payload).then((r) => r.data);
