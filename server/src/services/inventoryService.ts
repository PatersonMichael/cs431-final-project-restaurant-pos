import { Prisma } from "../../generated/prisma/index.js";
import prisma from "../db.ts";
import type { InventoryRow } from "../types/api.ts";

// SQL SUM for on-hand per product, optionally filtered by product_type (NFR-3)
export async function getInventory(productTypeId?: number): Promise<InventoryRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      productId: number;
      name: string;
      basePrice: string;
      typeId: number;
      typeName: string;
      isAvailable: number; // MySQL BOOLEAN comes back as 0/1
      on_hand: string | null;
    }>
  >`
    SELECT
      p.productId,
      p.name,
      p.basePrice,
      pt.typeId,
      pt.name         AS typeName,
      oi.isAvailable,
      SUM(it.quantityChange) AS on_hand
    FROM product p
    JOIN product_type pt ON p.typeId = pt.typeId
    JOIN orderable_item oi ON oi.itemId = p.productId
    LEFT JOIN inventory_transaction it ON it.productId = p.productId
    ${productTypeId !== undefined ? Prisma.sql`WHERE p.typeId = ${productTypeId}` : Prisma.empty}
    GROUP BY p.productId, p.name, p.basePrice, pt.typeId, pt.name, oi.isAvailable
    ORDER BY pt.name, p.name
  `;

  return rows.map((r) => ({
    product_id: r.productId,
    name: r.name,
    base_price: r.basePrice,
    product_type_id: r.typeId,
    product_type_name: r.typeName,
    is_available: r.isAvailable === 1,
    on_hand: r.on_hand !== null ? Number(r.on_hand) : 0,
  }));
}

export async function getProductHistory(productId: number): Promise<{
  product_id: number;
  name: string;
  on_hand: number;
  transactions: {
    transaction_id: number;
    quantity_change: number;
    reason: string;
    timestamp: string;
  }[];
}> {
  // On-hand via SQL SUM (NFR-3)
  const sumRows = await prisma.$queryRaw<Array<{ on_hand: string | null }>>`
    SELECT SUM(quantityChange) AS on_hand
    FROM inventory_transaction
    WHERE productId = ${productId}
  `;

  const product = await prisma.product.findUniqueOrThrow({
    where: { productId },
    include: {
      inventoryTransactions: { orderBy: { timestamp: "desc" }, take: 50 },
    },
  });

  const firstRow = sumRows[0];
  const on_hand = firstRow !== undefined && firstRow.on_hand !== null
    ? Number(firstRow.on_hand)
    : 0;

  return {
    product_id: product.productId,
    name: product.name,
    on_hand,
    transactions: product.inventoryTransactions.map((t) => ({
      transaction_id: t.transactionId,
      quantity_change: t.quantityChange,
      reason: t.reason,
      timestamp: t.timestamp.toISOString(),
    })),
  };
}

export async function adjustInventory(
  productId: number,
  quantityChange: number,
  reason: string
): Promise<{ transaction_id: number; on_hand: number }> {
  // Verify product exists
  await prisma.product.findUniqueOrThrow({ where: { productId } });

  const transaction = await prisma.inventoryTransaction.create({
    data: { productId, quantityChange, reason },
  });

  // On-hand via SQL SUM (NFR-3)
  const sumRows = await prisma.$queryRaw<Array<{ on_hand: string | null }>>`
    SELECT SUM(quantityChange) AS on_hand
    FROM inventory_transaction
    WHERE productId = ${productId}
  `;
  const firstRow = sumRows[0];
  const on_hand = firstRow !== undefined && firstRow.on_hand !== null
    ? Number(firstRow.on_hand)
    : 0;

  // Auto-disable ordering if stock hits zero
  if (on_hand <= 0) {
    await prisma.orderableItem.update({
      where: { itemId: productId },
      data: { isAvailable: false },
    });
  }

  return { transaction_id: transaction.transactionId, on_hand };
}
