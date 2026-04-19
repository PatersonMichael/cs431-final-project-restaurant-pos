import express from "express";
import { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import prisma from "./db.ts";
import router from "./routes/index.ts";

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// route registration
app.use("/api", router);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});