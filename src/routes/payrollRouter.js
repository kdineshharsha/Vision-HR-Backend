import express from "express";
import {
  generateBulkPayroll,
  getPayrollReport,
} from "../controllers/payrollController.js";

const payrollRouter = express.Router();

payrollRouter.get("/generate", generateBulkPayroll);
payrollRouter.get("/report", getPayrollReport);

export default payrollRouter;
