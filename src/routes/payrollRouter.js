import express from "express";
import {
  generateBulkPayroll,
  getMyPayslips,
  getPayrollReport,
} from "../controllers/payrollController.js";
import verifyJWT from "../middlewares/auth.js";

const payrollRouter = express.Router();

payrollRouter.post("/generate", generateBulkPayroll);
payrollRouter.get("/report", getPayrollReport);
payrollRouter.get("/my-payslips", verifyJWT, getMyPayslips);
export default payrollRouter;
