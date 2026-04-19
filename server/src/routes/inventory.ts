import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";
import asyncHandler from "../utils/asynchHandler.ts";

const router = Router();

// Get current inventory levels for all products
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: {
      orderableItem: true,
      inventoryTransactions: true,
    },
  });

  const inventory = products.map((product) => {
    const currentStock = product.inventoryTransactions.reduce(
      (sum, transaction) => sum + transaction.quantityChange,
      0
    );
    return {
      productId: product.productId,
      name: product.name,
      basePrice: product.basePrice,
      isAvailable: product.orderableItem.isAvailable,
      currentStock,
    };
  });

  res.json(inventory);
}));

// Get inventory history for a single product
router.get("/:productId", asyncHandler(async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { productId: Number(req.params.productId) },
    include: {
      inventoryTransactions: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const currentStock = product.inventoryTransactions.reduce(
    (sum, transaction) => sum + transaction.quantityChange,
    0
  );

  res.json({
    productId: product.productId,
    name: product.name,
    currentStock,
    transactions: product.inventoryTransactions,
  });
}));

// Record an inventory transaction
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantityChange, reason } = req.body;

  const transaction = await prisma.inventoryTransaction.create({
    data: { productId, quantityChange, reason },
  });

  // Compute new stock level
  const allTransactions = await prisma.inventoryTransaction.findMany({
    where: { productId },
  });
  const currentStock = allTransactions.reduce(
    (sum, t) => sum + t.quantityChange,
    0
  );

  // Automatically disable ordering if stock hits zero
  if (currentStock <= 0) {
    const product = await prisma.product.findUnique({
      where: { productId },
    });
    await prisma.orderableItem.update({
      where: { itemId: product!.productId },
      data: { isAvailable: false },
    });
  }

  res.status(201).json({ transaction, currentStock });
}));

export default router;
