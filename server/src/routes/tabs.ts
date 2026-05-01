import { Router, type Request, type Response } from "express";
import asyncHandler from "../utils/asynchHandler.ts";
import {
  CreateTabSchema,
  PatchTabSchema,
  AddItemSchema,
  PatchItemSchema,
  ApplyDiscountSchema,
  AddPaymentSchema,
} from "../schemas/tab.ts";
import * as tabService from "../services/tabService.ts";

const router = Router();

// GET /api/tabs?store_number=:n — all open tabs at store (FR-TAB-1)
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const storeNumber = Number(req.query["store_number"]);
    if (Number.isNaN(storeNumber)) {
      res.status(400).json({ error: "store_number is required" });
      return;
    }
    res.json(await tabService.getOpenTabs(storeNumber));
  })
);

// POST /api/tabs — create new tab (FR-TAB-3)
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const body = CreateTabSchema.parse(req.body);
    const tab = await tabService.createTab(body);
    res.status(201).json(tab);
  })
);

// GET /api/tabs/:order_id — tab detail grouped by round (FR-TAB-4, FR-TAB-5)
router.get(
  "/:order_id",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    res.json(await tabService.getTabDetail(orderId));
  })
);

// PATCH /api/tabs/:order_id — update customer_name or tip
router.patch(
  "/:order_id",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const body = PatchTabSchema.parse(req.body);
    res.json(await tabService.patchTab(orderId, body));
  })
);

// POST /api/tabs/:order_id/items — add staged item (FR-TAB-7)
router.post(
  "/:order_id/items",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const { item_id, quantity } = AddItemSchema.parse(req.body);
    res.status(201).json(await tabService.addItem(orderId, item_id, quantity));
  })
);

// PATCH /api/tabs/:order_id/items/:item_id — update staged item quantity (FR-TAB-8)
router.patch(
  "/:order_id/items/:item_id",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const itemId = Number(req.params["item_id"]);
    const { quantity } = PatchItemSchema.parse(req.body);
    res.json(await tabService.updateItemQuantity(orderId, itemId, quantity));
  })
);

// DELETE /api/tabs/:order_id/items/:item_id — remove staged / void fired (FR-TAB-9)
router.delete(
  "/:order_id/items/:item_id",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const itemId = Number(req.params["item_id"]);
    res.json(await tabService.removeItem(orderId, itemId));
  })
);

// POST /api/tabs/:order_id/fire — fire all staged items (FR-TAB-10)
router.post(
  "/:order_id/fire",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    res.json(await tabService.fireItems(orderId));
  })
);

// POST /api/tabs/:order_id/discounts — apply discount (FR-PAY-2)
router.post(
  "/:order_id/discounts",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const { discount_id } = ApplyDiscountSchema.parse(req.body);
    res.status(201).json(await tabService.applyDiscount(orderId, discount_id));
  })
);

// POST /api/tabs/:order_id/payments — add payment (FR-PAY-3, FR-PAY-4, FR-PAY-6)
router.post(
  "/:order_id/payments",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    const body = AddPaymentSchema.parse(req.body);
    const card = body.type === "electronic" ? body.card : undefined;
    res.status(201).json(await tabService.addPayment(orderId, body.type, body.amount, card));
  })
);

// DELETE /api/tabs/:order_id/discounts/:discount_id — remove an applied discount before close
router.delete(
  "/:order_id/discounts/:discount_id",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId    = Number(req.params["order_id"]);
    const discountId = Number(req.params["discount_id"]);
    res.json(await tabService.deleteDiscount(orderId, discountId));
  })
);

// DELETE /api/tabs/:order_id/payments/:payment_id — remove a payment before close
router.delete(
  "/:order_id/payments/:payment_id",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId    = Number(req.params["order_id"]);
    const paymentId  = Number(req.params["payment_id"]);
    res.json(await tabService.deletePayment(orderId, paymentId));
  })
);

// POST /api/tabs/:order_id/close — close tab (FR-PAY-5)
router.post(
  "/:order_id/close",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = Number(req.params["order_id"]);
    res.json(await tabService.closeTab(orderId));
  })
);

export default router;
