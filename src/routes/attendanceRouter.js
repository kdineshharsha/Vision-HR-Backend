import express from "express";
import {
  getAttendanceByDateRange,
  getDailyAttendance,
  markAttendance,
} from "../controllers/attendanceController.js";

const attendanceRouter = express.Router();

attendanceRouter.post("/mark", markAttendance);
attendanceRouter.get("/report", getAttendanceByDateRange);
attendanceRouter.get("/today", getDailyAttendance);
export default attendanceRouter;
