import { z } from "zod";

export const CreateShiftSchema = z.object({
  employee_id: z.number().int().positive(),
  role_id: z.number().int().positive(),
  start_timestamp: z.string().datetime(),
  end_timestamp: z.string().datetime(),
}).refine((d) => d.end_timestamp > d.start_timestamp, {
  message: "end_timestamp must be after start_timestamp",
  path: ["end_timestamp"],
});

export const PatchShiftSchema = z.object({
  role_id: z.number().int().positive().optional(),
  start_timestamp: z.string().datetime().optional(),
  end_timestamp: z.string().datetime().optional(),
}).refine(
  (d) => {
    if (d.start_timestamp !== undefined && d.end_timestamp !== undefined) {
      return d.end_timestamp > d.start_timestamp;
    }
    return true;
  },
  { message: "end_timestamp must be after start_timestamp", path: ["end_timestamp"] }
);
