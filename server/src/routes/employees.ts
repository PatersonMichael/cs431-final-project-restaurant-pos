import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";
import asyncHandler from "../utils/asynchHandler.ts";
import type { EmployeeResponse } from "../types/api.ts";

const router = Router();

// GET /api/employees?store_number=:n — list employees, optionally filtered by store (FR-AUTH-1)
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const storeRaw = req.query["store_number"];
    const storeNumber =
      typeof storeRaw === "string" && storeRaw !== "" ? Number(storeRaw) : undefined;

    const employees = await prisma.employee.findMany({
      where: {
        employmentStatus: "active",
        ...(storeNumber !== undefined ? { storeNumber } : {}),
      },
      orderBy: { lastName: "asc" },
    });
    const result: EmployeeResponse[] = employees.map((e) => ({
      employee_id: e.employeeId,
      first_name: e.firstName,
      last_name: e.lastName,
      store_number: e.storeNumber,
    }));
    res.json(result);
  })
);

// GET /api/employees/:id — single employee
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const employee = await prisma.employee.findUnique({
      where: { employeeId: Number(req.params["id"]) },
      include: {
        address: true,
        employeeRoles: { include: { role: true } },
        shifts: true,
      },
    });
    if (employee === null) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(employee);
  })
);

// GET /api/employees/:id/roles — roles for one employee (FR-AUTH-2)
router.get(
  "/:id/roles",
  asyncHandler(async (req: Request, res: Response) => {
    const employeeRoles = await prisma.employeeRole.findMany({
      where: { employeeId: Number(req.params["id"]) },
      include: { role: true },
    });
    res.json(employeeRoles.map((er) => er.role));
  })
);

// POST /api/employees — create employee
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, dateOfBirth, storeNumber, salary, hireDate, address, roleIds } =
      req.body as {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        storeNumber: number;
        salary?: number;
        hireDate: string;
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          country: string;
          postalCode: string;
        };
        roleIds: number[];
      };

    const newAddress = await prisma.address.create({ data: address });

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        storeNumber,
        salary: salary !== undefined ? salary : 0,
        hireDate: new Date(hireDate),
        addressId: newAddress.addressId,
        employeeRoles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      include: { address: true, employeeRoles: { include: { role: true } } },
    });
    res.status(201).json(employee);
  })
);

// PUT /api/employees/:id/status — update employment status
router.put(
  "/:id/status",
  asyncHandler(async (req: Request, res: Response) => {
    const { employmentStatus } = req.body as { employmentStatus: string };
    const employee = await prisma.employee.update({
      where: { employeeId: Number(req.params["id"]) },
      data: { employmentStatus },
    });
    res.json(employee);
  })
);

// POST /api/employees/:id/roles — add a role to an employee
router.post(
  "/:id/roles",
  asyncHandler(async (req: Request, res: Response) => {
    const { roleId } = req.body as { roleId: number };
    const employeeRole = await prisma.employeeRole.create({
      data: { employeeId: Number(req.params["id"]), roleId },
      include: { role: true },
    });
    res.status(201).json(employeeRole);
  })
);

export default router;
