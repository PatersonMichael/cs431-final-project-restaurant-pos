import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/index.js";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation error", issues: err.issues });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({ error: "Record already exists" });
      return;
    }
  }

  if (err instanceof Error && err.message) {
    // Surface domain errors (e.g., "No staged items") as 422
    res.status(422).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
