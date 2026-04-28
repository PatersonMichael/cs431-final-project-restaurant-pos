import { Router, type Request, type Response } from "express";
import asyncHandler from "../utils/asynchHandler.ts";
import * as kitchenService from "../services/kitchenService.ts";

const router = Router();

// GET /api/kitchen/tickets — active tickets for expediter (FR-EXP-1, FR-EXP-2, FR-EXP-3)
router.get(
  "/tickets",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await kitchenService.getActiveTickets());
  })
);

// PATCH /api/kitchen/items/:item_id — update kitchen_status of one line (FR-EXP-2)
router.patch(
  "/items/:item_id",
  asyncHandler(async (req: Request, res: Response) => {
    const itemId = Number(req.params["item_id"]);
    const { kitchen_status } = req.body as { kitchen_status: unknown };
    if (typeof kitchen_status !== "string") {
      res.status(400).json({ error: "kitchen_status must be a string" });
      return;
    }
    res.json(await kitchenService.updateItemStatus(itemId, kitchen_status));
  })
);

// PATCH /api/kitchen/tickets/:order_id/:fired_at — bump entire ticket to ready (FR-EXP-2)
router.patch(
  "/tickets/:order_id/:fired_at",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const rawFiredAt = req.params["fired_at"];
    if (typeof rawFiredAt !== "string") {
      res.status(400).json({ error: "Invalid fired_at" });
      return;
    }
    const firedAt = new Date(rawFiredAt);
    if (Number.isNaN(firedAt.getTime())) {
      res.status(400).json({ error: "Invalid fired_at timestamp" });
      return;
    }
    res.json(await kitchenService.bumpTicket(orderId, firedAt));
  })
);

export default router;
