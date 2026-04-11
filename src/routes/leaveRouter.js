import express from "express";
import { applyLeave, getAllLeaves } from "../controllers/leaveController.js";

const leaveRouter = express.Router();

leaveRouter.get("/", getAllLeaves);
leaveRouter.post("/apply", applyLeave);

export default leaveRouter;
