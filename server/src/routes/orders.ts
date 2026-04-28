import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";
import asyncHandler from "../utils/asynchHandler.ts";

const router = Router();

const orderInclude = {
  orderItems: {
    include: {
      orderableItem: {
        include: {
          product: true,
          package: { include: { packageProducts: { include: { product: true } } } },
        },
      },
    },
  },
  payments: { include: { electronicPayments: { include: { card: true } } } },
  orderDiscounts: { include: { discount: true } },
  employee: { select: { employeeId: true, firstName: true, lastName: true } },
} as const;

// GET /api/orders?from=&to=&status=&employee_id=&store_number= (FR-MGR-1)
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { from, to, status, employee_id, store_number } = req.query;

    const orders = await prisma.order.findMany({
      where: {
        ...(typeof store_number === "string" ? { storeNumber: Number(store_number) } : {}),
        ...(typeof employee_id === "string" ? { employeeId: Number(employee_id) } : {}),
        ...(typeof status === "string" ? { preparationStatus: status } : {}),
        ...(from !== undefined || to !== undefined
          ? {
              timestamp: {
                ...(typeof from === "string" ? { gte: new Date(from) } : {}),
                ...(typeof to === "string" ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      include: orderInclude,
      orderBy: { timestamp: "desc" },
    });

    res.json(orders);
  })
);

// GET /api/orders/:id — full order detail (FR-MGR-2)
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await prisma.order.findUnique({
      where: { orderId: Number(req.params["id"]) },
      include: orderInclude,
    });
    if (order === null) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  })
);

export default router;
