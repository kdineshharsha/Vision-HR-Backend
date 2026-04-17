import User from "../models/users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { daysInWeek } from "date-fns/constants";
import Attendance from "../models/attendance.js";
import Leave from "../models/leaves.js";
dotenv.config();

export const registerUser = async (req, res, next) => {
  try {
    let {
      emp_id,
      name,
      email,
      designation,
      basic_salary,
      face_embedding,
      role,
      password,
    } = req.body;

    if (
      !emp_id ||
      !name ||
      !email ||
      !designation ||
      !basic_salary ||
      !face_embedding
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ emp_id }, { email }] });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Employee ID or email already exists" });
    }

    if (!password) password = emp_id;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({
      emp_id: emp_id,
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      designation: designation,
      basic_salary: basic_salary,
      face_embeddings: face_embedding,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        basic_salary: user.basic_salary,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    next(error);
  }
};
export const loginUser = async (req, res, next) => {
  try {
    const { emp_id, password } = req.body;
    if (!emp_id || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ emp_id });

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (isPasswordCorrect) {
      const userData = {
        id: user._id,
        user_id: user.emp_id,
        name: user.name,
        in_time: user.checkIn,
        out_time: user.checkOut,
        leave_type: user.status,
      };

      const token = jwt.sign(userData, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      res
        .status(200)
        .json({ message: "Login successful", token, user: userData });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found in the database",
        data: [],
      });
    }
    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const emp_id = req.params.emp_id;
    const updateData = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { emp_id },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    next(error);
  }
};

//

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const date = new Date();
    const today = date.toISOString().split("T")[0];

    const todayRecord = await Attendance.findOne({ user: userId, date: today });
    console.log("Today's Attendance Record:", todayRecord);
    let today_status = "Not Punched Yet";
    let in_time = "--";

    if (todayRecord) {
      today_status = "IN";
      in_time = todayRecord.in_time;
    }

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const thisMonthAttendance = await Attendance.find({
      user: userId,
      date: { $gte: firstDay, $lte: lastDay },
    });

    let late_days = 0;
    let total_ot_minutes = 0;

    thisMonthAttendance.forEach((record) => {
      if (record.late_minutes > 0) late_days++;
      if (record.ot_minutes > 0) total_ot_minutes += record.ot_minutes;
    });

    const ot_hours = (total_ot_minutes / 60).toFixed(1);

    const currentUser = await User.findById(userId).select("leave_balance");

    let available_leaves = 0;
    if (currentUser && currentUser.leave_balance) {
      const { casual_leaves, annual_leaves } = currentUser.leave_balance;
      available_leaves = casual_leaves + annual_leaves;
    }

    const recent_attendance = await Attendance.find({ user: userId })
      .sort({ date: -1 })
      .limit(5)
      .select("date in_time out_time late_minutes ot_minutes status");

    res.status(200).json({
      success: true,
      data: {
        today_status,
        in_time,
        late_days_this_month: late_days,
        ot_hours_this_month: ot_hours,
        available_leaves,
        recent_attendance,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    next(error);
  }
};
