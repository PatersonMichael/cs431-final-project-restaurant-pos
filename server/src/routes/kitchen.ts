import { Router, type Request, type Response } from "express";
import asyncHandler from "../utils/asynchHandler.ts";
import * as kitchenService from "../services/kitchenService.ts";

const router = Router();

// GET /api/kitchen/tickets?store_number= — active tickets for expediter (FR-EXP-1)
router.get(
  "/tickets",
  asyncHandler(async (req: Request, res: Response) => {
    const raw = req.query["store_number"];
    const storeNumber = typeof raw === "string" ? Number(raw) : undefined;
    res.json(await kitchenService.getActiveTickets(storeNumber));
  })
);

// GET /api/kitchen/archive?store_number= — today's bumped (ready) tickets
router.get(
  "/archive",
  asyncHandler(async (req: Request, res: Response) => {
    const raw = req.query["store_number"];
    const storeNumber = typeof raw === "string" ? Number(raw) : undefined;
    res.json(await kitchenService.getArchiveTickets(storeNumber));
  })
);

// PATCH /api/kitchen/items/:item_id — update kitchen_status of one line
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
    const firedAt = parseFiredAt(req.params["fired_at"], res);
    if (!firedAt) return;
    res.json(await kitchenService.bumpTicket(orderId, firedAt));
  })
);

// POST /api/kitchen/tickets/:order_id/:fired_at/reopen — return archived ticket to board
router.post(
  "/tickets/:order_id/:fired_at/reopen",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const firedAt = parseFiredAt(req.params["fired_at"], res);
    if (!firedAt) return;
    res.json(await kitchenService.reopenTicket(orderId, firedAt));
  })
);

function parseFiredAt(raw: string | string[] | undefined, res: Response): Date | null {
  if (typeof raw !== "string") {
    res.status(400).json({ error: "Invalid fired_at" });
    return null;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    res.status(400).json({ error: "Invalid fired_at timestamp" });
    return null;
  }
  return d;
}

export default router;
