import { Prisma } from "../../generated/prisma/index.js";
import prisma from "../db.ts";
import type { TabSummary, TabDetail, OrderItemRow, Round, DiscountRow, PaymentRow } from "../types/api.ts";

// Interactive-transaction client type
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const DEFAULT_TAX_PERCENT = new Prisma.Decimal("8.75");

// ─── Include shapes ───────────────────────────────────────────────────────────

const itemInclude = {
  orderableItem: {
    include: {
      product: { include: { productType: true } },
      package: true,
    },
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function itemName(item: {
  orderableItem: {
    product: { name: string } | null;
    package: { name: string } | null;
  };
}): string {
  return item.orderableItem.product?.name ?? item.orderableItem.package?.name ?? "Unknown";
}

function toOrderItemRow(item: {
  orderItemId: number;
  itemId: number;
  quantity: number;
  priceAtPurchase: Prisma.Decimal;
  kitchenStatus: string;
  firedAt: Date | null;
  orderableItem: {
    itemType: string;
    product: { name: string } | null;
    package: { name: string } | null;
  };
}): OrderItemRow {
  return {
    order_item_id: item.orderItemId,
    item_id: item.itemId,
    quantity: item.quantity,
    price_at_purchase: item.priceAtPurchase.toString(),
    kitchen_status: item.kitchenStatus,
    fired_at: item.firedAt?.toISOString() ?? null,
    name: itemName(item),
    item_type: item.orderableItem.itemType,
  };
}

// Recomputes subtotal and total using SQL SUM (NFR-3). Must run inside a transaction.
async function recomputeTotals(orderId: number, tx: TxClient): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ subtotal: string | null }>>`
    SELECT SUM(quantity * priceAtPurchase) AS subtotal
    FROM order_item
    WHERE orderId = ${orderId}
      AND kitchenStatus != 'voided'
  `;

  const firstRow = rows[0];
  const subtotalStr = firstRow !== undefined && firstRow.subtotal !== null ? firstRow.subtotal : "0";
  const subtotal = new Prisma.Decimal(subtotalStr);

  const orderDiscounts = await tx.orderDiscount.findMany({
    where: { orderId },
    include: { discount: true },
  });

  const order = await tx.order.findUniqueOrThrow({ where: { orderId } });

  let discountTotal = new Prisma.Decimal(0);
  for (const od of orderDiscounts) {
    if (od.discount.type === "percent") {
      discountTotal = discountTotal.plus(subtotal.mul(od.discount.value).div(100));
    } else {
      discountTotal = discountTotal.plus(od.discount.value);
    }
  }

  const taxableAmount = subtotal.minus(discountTotal).lessThan(0)
    ? new Prisma.Decimal(0)
    : subtotal.minus(discountTotal);
  const taxAmount = taxableAmount.mul(order.taxPercent).div(100);
  const tip = order.tip ?? new Prisma.Decimal(0);
  const rawTotal = taxableAmount.plus(taxAmount).plus(tip);
  const total = rawTotal.lessThan(0) ? new Prisma.Decimal(0) : rawTotal;

  await tx.order.update({
    where: { orderId },
    data: { subtotal, total },
  });
}

// ─── Exported service functions ───────────────────────────────────────────────

export async function getOpenTabs(storeNumber: number): Promise<TabSummary[]> {
  const orders = await prisma.order.findMany({
    where: { storeNumber, preparationStatus: "open" },
    orderBy: { timestamp: "asc" },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      orderItems: {
        include: { orderableItem: { include: { product: true, package: true } } },
      },
    },
  });

  return orders.map((o) => {
    const nonVoided = o.orderItems.filter((i) => i.kitchenStatus !== "voided");
    const hasReady = nonVoided.some((i) => i.kitchenStatus === "ready");
    const employeeName =
      o.employee !== null ? `${o.employee.firstName} ${o.employee.lastName}` : null;

    return {
      order_id: o.orderId,
      customer_name: o.customerName,
      timestamp: o.timestamp.toISOString(),
      preparation_status: o.preparationStatus,
      payment_status: o.paymentStatus,
      store_number: o.storeNumber,
      employee_id: o.employeeId,
      employee_name: employeeName,
      subtotal: o.subtotal.toString(),
      total: o.total.toString(),
      tip: o.tip?.toString() ?? null,
      tax_percent: o.taxPercent.toString(),
      item_count: nonVoided.length,
      has_ready_items: hasReady,
    };
  });
}

export async function createTab(data: {
  customer_name?: string | undefined;
  store_number: number;
  employee_id: number;
}): Promise<TabDetail> {
  const order = await prisma.order.create({
    data: {
      customerName: data.customer_name ?? null,
      storeNumber: data.store_number,
      employeeId: data.employee_id,
      taxPercent: DEFAULT_TAX_PERCENT,
      subtotal: new Prisma.Decimal(0),
      total: new Prisma.Decimal(0),
      preparationStatus: "open",
    },
  });

  return buildTabDetail(order.orderId);
}

export async function getTabDetail(orderId: number): Promise<TabDetail> {
  return buildTabDetail(orderId);
}

