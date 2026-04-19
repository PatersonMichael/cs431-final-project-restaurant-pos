import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";

const router = Router();

// Get all available packages with their constituent products
router.get("/", async (req: Request, res: Response) => {
  const packages = await prisma.package.findMany({
    where: {
      orderableItem: {
        isAvailable: true,
      },
    },
    include: {
      orderableItem: true,
      packageProducts: {
        include: {
          product: true,
        },
      },
    },
  });
  res.json(packages);
});

// Get a single package by id
router.get("/:id", async (req: Request, res: Response) => {
  const pkg = await prisma.package.findUnique({
    where: { packageId: Number(req.params.id) },
    include: {
      orderableItem: true,
      packageProducts: {
        include: {
          product: true,
        },
      },
    },
  });
  if (!pkg) {
    res.status(404).json({ error: "Package not found" });
    return;
  }
  res.json(pkg);
});

// Create a package with its constituent products
router.post("/", async (req: Request, res: Response) => {
  const { name, bundlePrice, productIds } = req.body;
  const pkg = await prisma.orderableItem.create({
    data: {
      itemType: "package",
      package: {
        create: {
          name,
          bundlePrice,
          packageProducts: {
            create: productIds.map((id: number) => ({
              product_id: id,
            })),
          },
        },
      },
    },
    include: {
      package: {
        include: {
          packageProducts: {
            include: { product: true },
          },
        },
      },
    },
  });
  res.status(201).json(pkg);
});

// Toggle package availability
router.put("/:id/availability", async (req: Request, res: Response) => {
  const { isAvailable } = req.body;
  const item = await prisma.orderableItem.update({
    where: { itemId: Number(req.params.id) },
    data: { isAvailable },
  });
  res.json(item);
});

export default router;