import express from "express";
import {
  getAttendanceByDateRange,
  getDailyAttendance,
  getDashboardStats,
  getDetailedAttendanceReport,
  markAttendance,
} from "../controllers/attendanceController.js";

const attendanceRouter = express.Router();

attendanceRouter.post("/mark", markAttendance);
attendanceRouter.get("/report", getAttendanceByDateRange);
attendanceRouter.get("/detailed-attendance", getDetailedAttendanceReport);
attendanceRouter.get("/today", getDailyAttendance);
attendanceRouter.get("/summary", getDashboardStats);
export default attendanceRouter;
