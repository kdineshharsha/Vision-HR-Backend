import mongoose from "mongoose";
import User from "../models/users.js";
import {
  format,
  parse,
  addMinutes,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import Attendance from "../models/attendance.js";
import Leave from "../models/leaves.js";
import { sendEmail } from "../utils/sendEmail.js";
import { lateWarningTemplate } from "../utils/emailTemplates.js";

export const markAttendance = async (req, res, next) => {
  try {
    const { emp_id, timestamp } = req.body;
    console.log("Received attendance data:", { emp_id, timestamp });
    const scanTime = parseISO(timestamp);
    const currentDate = format(scanTime, "yyyy-MM-dd");
    const currentTime = format(scanTime, "HH:mm:ss");

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
      const shiftStartTimeDate = parse(shiftStart, "HH:mm:ss", scanTime);
      const startTimeDate = parse(shiftStart, "HH:mm:ss", new Date());

      const thresholdDate = addMinutes(startTimeDate, gracePeriod);

      const lateThreshold = format(thresholdDate, "HH:mm:ss");

      const isLate = currentTime > lateThreshold;

      let late_time = 0;

      if (isLate) {
        late_time = differenceInMinutes(scanTime, shiftStartTimeDate);
        const emailHtml = lateWarningTemplate(
          user.name,
          currentDate,
          late_time,
        );
        await sendEmail(
          user.email,
          "Attendance Alert: Late Check-In Detected",
          emailHtml,
        );
      }

      attendance = await Attendance.create({
        user: user._id,
        emp_id: user.emp_id,
        date: currentDate,
        checkIn: scanTime,
        status: isLate ? "Late" : "Present",
        late_minutes: late_time,
        ot_minutes: 0,
      });
      return res
        .status(201)
        .json({ status: "IN", time: currentTime, attendance });
    } else {
      const min_ot_minutes = 60;
      let ot_minutes = 0;
      const shiftEnd = "17:00:00";
      const shiftEndTimeDate = parse(shiftEnd, "HH:mm:ss", scanTime);
      if (scanTime > shiftEndTimeDate) {
        const extra_minutes = differenceInMinutes(scanTime, shiftEndTimeDate);

        if (extra_minutes >= min_ot_minutes) {
          ot_minutes = extra_minutes;
        } else {
          ot_minutes = 0;
        }
      }
      attendance.checkOut = scanTime;
      attendance.ot_minutes = ot_minutes;

      const diffInMs = attendance.checkOut - attendance.checkIn;
      attendance.workHours = diffInMs / (1000 * 60 * 60).toFixed(2);
      await attendance.save();
      return res
        .status(200)
        .json({ success: true, status: "OUT", data: attendance });
    }
  } catch (error) {
    console.error(error);
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

export const getDailyAttendance = async (req, res, next) => {
  try {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");

    const dailyRecords = await Attendance.find({ date: today })
      .populate("user", "name email designation")
      .sort({ checkIn: -1 });
    const timeZone = "Asia/Colombo";

    const formattedData = dailyRecords.map((record) => {
      const in_time = record.checkIn
        ? formatInTimeZone(new Date(record.checkIn), timeZone, "HH:mm:ss")
        : "--";

      const out_time = record.checkOut
        ? formatInTimeZone(new Date(record.checkOut), timeZone, "HH:mm:ss")
        : "--";

      let leave_type = null;
      if (record.status === "Half-Day") {
        leave_type = "Early Leave";
      } else if (
        record.status === "On Leave" ||
        record.status === "Medical Leave"
      ) {
        leave_type = "Medical";
      }

      return {
        user_id: record.emp_id || "--",
        name: record.user ? record.user.name : "Unknown",
        in_time: in_time,
        out_time: out_time,
        leave_type: leave_type,
        status: record.status || "Present",
      };
    });

    return res.status(200).json({
      status: "success",
      date: today,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const totalEmployees = await User.countDocuments();

    const presentCount = await Attendance.countDocuments({ date: today });

    const lateCount = await Attendance.countDocuments({
      date: today,
      status: "Late",
    });

    const leaveCount = await Leave.countDocuments({
      date: { $lte: new Date(today) },

      status: "Approved",
    });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        present: presentCount,
        late: lateCount,
        onLeave: leaveCount,
        absent: totalEmployees - presentCount - leaveCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDetailedAttendanceReport = async (req, res, next) => {
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
      .populate("user", "name ")
      .sort({ date: 1 });
    const timeZone = "Asia/Colombo";
    const reportData = attendanceRecords.map((record) => {
      const in_time = record.checkIn
        ? formatInTimeZone(new Date(record.checkIn), timeZone, "HH:mm:ss")
        : "--";
      const out_time = record.checkOut
        ? formatInTimeZone(new Date(record.checkOut), timeZone, "HH:mm:ss")
        : "--";

      return {
        emp_id: record.emp_id || "--",
        name: record.user ? record.user.name : "Unknown",
        date: record.date,
        in_time: in_time,
        out_time: out_time,
        late_minutes: record.late_minutes || 0,
        ot_minutes: record.ot_minutes || 0,
        status: record.status || "Present",
      };
    });
    res.status(200).json({ data: reportData });
  } catch (error) {}
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const currentDate = new Date();
    const month = req.query.month
      ? parseInt(req.query.month)
      : currentDate.getMonth() + 1;
    const year = req.query.year
      ? parseInt(req.query.year)
      : currentDate.getFullYear();

    const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const lastDay = new Date(year, month, 0).toISOString().split("T")[0];

    const myAttendance = await Attendance.find({
      user: userId,
      date: { $gte: firstDay, $lte: lastDay },
    }).sort({ date: -1 });

    const timeZone = "Asia/Colombo";

    const formattedData = myAttendance.map((record) => {
      const in_time = record.checkIn
        ? formatInTimeZone(new Date(record.checkIn), timeZone, "HH:mm:ss")
        : "--";

      const out_time = record.checkOut
        ? formatInTimeZone(new Date(record.checkOut), timeZone, "HH:mm:ss")
        : "--";

      return {
        _id: record._id,
        date: record.date,
        in_time: in_time,
        out_time: out_time,
        late_minutes: record.late_minutes || 0,
        ot_minutes: record.ot_minutes || 0,
        work_hours: record.workHours || 0,
        status: record.status || "Present",
      };
    });

    res.status(200).json({
      success: true,
      month: month,
      year: year,
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Get My Attendance Error:", error);
    next(error);
  }
};
