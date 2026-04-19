import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";
import asyncHandler from "../utils/asynchHandler.ts";

const router = Router();

// Get all restaurants
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      address: true,
    },
  });
  res.json(restaurants);
}));

// Get a single restaurant
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { storeNumber: Number(req.params.id) },
    include: {
      address: true,
    },
  });
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  res.json(restaurant);
}));

// Create a restaurant
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, name, address } = req.body;

  const newAddress = await prisma.address.create({
    data: address,
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      phoneNumber,
      name,
      addressId: newAddress.addressId,
    },
    include: { address: true },
  });
  res.status(201).json(restaurant);
}));

// Update a restaurant
router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, name } = req.body;
  const restaurant = await prisma.restaurant.update({
    where: { storeNumber: Number(req.params.id) },
    data: { phoneNumber, name },
  });
  res.json(restaurant);
}));

export default router;
