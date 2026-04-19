import { Router, type Request, type Response } from "express";
import prisma from "../db.ts";
import asyncHandler from "../utils/asynchHandler.ts";

const router = Router();

// Get all employees
router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const employees = await prisma.employee.findMany({
    include: {
      address: true,
      employeeRoles: {
        include: { role: true },
      },
    },
  });
  res.json(employees);
}));

// Get a single employee
router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const employee = await prisma.employee.findUnique({
    where: { employeeId: Number(req.params.id) },
    include: {
      address: true,
      employeeRoles: {
        include: { role: true },
      },
      shifts: true,
    },
  });
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(employee);
}));

// Create an employee
router.post("/", asyncHandler(async (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    storeNumber,
    salary,
    hireDate,
    address,
    roleIds,
  } = req.body;

  const newAddress = await prisma.address.create({
    data: address,
  });

  const employee = await prisma.employee.create({
    data: {
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      storeNumber,
      salary,
      hireDate: new Date(hireDate),
      addressId: newAddress.addressId,
      employeeRoles: {
        create: roleIds.map((roleId: number) => ({ roleId })),
      },
    },
    include: {
      address: true,
      employeeRoles: {
        include: { role: true },
      },
    },
  });
  res.status(201).json(employee);
}));

// Update employment status
router.put("/:id/status", asyncHandler(async (req: Request, res: Response) => {
  const { employmentStatus } = req.body;
  const employee = await prisma.employee.update({
    where: { employeeId: Number(req.params.id) },
    data: { employmentStatus },
  });
  res.json(employee);
}));

// Add a role to an employee
router.post("/:id/roles", asyncHandler(async (req: Request, res: Response) => {
  const { roleId } = req.body;
  const employeeRole = await prisma.employeeRole.create({
    data: {
      employeeId: Number(req.params.id),
      roleId,
    },
    include: { role: true },
  });
  res.status(201).json(employeeRole);
}));

export default router;
