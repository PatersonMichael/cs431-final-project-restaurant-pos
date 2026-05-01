import { type Request, type Response, type NextFunction } from "express";

export function employeeContext(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers["x-employee-id"];
  if (raw !== undefined) {
    const id = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!Number.isNaN(id)) {
      req.employeeId = id;
    }
  }
  next();
}
