import { Router } from "express";
import productRouter from "./products.ts";
import orderRouter from "./orders.ts";
import packageRouter from "./packages.ts";

const router = Router();

router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/packages", packageRouter);

export default router;