export async function patchTab(
  orderId: number,
  data: { customer_name?: string | undefined; tip?: string | undefined }
): Promise<TabDetail> {
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { orderId },
      data: {
        ...(data.customer_name !== undefined ? { customerName: data.customer_name } : {}),
        ...(data.tip !== undefined ? { tip: new Prisma.Decimal(data.tip) } : {}),
      },
    });
    await recomputeTotals(orderId, tx);
  });
  return buildTabDetail(orderId);
}

export async function addItem(
  orderId: number,
  itemId: number,
  quantity: number
): Promise<TabDetail> {
  const order = await prisma.order.findUniqueOrThrow({ where: { orderId } });
  if (order.preparationStatus !== "open") throw new Error("Tab is not open");

  const orderableItem = await prisma.orderableItem.findUniqueOrThrow({
    where: { itemId },
    include: { product: true, package: true },
  });
  if (!orderableItem.isAvailable) throw new Error("Item is not currently available");

  const priceAtPurchase =
    orderableItem.product?.basePrice ?? orderableItem.package?.bundlePrice;
  if (priceAtPurchase === undefined) throw new Error("Could not determine item price");

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.create({
      data: { orderId, itemId, quantity, priceAtPurchase, kitchenStatus: "staged" },
    });
    await recomputeTotals(orderId, tx);
  });

  return buildTabDetail(orderId);
}

export async function updateItemQuantity(
  orderId: number,
  itemId: number,
  quantity: number
): Promise<TabDetail> {
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { orderItemId: itemId } });
  if (item.orderId !== orderId) throw new Error("Item does not belong to this tab");
  if (item.kitchenStatus !== "staged") throw new Error("Only staged items can be updated");

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.update({ where: { orderItemId: itemId }, data: { quantity } });
    await recomputeTotals(orderId, tx);
  });

  return buildTabDetail(orderId);
}

export async function removeItem(orderId: number, itemId: number): Promise<TabDetail> {
  const item = await prisma.orderItem.findUniqueOrThrow({ where: { orderItemId: itemId } });
  if (item.orderId !== orderId) throw new Error("Item does not belong to this tab");

  await prisma.$transaction(async (tx) => {
    if (item.kitchenStatus === "staged") {
      await tx.orderItem.delete({ where: { orderItemId: itemId } });
    } else {
      await tx.orderItem.update({
        where: { orderItemId: itemId },
        data: { kitchenStatus: "voided" },
      });
    }
    await recomputeTotals(orderId, tx);
  });

  return buildTabDetail(orderId);
}

export async function fireItems(orderId: number): Promise<TabDetail> {
  await prisma.$transaction(async (tx) => {
    const stagedItems = await tx.orderItem.findMany({
      where: { orderId, kitchenStatus: "staged" },
      include: { orderableItem: { include: { product: true, package: { include: { packageProducts: true } } } } },
    });

    if (stagedItems.length === 0) throw new Error("No staged items to fire");

    const firedAt = new Date();

    await tx.orderItem.updateMany({
      where: { orderId, kitchenStatus: "staged" },
      data: { kitchenStatus: "fired", firedAt },
    });

    // Write inventory transactions for each fired item and collect affected product IDs
    const affectedProductIds = new Set<number>();
    for (const item of stagedItems) {
      const { orderableItem } = item;
      if (orderableItem.itemType === "product" && orderableItem.product !== null) {
        await tx.inventoryTransaction.create({
          data: {
            productId: orderableItem.product.productId,
            quantityChange: -item.quantity,
            reason: "sale",
          },
        });
        affectedProductIds.add(orderableItem.product.productId);
      } else if (orderableItem.itemType === "package" && orderableItem.package !== null) {
        for (const pp of orderableItem.package.packageProducts) {
          await tx.inventoryTransaction.create({
            data: {
              productId: pp.productId,
              quantityChange: -item.quantity,
              reason: "sale",
            },
          });
          affectedProductIds.add(pp.productId);
        }
      }
    }

    // Auto-disable any non-infinite products whose on_hand just hit zero
    for (const productId of affectedProductIds) {
      const oi = await tx.orderableItem.findUnique({ where: { itemId: productId } });
      if (oi === null || oi.isInfinite) continue;

      const sumRows = await tx.$queryRaw<Array<{ on_hand: string | null }>>`
        SELECT SUM(quantityChange) AS on_hand
        FROM inventory_transaction
        WHERE productId = ${productId}
      `;
      const on_hand = sumRows[0]?.on_hand !== null ? Number(sumRows[0]?.on_hand ?? 0) : 0;
      if (on_hand <= 0) {
        await tx.orderableItem.update({
          where: { itemId: productId },
          data: { isAvailable: false },
        });
      }
    }

    await recomputeTotals(orderId, tx);
  });

  return buildTabDetail(orderId);
}

export async function applyDiscount(orderId: number, discountId: number): Promise<TabDetail> {
  const order = await prisma.order.findUniqueOrThrow({ where: { orderId } });
  if (order.preparationStatus !== "open") throw new Error("Tab is not open");

  await prisma.$transaction(async (tx) => {
    await tx.orderDiscount.create({ data: { orderId, discountId } });
    await recomputeTotals(orderId, tx);
  });

  return buildTabDetail(orderId);
}

