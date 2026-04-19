import { Router } from "express";
import productRouter from "./products.ts";
import orderRouter from "./orders.ts";
import packageRouter from "./packages.ts";
import restaurantRouter from "./restaurants.ts";
import employeeRouter from "./employees.ts";
import paymentRouter from "./payments.ts";
import inventoryRouter from "./inventory.ts";

const router = Router();

router.use("/products", productRouter);
router.use("/orders", orderRouter);
router.use("/restaurants", restaurantRouter);
router.use("/employees", employeeRouter);
router.use("/packages", packageRouter);
router.use("/payments", paymentRouter);
router.use("/inventory", inventoryRouter);

export default router;