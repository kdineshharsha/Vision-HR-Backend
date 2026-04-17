import express from "express";
import {
  getAttendanceByDateRange,
  getDailyAttendance,
  getDashboardStats,
  getDetailedAttendanceReport,
  getMyAttendance,
  markAttendance,
} from "../controllers/attendanceController.js";
import verifyJWT from "../middlewares/auth.js";

const attendanceRouter = express.Router();

attendanceRouter.post("/mark", markAttendance);
attendanceRouter.get("/report", getAttendanceByDateRange);
attendanceRouter.get("/detailed-attendance", getDetailedAttendanceReport);
attendanceRouter.get("/today", getDailyAttendance);
attendanceRouter.get("/summary", getDashboardStats);
attendanceRouter.get("/my-attendance", verifyJWT, getMyAttendance);
export default attendanceRouter;
