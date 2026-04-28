import prisma from "../db.ts";
import type { TicketResponse } from "../types/api.ts";

const ACTIVE_STATUSES = ["fired", "preparing"] as const;

const itemInclude = {
  orderableItem: {
    include: {
      product: true,
      package: true,
    },
  },
} as const;

function itemName(oi: {
  product: { name: string } | null;
  package: { name: string } | null;
}): string {
  return oi.product?.name ?? oi.package?.name ?? "Unknown";
}

export async function getActiveTickets(): Promise<TicketResponse[]> {
  const items = await prisma.orderItem.findMany({
    where: { kitchenStatus: { in: [...ACTIVE_STATUSES] } },
    include: {
      ...itemInclude,
      order: { select: { customerName: true, orderId: true } },
    },
    orderBy: { firedAt: "asc" },
  });

  // Group by (orderId, firedAt)
  const ticketMap = new Map<string, TicketResponse>();
  for (const item of items) {
    if (item.firedAt === null) continue;
    const key = `${item.orderId}:${item.firedAt.toISOString()}`;
    let ticket = ticketMap.get(key);
    if (ticket === undefined) {
      ticket = {
        order_id: item.orderId,
        customer_name: item.order.customerName,
        fired_at: item.firedAt.toISOString(),
        items: [],
      };
      ticketMap.set(key, ticket);
    }
    ticket.items.push({
      order_item_id: item.orderItemId,
      name: itemName(item.orderableItem),
      item_type: item.orderableItem.itemType,
      quantity: item.quantity,
      kitchen_status: item.kitchenStatus,
    });
  }

  return Array.from(ticketMap.values());
}

export async function updateItemStatus(
  itemId: number,
  status: string
): Promise<{ order_item_id: number; kitchen_status: string }> {
  const VALID = ["fired", "preparing", "ready", "delivered"];
  if (!VALID.includes(status)) throw new Error(`Invalid kitchen status: ${status}`);

  const item = await prisma.orderItem.update({
    where: { orderItemId: itemId },
    data: { kitchenStatus: status },
  });
  return { order_item_id: item.orderItemId, kitchen_status: item.kitchenStatus };
}

export async function bumpTicket(orderId: number, firedAt: Date): Promise<{ updated: number }> {
  const result = await prisma.orderItem.updateMany({
    where: {
      orderId,
      firedAt,
      kitchenStatus: { in: ["fired", "preparing"] },
    },
    data: { kitchenStatus: "ready" },
  });
  return { updated: result.count };
}
