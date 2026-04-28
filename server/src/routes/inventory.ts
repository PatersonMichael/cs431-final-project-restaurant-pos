import { Router, type Request, type Response } from "express";
import asyncHandler from "../utils/asynchHandler.ts";
import { AdjustInventorySchema } from "../schemas/inventory.ts";
import * as inventoryService from "../services/inventoryService.ts";

const router = Router();

// GET /api/inventory?product_type_id= — on-hand per product (FR-INV-1, FR-INV-2)
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const typeRaw = req.query["product_type_id"];
    const productTypeId =
      typeof typeRaw === "string" && typeRaw !== "" ? Number(typeRaw) : undefined;
    res.json(await inventoryService.getInventory(productTypeId));
  })
);

// GET /api/inventory/:product_id/history — recent transactions (FR-INV-4)
router.get(
  "/:product_id/history",
  asyncHandler(async (req: Request, res: Response) => {
    const productId = Number(req.params["product_id"]);
    res.json(await inventoryService.getProductHistory(productId));
  })
);

// POST /api/inventory/:product_id/adjust — insert INVENTORY_TRANSACTION (FR-INV-3)
router.post(
  "/:product_id/adjust",
  asyncHandler(async (req: Request, res: Response) => {
    const productId = Number(req.params["product_id"]);
    const { quantity_change, reason } = AdjustInventorySchema.parse(req.body);
    res.status(201).json(await inventoryService.adjustInventory(productId, quantity_change, reason));
  })
);

export default router;
