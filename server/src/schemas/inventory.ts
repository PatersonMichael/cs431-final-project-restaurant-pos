import { z } from "zod";

const VALID_REASONS = ["restock", "waste", "adjustment", "correction", "sale"] as const;

export const AdjustInventorySchema = z.object({
  quantity_change: z.number().int().refine((n) => n !== 0, "quantity_change must not be zero"),
  reason: z.enum(VALID_REASONS),
  note: z.string().max(500).optional(),
});
