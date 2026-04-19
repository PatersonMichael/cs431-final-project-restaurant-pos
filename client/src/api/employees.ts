import client from "./client";
import type { Employee, EmployeeRole } from "../types";

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  storeNumber: number;
  salary: number;
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
}

export const getEmployees = () =>
  client.get<Employee[]>("/employees").then((r) => r.data);

export const getEmployee = (id: number) =>
  client.get<Employee>(`/employees/${id}`).then((r) => r.data);

export const createEmployee = (payload: CreateEmployeePayload) =>
  client.post<Employee>("/employees", payload).then((r) => r.data);

export const updateEmployeeStatus = (id: number, employmentStatus: string) =>
  client.put<Employee>(`/employees/${id}/status`, { employmentStatus }).then((r) => r.data);

export const addEmployeeRole = (id: number, roleId: number) =>
  client.post<EmployeeRole>(`/employees/${id}/roles`, { roleId }).then((r) => r.data);
