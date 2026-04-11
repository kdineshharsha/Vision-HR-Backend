import Leave from "../models/leaves.js";
import User from "../models/users.js";

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
