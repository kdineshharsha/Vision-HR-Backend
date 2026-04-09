import mongoose from "mongoose";
import User from "../models/users.js";
import { format, parse, addMinutes } from "date-fns";
import Attendance from "../models/attendance.js";
export const markAttendance = async (req, res, next) => {
  try {
    const { emp_id } = req.body;
    const now = new Date();
    const currentDate = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm:ss");

    const user = await User.findOne({ emp_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let attendance = await Attendance.findOne({
      user: user._id,
      date: currentDate,
    });

    if (!attendance) {
      const shiftStart = "08:00:00";
      const gracePeriod = 5;
      const startTimeDate = parse(shiftStart, "HH:mm:ss", new Date());

      const thresholdDate = addMinutes(startTimeDate, gracePeriod);

      const lateThreshold = format(thresholdDate, "HH:mm:ss");

      const isLate = currentTime > lateThreshold;

      attendance = await Attendance.create({
        user: user._id,
        emp_id: user.emp_id,
        date: currentDate,
        checkIn: now,
        status: isLate ? "Late" : "Present",
      });
      return res
        .status(201)
        .json({ status: "IN", time: currentTime, attendance });
    } else {
      if (attendance.checkOut) {
        return res.status(400).json({ message: "Already checked out" });
      }

      const shiftEnd = "17:00:00";
      const isShiftEnd = currentTime >= shiftEnd;

      if (isShiftEnd) {
        attendance.checkOut = now;
        const diffInMs = attendance.checkOut - attendance.checkIn;
        attendance.workHours = diffInMs / (1000 * 60 * 60).toFixed(2);
        await attendance.save();
        return res
          .status(200)
          .json({ status: "OUT", time: currentTime, attendance });
      } else {
        return res
          .status(400)
          .json({ message: "You can't check out before 5 !" });
      }
    }
  } catch (error) {
    next(error);
  }
};

export const getAttendanceByDateRange = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const attendanceRecords = await Attendance.find({
      date: {
        $gte: start_date,
        $lte: end_date,
      },
    })
      .populate("user", "name email designation")
      .sort({ date: 1, checkIn: 1 });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({
        message: "No attendance records found for the specified date range.",
      });
    }

    return res.status(200).json({
      status: "success",
      count: attendanceRecords.length,
      data: attendanceRecords,
    });
  } catch (error) {
    next(error);
  }
};
