import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";
import asyncHandler from "../utils/asynchHandler.ts";

const router = Router();

// Get all payments for an order
router.get("/orders/:orderId", asyncHandler(async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    where: { orderId: Number(req.params.orderId) },
  });
  res.json(payments);
}));

// Record a payment for an order
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { orderId, type, amount, cardData } = req.body;

  if (type === "card" && !cardData) {
    res.status(422).json({ error: "Card data is required for card payments" });
    return;
  }

  const order = await prisma.order.findUnique({
    where: { orderId },
    include: { payments: true },
  });

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const alreadyPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(order.total) - alreadyPaid;

  if (type !== "cash" && Number(amount) > balance) {
    res.status(422).json({ error: `Electronic payment cannot exceed the remaining balance of ${balance.toFixed(2)}` });
    return;
  }

  const payment = await prisma.payment.create({
    data: { orderId, type, amount },
  });

  if (type === "card") {
    const { cardholderName, lastFour, brand, expirationMonth, expirationYear } = cardData;
    const token = `tok_${brand.toLowerCase()}_${lastFour}_${Date.now()}`;
    const card = await prisma.card.create({
      data: { cardholderName, token, lastFour, brand, expirationMonth, expirationYear },
    });
    await prisma.electronicPayment.create({
      data: { cardId: card.cardId, paymentId: payment.paymentId },
    });
  }

  const totalPaid = alreadyPaid + Number(amount);
  const paymentStatus = totalPaid >= Number(order.total) ? "paid" : "unpaid";

  await prisma.order.update({
    where: { orderId },
    data: { paymentStatus },
  });

  const newBalance = Number(order.total) - totalPaid;
  res.status(201).json({ payment, paymentStatus, balance: newBalance });
}));

export default router;
