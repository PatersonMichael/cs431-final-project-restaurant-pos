import { Router, type Request, type Response } from "express";
import asyncHandler from "../utils/asynchHandler.ts";
import prisma from "../db.ts";
import type { MenuItemResponse, ProductTypeResponse, DiscountListItem } from "../types/api.ts";

const router = Router();

// GET /api/menu — all available orderable items (products + packages)
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const items = await prisma.orderableItem.findMany({
      where: { isAvailable: true },
      include: {
        product: { include: { productType: true } },
        package: true,
      },
    });

    const menu: MenuItemResponse[] = items.map((oi) => {
      if (oi.product !== null) {
        return {
          item_id: oi.itemId,
          item_type: "product",
          is_available: oi.isAvailable,
          name: oi.product.name,
          price: oi.product.basePrice.toString(),
          product_type_id: oi.product.typeId,
          product_type_name: oi.product.productType.name,
        };
      }
      return {
        item_id: oi.itemId,
        item_type: "package",
        is_available: oi.isAvailable,
        name: oi.package?.name ?? "Unknown",
        price: oi.package?.bundlePrice.toString() ?? "0",
      };
    });

    res.json(menu);
  })
);

// GET /api/product-types — all product types
router.get(
  "/product-types",
  asyncHandler(async (_req: Request, res: Response) => {
    const types = await prisma.productType.findMany({ orderBy: { name: "asc" } });
    res.json(
      types.map((t) => ({
        product_type_id: t.typeId,
        name: t.name,
      }))
    );
  })
);

// GET /api/discounts — all active discounts (for close-out UI)
router.get(
  "/discounts",
  asyncHandler(async (_req: Request, res: Response) => {
    const discounts = await prisma.discount.findMany({ orderBy: { name: "asc" } });
    const result: DiscountListItem[] = discounts.map((d) => ({
      discount_id: d.discountId,
      name: d.name,
      value: d.value.toString(),
      type: d.type,
    }));
    res.json(result);
  })
);

export default router;
