import express from "express";
import {
  applyLeave,
  getAllLeaves,
  getLeavesByDateRange,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const leaveRouter = express.Router();

leaveRouter.get("/", getAllLeaves);
leaveRouter.get("/report", getLeavesByDateRange);
leaveRouter.put("/status", updateLeaveStatus);
leaveRouter.post("/apply", applyLeave);

export default leaveRouter;
