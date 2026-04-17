import express from "express";
import {
  applyLeave,
  getAllLeaves,
  getLeavesByDateRange,
  getMyLeaves,
  updateLeaveStatus,
} from "../controllers/leaveController.js";
import verifyJWT from "../middlewares/auth.js";

const leaveRouter = express.Router();

leaveRouter.get("/", getAllLeaves);
leaveRouter.get("/report", getLeavesByDateRange);
leaveRouter.put("/status", updateLeaveStatus);
leaveRouter.post("/apply", applyLeave);
leaveRouter.get("/my-leaves", verifyJWT, getMyLeaves);

export default leaveRouter;
