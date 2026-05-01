import { z } from "zod";

export const CreateTabSchema = z.object({
  customer_name: z.string().max(255).optional(),
  store_number: z.number().int().positive(),
  employee_id: z.number().int().positive(),
});

export const PatchTabSchema = z.object({
  customer_name: z.string().max(255).optional(),
  tip: z.string().regex(/^\d+(\.\d{1,2})?$/, "tip must be a decimal string").optional(),
});

export const AddItemSchema = z.object({
  item_id: z.number().int().positive(),
  quantity: z.number().int().min(1),
});

export const PatchItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export const ApplyDiscountSchema = z.object({
  discount_id: z.number().int().positive(),
});

const CardSchema = z.object({
  cardholder_name: z.string().min(1),
  last_four: z.string().length(4).regex(/^\d{4}$/),
  brand: z.string().min(1),
  expiration_month: z.number().int().min(1).max(12),
  expiration_year: z.number().int().min(2024),
});

export const AddPaymentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cash"), amount: z.string().regex(/^\d+(\.\d{1,2})?$/) }),
  z.object({ type: z.literal("electronic"), amount: z.string().regex(/^\d+(\.\d{1,2})?$/), card: CardSchema }),
]);
