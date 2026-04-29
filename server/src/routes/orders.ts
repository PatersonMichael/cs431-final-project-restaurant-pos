import { Router, type Request, type Response } from "express";
import { Prisma } from "../../generated/prisma/index.js";
import prisma from "../db.ts";
import asyncHandler from "../utils/asynchHandler.ts";
import type { OrderSummary, OrderDetail, OrderItemRow, Round, DiscountRow, PaymentRow } from "../types/api.ts";

const router = Router();

const orderInclude = {
  orderItems: {
    include: {
      orderableItem: {
        include: {
          product: true,
          package: true,
        },
      },
    },
  },
  payments: { include: { electronicPayments: { include: { card: true } } } },
  orderDiscounts: { include: { discount: true } },
  employee: { select: { employeeId: true, firstName: true, lastName: true } },
} as const;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function itemName(item: OrderWithRelations["orderItems"][number]): string {
  return item.orderableItem.product?.name ?? item.orderableItem.package?.name ?? "Unknown";
}

function toOrderSummary(order: OrderWithRelations): OrderSummary {
  return {
    order_id: order.orderId,
    customer_name: order.customerName,
    timestamp: order.timestamp.toISOString(),
    preparation_status: order.preparationStatus,
    payment_status: order.paymentStatus,
    store_number: order.storeNumber,
    employee_id: order.employeeId,
    employee_name: order.employee
      ? `${order.employee.firstName} ${order.employee.lastName}`
      : null,
    subtotal: order.subtotal.toString(),
    total: order.total.toString(),
  };
}

function toOrderDetail(order: OrderWithRelations): OrderDetail {
  const allItems: OrderItemRow[] = order.orderItems.map((item) => ({
    order_item_id: item.orderItemId,
    item_id: item.itemId,
    quantity: item.quantity,
    price_at_purchase: item.priceAtPurchase.toString(),
    kitchen_status: item.kitchenStatus,
    fired_at: item.firedAt?.toISOString() ?? null,
    name: itemName(item),
    item_type: item.orderableItem.itemType,
  }));

  const staged = allItems.filter((i) => i.fired_at === null);
  const fired  = allItems.filter((i) => i.fired_at !== null);

  const roundMap = new Map<string, OrderItemRow[]>();
  for (const item of fired) {
    const key = item.fired_at as string;
    const bucket = roundMap.get(key) ?? [];
    bucket.push(item);
    roundMap.set(key, bucket);
  }
  const rounds: Round[] = Array.from(roundMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fired_at, items]) => ({ fired_at, items }));

  const discounts: DiscountRow[] = order.orderDiscounts.map((od) => ({
    discount_id: od.discount.discountId,
    name: od.discount.name,
    value: od.discount.value.toString(),
    type: od.discount.type,
  }));

  const payments: PaymentRow[] = order.payments.map((p) => {
    const ep = p.electronicPayments[0];
    return {
      payment_id: p.paymentId,
      type: p.type,
      amount: p.amount.toString(),
      ...(ep !== undefined
        ? {
            card: {
              card_id: ep.card.cardId,
              cardholder_name: ep.card.cardholderName,
              last_four: ep.card.lastFour,
              brand: ep.card.brand,
              expiration_month: ep.card.expirationMonth,
              expiration_year: ep.card.expirationYear,
            },
          }
        : {}),
    };
  });

  return {
    order_id: order.orderId,
    customer_name: order.customerName,
    timestamp: order.timestamp.toISOString(),
    preparation_status: order.preparationStatus,
    payment_status: order.paymentStatus,
    store_number: order.storeNumber,
    employee_id: order.employeeId,
    employee_name: order.employee
      ? `${order.employee.firstName} ${order.employee.lastName}`
      : null,
    subtotal: order.subtotal.toString(),
    total: order.total.toString(),
    tip: order.tip?.toString() ?? null,
    tax_percent: order.taxPercent.toString(),
    staged,
    rounds,
    discounts,
    payments,
  };
}

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

    res.json(orders.map(toOrderSummary));
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
    res.json(toOrderDetail(order));
  })
);

export default router;
