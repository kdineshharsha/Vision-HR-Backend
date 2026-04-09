import express from "express";
import {
  getAttendanceByDateRange,
  markAttendance,
} from "../controllers/attendanceController.js";

const attendanceRouter = express.Router();

attendanceRouter.post("/mark", markAttendance);
attendanceRouter.get("/report", getAttendanceByDateRange);

export default attendanceRouter;
