import prisma from "../db.ts";

export async function getShifts(params: {
  from?: string | undefined;
  to?: string | undefined;
  store_number?: number | undefined;
}) {
  const shifts = await prisma.shift.findMany({
    where: {
      ...(params.from !== undefined || params.to !== undefined
        ? {
            startTimestamp: {
              ...(params.from !== undefined ? { gte: new Date(params.from) } : {}),
              ...(params.to !== undefined ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
      ...(params.store_number !== undefined
        ? { employee: { storeNumber: params.store_number } }
        : {}),
    },
    include: {
      employee: { select: { employeeId: true, firstName: true, lastName: true } },
      role: { select: { roleId: true, name: true } },
    },
    orderBy: { startTimestamp: "asc" },
  });

  return shifts.map((s) => ({
    shift_id: s.shiftId,
    employee_id: s.employeeId,
    employee_name: `${s.employee.firstName} ${s.employee.lastName}`,
    role_id: s.roleId,
    role_name: s.role.name,
    start_timestamp: s.startTimestamp.toISOString(),
    end_timestamp: s.endTimestamp.toISOString(),
    clock_in_timestamp: s.clockInTimestamp?.toISOString() ?? null,
    clock_out_timestamp: s.clockOutTimestamp?.toISOString() ?? null,
  }));
}

export async function createShift(data: {
  employee_id: number;
  role_id: number;
  start_timestamp: string;
  end_timestamp: string;
}) {
  // Verify employee has the requested role (FR-SCH-4)
  const employeeRole = await prisma.employeeRole.findUnique({
    where: { employeeId_roleId: { employeeId: data.employee_id, roleId: data.role_id } },
  });
  if (employeeRole === null) {
    throw new Error("Employee does not have the specified role");
  }

  const shift = await prisma.shift.create({
    data: {
      employeeId: data.employee_id,
      roleId: data.role_id,
      startTimestamp: new Date(data.start_timestamp),
      endTimestamp: new Date(data.end_timestamp),
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      role: { select: { name: true } },
    },
  });

  return {
    shift_id: shift.shiftId,
    employee_id: shift.employeeId,
    employee_name: `${shift.employee.firstName} ${shift.employee.lastName}`,
    role_id: shift.roleId,
    role_name: shift.role.name,
    start_timestamp: shift.startTimestamp.toISOString(),
    end_timestamp: shift.endTimestamp.toISOString(),
    clock_in_timestamp: null,
    clock_out_timestamp: null,
  };
}

export async function updateShift(
  shiftId: number,
  data: { role_id?: number | undefined; start_timestamp?: string | undefined; end_timestamp?: string | undefined }
) {
  const existing = await prisma.shift.findUniqueOrThrow({ where: { shiftId } });
  if (existing.clockInTimestamp !== null) {
    throw new Error("Cannot edit a shift that has already been clocked in");
  }

  const shift = await prisma.shift.update({
    where: { shiftId },
    data: {
      ...(data.role_id !== undefined ? { roleId: data.role_id } : {}),
      ...(data.start_timestamp !== undefined ? { startTimestamp: new Date(data.start_timestamp) } : {}),
      ...(data.end_timestamp !== undefined ? { endTimestamp: new Date(data.end_timestamp) } : {}),
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      role: { select: { name: true } },
    },
  });

  return {
    shift_id: shift.shiftId,
    employee_id: shift.employeeId,
    employee_name: `${shift.employee.firstName} ${shift.employee.lastName}`,
    role_id: shift.roleId,
    role_name: shift.role.name,
    start_timestamp: shift.startTimestamp.toISOString(),
    end_timestamp: shift.endTimestamp.toISOString(),
    clock_in_timestamp: shift.clockInTimestamp?.toISOString() ?? null,
    clock_out_timestamp: shift.clockOutTimestamp?.toISOString() ?? null,
  };
}

export async function deleteShift(shiftId: number): Promise<void> {
  const existing = await prisma.shift.findUniqueOrThrow({ where: { shiftId } });
  if (existing.clockInTimestamp !== null) {
    throw new Error("Cannot cancel a shift that has already been clocked in");
  }
  await prisma.shift.delete({ where: { shiftId } });
}
