import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";

const router = Router();

// Get all orders
router.get("/", async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: {
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
    },
  });
  res.json(orders);
});

// Get a single order by id
router.get("/:id", async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { orderId: Number(req.params.id) },
    include: {
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
    },
  });
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

// Create an order
router.post("/", async (req: Request, res: Response) => {
  const { customerName, storeNumber, taxPercent, tip, items } = req.body;
  // items: [{ itemId, quantity, priceAtPurchase }]

  const subtotal = items.reduce(
    (sum: number, item: { priceAtPurchase: number; quantity: number }) =>
      sum + item.priceAtPurchase * item.quantity,
    0
  );
  const tipAmount = tip ?? 0;
  const total = subtotal + tipAmount + subtotal * (taxPercent / 100);

  const order = await prisma.order.create({
    data: {
      customerName,
      storeNumber,
      taxPercent,
      tip: tipAmount,
      subtotal,
      total,
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
    },
    include: {
      orderItems: true,
    },
  });
  res.status(201).json(order);
});

// Update order preparation status
router.put("/:id/status", async (req: Request, res: Response) => {
  const { preparationStatus } = req.body;
  const order = await prisma.order.update({
    where: { orderId: Number(req.params.id) },
    data: { preparationStatus },
  });
  res.json(order);
});

export default router;