// Augment Express.Request so req.employeeId is typed throughout the app
declare namespace Express {
  interface Request {
    employeeId?: number;
  }
}
