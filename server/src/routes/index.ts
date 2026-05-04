import { Router } from "express";
import productRouter from "./products.ts";
import orderRouter from "./orders.ts";
import packageRouter from "./packages.ts";
import restaurantRouter from "./restaurants.ts";
import employeeRouter from "./employees.ts";
import inventoryRouter from "./inventory.ts";
import tabRouter from "./tabs.ts";
import kitchenRouter from "./kitchen.ts";
import menuRouter from "./menu.ts";
import scheduleRouter from "./schedule.ts";
import analyticsRouter from "./analytics.ts";

const router = Router();

// Legacy / utility routes
router.use("/products", productRouter);
router.use("/packages", packageRouter);
router.use("/restaurants", restaurantRouter);

// Employee auth & lookup (FR-AUTH-1, FR-AUTH-2)
router.use("/employees", employeeRouter);

// Manager: filtered order history (FR-MGR-1, FR-MGR-2)
router.use("/orders", orderRouter);

// Manager: inventory (FR-INV-1 – FR-INV-4)
router.use("/inventory", inventoryRouter);

// Server console: tab lifecycle (FR-TAB-1 – FR-TAB-11, FR-PAY-1 – FR-PAY-6)
router.use("/tabs", tabRouter);

// Expediter (FR-EXP-1 – FR-EXP-4)
router.use("/kitchen", kitchenRouter);

// Menu, product types, discounts
router.use("/menu", menuRouter);

// Manager: schedule (FR-SCH-1 – FR-SCH-4)
router.use("/schedule", scheduleRouter);

// Manager: analytics dashboard (FR-ANALYTICS-1 – FR-ANALYTICS-7)
router.use("/analytics", analyticsRouter);

export default router;
