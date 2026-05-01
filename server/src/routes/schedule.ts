import { Router, type Request, type Response } from "express";
import asyncHandler from "../utils/asynchHandler.ts";
import { CreateShiftSchema, PatchShiftSchema } from "../schemas/schedule.ts";
import * as scheduleService from "../services/scheduleService.ts";

const router = Router();

// GET /api/schedule?from=&to=&store_number= — shifts in window (FR-SCH-1)
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const from = typeof req.query["from"] === "string" ? req.query["from"] : undefined;
    const to = typeof req.query["to"] === "string" ? req.query["to"] : undefined;
    const storeRaw = req.query["store_number"];
    const store_number =
      typeof storeRaw === "string" ? Number(storeRaw) : undefined;

    res.json(await scheduleService.getShifts({ from, to, store_number }));
  })
);

// POST /api/schedule — create shift (FR-SCH-2)
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const body = CreateShiftSchema.parse(req.body);
    res.status(201).json(await scheduleService.createShift(body));
  })
);

// PATCH /api/schedule/:shift_id — edit shift (FR-SCH-3)
router.patch(
  "/:shift_id",
  asyncHandler(async (req: Request, res: Response) => {
    const shiftId = Number(req.params["shift_id"]);
    const body = PatchShiftSchema.parse(req.body);
    res.json(await scheduleService.updateShift(shiftId, body));
  })
);

// DELETE /api/schedule/:shift_id — cancel shift (FR-SCH-3)
router.delete(
  "/:shift_id",
  asyncHandler(async (req: Request, res: Response) => {
    const shiftId = Number(req.params["shift_id"]);
    await scheduleService.deleteShift(shiftId);
    res.status(204).end();
  })
);

export default router;
