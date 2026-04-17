import Leave from "../models/leaves.js";
import User from "../models/users.js";
import { leaveRejectedTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";

export const applyLeave = async (req, res, next) => {
  try {
    const { emp_id, date, leave_type, reason } = req.body;

    const user = await User.findOne({ emp_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingLeave = await Leave.findOne({ user: user._id, date });

    if (existingLeave) {
      return res
        .status(400)
        .json({ message: "Leave already applied for this date" });
    }

    switch (leave_type) {
      case "Annual":
        if (user.leave_balance.annual_leaves <= 0) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Annual leave balance.",
          });
        }
        user.leave_balance.annual_leaves -= 1;
        break;

      case "Medical":
        if (user.leave_balance.medical_leaves <= 0) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Medical leave balance.",
          });
        }
        user.leave_balance.medical_leaves -= 1;
        break;

      case "Casual":
        if (user.leave_balance.casual_leaves <= 0) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Casual leave balance.",
          });
        }
        user.leave_balance.casual_leaves -= 1;
        break;

      case "Short Leave":
        if (user.leave_balance.short_leaves <= 0) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Short leave balance.",
          });
        }
        user.leave_balance.short_leaves -= 1;
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid leave type provided." });
    }

    await user.save();

    const leave = new Leave({
      user: user._id,
      emp_id: user.emp_id,
      date: date,
      leave_type,
      reason,
      status: "Pending",
    });

    await leave.save();
    res
      .status(201)
      .json({ success: true, message: "Leave applied successfully", leave });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getAllLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find()
      .populate("user", "name email designation")
      .sort({ date: -1 });
    res.status(200).json({
      success: true,
      message: "Leaves retrieved successfully",
      data: leaves,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const updateLeaveStatus = async (req, res, next) => {
  try {
    const { leave_id, status } = req.body;
    const leave = await Leave.findById(leave_id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }
    leave.status = status;
    if (status === "Rejected") {
      const user = await User.findById(leave.user);
      const emailHtml = leaveRejectedTemplate(
        user.name,
        leave.date.toISOString().split("T")[0],
        leave.leave_type,
        leave.reason || "No reason provided",
      );

      await sendEmail(
        user.email,
        `Leave Application Rejected for ${leave.date.toISOString().split("T")[0]}`,
        emailHtml,
      );
    }
    await leave.save();
    res.status(200).json({
      success: true,
      message: "Leave status updated successfully",
      leave,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getLeavesByDateRange = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required" });
    }

    const leaves = await Leave.find({
      date: {
        $gte: start_date,
        $lte: end_date,
      },
    })
      .populate("user", "name ")
      .sort({ date: 1, checkIn: 1 });

    const formattedData = leaves.map((leave) => ({
      emp_id: leave.emp_id,
      name: leave.user.name,
      date: leave.date.toISOString().split("T")[0],
      leave_type: leave.leave_type,
      reason: leave.reason,
      status: leave.status,
    }));

    res.status(200).json({
      success: true,
      message: `Leaves from ${start_date} to ${end_date} retrieved successfully`,
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getMyLeaves = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    const currentUser = await User.findById(userId).select("leave_balance");

    const myLeaves = await Leave.find({ user: userId }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        balances: currentUser.leave_balance,
        history: myLeaves,
      },
    });
  } catch (error) {
    console.error("Get My Leaves Error:", error);
    next(error);
  }
};
