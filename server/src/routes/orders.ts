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
          package: {
            include: {
              packageProducts: {
                include: { product: true },
              },
            },
          },
        },
      },
    },
  },
  payments: {
    include: {
      electronicPayments: {
        include: { card: true },
      },
    },
  },
  orderDiscounts: {
    include: {
      discount: true,
    },
  }
};

function addBalance<T extends { total: { toNumber(): number } | number | string; payments: { amount: { toNumber(): number } | number | string }[] }>(order: T) {
  const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return { ...order, balance: Number(order.total) - totalPaid };
}

// Get all orders
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({ include: orderInclude });
  res.json(orders.map(addBalance));
}));

// Get a single order by id
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { orderId: Number(req.params.id) },
    include: orderInclude,
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(addBalance(order));
}));

// Create an order
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { customerName, storeNumber, taxPercent, tip, employeeId, discountIds, items } = req.body;
  // items: [{ itemId, quantity, priceAtPurchase }]

  const subtotal = items.reduce(
    (sum: number, item: { priceAtPurchase: number; quantity: number }) =>
      sum + item.priceAtPurchase * item.quantity,
    0
  );
  const tipAmount = tip ?? 0;
  const preTaxTotal = subtotal + tipAmount + subtotal * (taxPercent / 100);

  let discountAmount = 0;
  if (discountIds?.length) {
    const discounts = await prisma.discount.findMany({
      where: { discountId: { in: discountIds } },
    });
    discountAmount = discounts.reduce((sum, d) => {
      return sum + (d.type === "percent" ? subtotal * (Number(d.value) / 100) : Number(d.value));
    }, 0);
  }

  const total = Math.max(0, preTaxTotal - discountAmount);

  const order = await prisma.order.create({
    data: {
      customerName,
      storeNumber,
      taxPercent,
      tip: tipAmount,
      subtotal,
      total,
      ...(employeeId != null && { employeeId }),
      orderItems: {
        create: items.map(
          (item: {
            itemId: number;
            quantity: number;
            priceAtPurchase: number;
          }) => ({
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
            orderableItem: {
              connect: { itemId: item.itemId },
            },
          })
        ),
      },
      ...(discountIds?.length && {
        orderDiscounts: {
          create: discountIds.map((id: number) => ({ discountId: id })),
        },
      }),
    },
    include: orderInclude,
  });
  res.status(201).json(addBalance(order));
}));

// Update order preparation status
router.put("/:id/status", asyncHandler(async (req: Request, res: Response) => {
  const { preparationStatus } = req.body;
  const order = await prisma.order.update({
    where: { orderId: Number(req.params.id) },
    data: { preparationStatus },
  });
  res.json(order);
}));

export default router;