export async function addPayment(
  orderId: number,
  type: "cash" | "electronic",
  amount: string,
  card?: {
    cardholder_name: string;
    last_four: string;
    brand: string;
    expiration_month: number;
    expiration_year: number;
  }
): Promise<TabDetail> {
  const decimalAmount = new Prisma.Decimal(amount);

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: { orderId, type, amount: decimalAmount },
    });

    if (type === "electronic") {
      if (card === undefined) throw new Error("Card details required for electronic payment");
      const createdCard = await tx.card.create({
        data: {
          cardholderName: card.cardholder_name,
          // Token is faked for v1 — not real PCI
          token: `tok_${Date.now()}_${card.last_four}`,
          lastFour: card.last_four,
          brand: card.brand,
          expirationMonth: card.expiration_month,
          expirationYear: card.expiration_year,
        },
      });
      await tx.electronicPayment.create({
        data: { cardId: createdCard.cardId, paymentId: payment.paymentId },
      });
    }
  });

  return buildTabDetail(orderId);
}

export async function deleteDiscount(orderId: number, discountId: number): Promise<TabDetail> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { orderId } });
    if (order.preparationStatus !== "open") throw new Error("Cannot remove discount from a closed tab");
    await tx.orderDiscount.delete({ where: { discountId_orderId: { discountId, orderId } } });
    await recomputeTotals(orderId, tx);
  });
  return buildTabDetail(orderId);
}

export async function deletePayment(orderId: number, paymentId: number): Promise<TabDetail> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { paymentId } });
    if (payment.orderId !== orderId) throw new Error("Payment does not belong to this tab");

    const order = await tx.order.findUniqueOrThrow({ where: { orderId } });
    if (order.preparationStatus !== "open") throw new Error("Cannot remove payment from a closed tab");

    // Remove linked electronic payment row first (FK constraint)
    await tx.electronicPayment.deleteMany({ where: { paymentId } });
    await tx.payment.delete({ where: { paymentId } });
  });
  return buildTabDetail(orderId);
}

export async function closeTab(orderId: number): Promise<TabDetail> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { orderId },
      include: { payments: true },
    });

    if (order.preparationStatus !== "open") throw new Error("Tab is already closed");

    // Auto-fire any staged items so the kitchen always receives a ticket
    const stagedItems = await tx.orderItem.findMany({
      where: { orderId, kitchenStatus: "staged" },
      include: {
        orderableItem: {
          include: {
            product: true,
            package: { include: { packageProducts: true } },
          },
        },
      },
    });

    if (stagedItems.length > 0) {
      const firedAt = new Date();
      await tx.orderItem.updateMany({
        where: { orderId, kitchenStatus: "staged" },
        data: { kitchenStatus: "fired", firedAt },
      });
      for (const item of stagedItems) {
        const { orderableItem } = item;
        if (orderableItem.itemType === "product" && orderableItem.product !== null) {
          await tx.inventoryTransaction.create({
            data: {
              productId: orderableItem.product.productId,
              quantityChange: -item.quantity,
              reason: "sale",
            },
          });
        } else if (orderableItem.itemType === "package" && orderableItem.package !== null) {
          for (const pp of orderableItem.package.packageProducts) {
            await tx.inventoryTransaction.create({
              data: {
                productId: pp.productId,
                quantityChange: -item.quantity,
                reason: "sale",
              },
            });
          }
        }
      }
    }

    const totalPaid = order.payments.reduce(
      (sum, p) => sum.plus(p.amount),
      new Prisma.Decimal(0)
    );

    if (totalPaid.lessThan(order.total)) {
      throw new Error(
        `Insufficient payment: paid ${totalPaid.toString()}, owed ${order.total.toString()}`
      );
    }

    await tx.order.update({
      where: { orderId },
      data: { preparationStatus: "completed", paymentStatus: "paid" },
    });
  });

  return buildTabDetail(orderId);
}

// ─── Tab detail builder ───────────────────────────────────────────────────────

async function buildTabDetail(orderId: number): Promise<TabDetail> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { orderId },
    include: {
      orderItems: { include: itemInclude },
      orderDiscounts: { include: { discount: true } },
      payments: { include: { electronicPayments: { include: { card: true } } } },
    },
  });

  const staged: OrderItemRow[] = [];
  const roundMap = new Map<string, OrderItemRow[]>();

  for (const item of order.orderItems) {
    const row = toOrderItemRow(item);
    if (item.kitchenStatus === "staged") {
      staged.push(row);
    } else if (item.firedAt !== null) {
      const key = item.firedAt.toISOString();
      let bucket = roundMap.get(key);
      if (bucket === undefined) {
        bucket = [];
        roundMap.set(key, bucket);
      }
      bucket.push(row);
    }
  }

  const rounds: Round[] = Array.from(roundMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fired_at, items]) => ({ fired_at, items }));

  const discounts: DiscountRow[] = order.orderDiscounts.map((od) => ({
    discount_id: od.discountId,
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
