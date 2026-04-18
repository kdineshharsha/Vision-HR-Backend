import Payroll from "../models/payroll.js";
import User from "../models/users.js";
import Attendance from "../models/attendance.js";
import Leave from "../models/leaves.js";

const getDaysDifference = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

export const generateBulkPayroll = async (req, res, next) => {
  try {
    const {
      month,
      from_date,
      to_date,
      standard_working_days,
      actual_open_days,
    } = req.body;

    if (
      !month ||
      !from_date ||
      !to_date ||
      !standard_working_days ||
      !actual_open_days
    ) {
      return res
        .status(400)
        .json({ message: "Missing required payroll parameters." });
    }

    const usersToProcess = await User.find({
      $or: [
        { status: "Active" },
        {
          status: "Resigned",
          resigned_date: { $gte: from_date, $lte: to_date },
        },
      ],
    });

    if (usersToProcess.length === 0) {
      return res.status(404).json({ message: "No eligible users found." });
    }

    const allAttendances = await Attendance.find({
      date: { $gte: from_date, $lte: to_date },
    });

    const allLeaves = await Leave.find({
      date: { $gte: new Date(from_date), $lte: new Date(to_date) },
      status: "Approved",
    });

    const attendanceMap = {};
    allAttendances.forEach((record) => {
      const userIdStr = record.user.toString();
      if (!attendanceMap[userIdStr]) attendanceMap[userIdStr] = [];
      attendanceMap[userIdStr].push(record);
    });

    const leaveMap = {};
    allLeaves.forEach((record) => {
      const userIdStr = record.user.toString();
      if (!leaveMap[userIdStr]) leaveMap[userIdStr] = [];
      leaveMap[userIdStr].push(record);
    });

    const results = [];

    for (const user of usersToProcess) {
      const userIdStr = user._id.toString();
      const userAttendances = attendanceMap[userIdStr] || [];
      const userLeaves = leaveMap[userIdStr] || [];

      let calculatedBasic = user.basic_salary;
      let paymentHoldStatus = "Pending";

      if (user.status === "Resigned") {
        const workedDaysInMonth = getDaysDifference(
          from_date,
          user.resigned_date,
        );
        calculatedBasic =
          (user.basic_salary / standard_working_days) * workedDaysInMonth;
      } else if (user.status === "Suspended") {
        calculatedBasic = user.basic_salary * 0.5;
        paymentHoldStatus = "Hold";
      }

      let presentDays = 0;
      let totalLateMinutes = 0;
      let totalOtMinutes = 0;
      let approvedLeaves = userLeaves.length;

      if (user.status !== "Suspended") {
        userAttendances.forEach((record) => {
          if (record.status === "Present" || record.status === "Late") {
            presentDays++;
          }
          totalLateMinutes += record.late_minutes || 0;
          totalOtMinutes += record.ot_minutes || 0;
        });
      }

      let absentDays = 0;
      if (user.status !== "Suspended") {
        absentDays = Math.max(
          0,
          actual_open_days - (presentDays + approvedLeaves),
        );
      }

      const perDayRate = user.basic_salary / standard_working_days;
      const hourlyRate = perDayRate / 8;

      const otPay = (totalOtMinutes / 60) * (hourlyRate * 1.5);
      const latePenalty = (totalLateMinutes / 60) * hourlyRate;

      const noPayAmount = absentDays * perDayRate;

      const earnedBasic = Math.max(0, calculatedBasic - noPayAmount);
      const epfAmount = earnedBasic * 0.08;

      let attendanceBonus = 0;
      if (
        user.status === "Active" &&
        presentDays + approvedLeaves >= actual_open_days &&
        totalLateMinutes === 0
      ) {
        attendanceBonus = 5000;
      }

      const earnings = [
        { name: "Basic Salary", amount: Number(calculatedBasic.toFixed(2)) },
        { name: "Overtime Pay", amount: Number(otPay.toFixed(2)) },
        {
          name: "Attendance Bonus",
          amount: Number(attendanceBonus.toFixed(2)),
        },
      ].filter((e) => e.amount > 0);

      const deductions = [
        { name: "EPF (8%)", amount: Number(epfAmount.toFixed(2)) },
        { name: "Late Penalty", amount: Number(latePenalty.toFixed(2)) },
        { name: "No-Pay", amount: Number(noPayAmount.toFixed(2)) },
      ].filter((d) => d.amount > 0);

      const totalGross = earnings.reduce((sum, item) => sum + item.amount, 0);
      const totalDed = deductions.reduce((sum, item) => sum + item.amount, 0);
      const netPay = Math.max(0, totalGross - totalDed);

      const payrollData = {
        user: user._id,
        emp_id: user.emp_id,
        month: month,
        basic_salary_snapshot: user.basic_salary,
        attendance_summary: {
          standard_working_days: standard_working_days,
          actual_open_days: actual_open_days,
          present_days: presentDays,
          approved_leaves: approvedLeaves,
          absent_days: absentDays,
          late_minutes: totalLateMinutes,
          ot_minutes: totalOtMinutes,
        },
        earnings,
        deductions,
        gross_pay: Number(totalGross.toFixed(2)),
        total_deductions: Number(totalDed.toFixed(2)),
        net_pay: Number(netPay.toFixed(2)),
        payment_status: paymentHoldStatus,
      };

      await Payroll.findOneAndReplace(
        { user: user._id, month: month },
        payrollData,
        { returnDocument: "after", upsert: true },
      );

      results.push(user.emp_id);
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed payroll for ${results.length} employees.`,
      processed_users: results,
    });
  } catch (error) {
    console.error("Payroll Generation Error:", error);
    next(error);
  }
};

export const getPayrollReport = async (req, res, next) => {
  try {
    const { month, emp_id } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month parameter is required. Example: ?month=2026-04",
      });
    }

    const query = { month: month };

    if (emp_id) {
      query.emp_id = emp_id;
    }

    const payrollRecords = await Payroll.find(query)
      .populate("user", "name designation  email joined_date status")
      .sort({ emp_id: 1 });

    if (payrollRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payroll records found for the given criteria.",
      });
    }

    res.status(200).json({
      success: true,
      count: payrollRecords.length,
      data: payrollRecords,
    });
  } catch (error) {
    console.error("Fetch Payroll Report Error:", error);
    next(error);
  }
};

export const getMyPayslips = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { year, month } = req.query;

    let query = { user: userId };

    if (year && month && month !== "All") {
      const formattedMonth = month.toString().padStart(2, "0");
      query.month = `${year}-${formattedMonth}`;
    } else if (year) {
      query.month = { $regex: `^${year}` };
    }

    const myPayslips = await Payroll.find(query)
      .populate("user", "name designation emp_id")
      .sort({ month: -1 });

    res.status(200).json({
      success: true,
      count: myPayslips.length,
      data: myPayslips,
    });
  } catch (error) {
    console.error("Fetch My Payslips Error:", error);
    next(error);
  }
};
