import User from "../models/users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Attendance from "../models/attendance.js";
import { formatInTimeZone } from "date-fns-tz";
dotenv.config();

export const registerUser = async (req, res, next) => {
  if (!req.user || (req.user.role !== "Admin" && req.user.role !== "HR")) {
    console.log("Unauthorized registration attempt by user:", req.user);
    return res.status(403).json({
      success: false,
      message: "Access denied. Only Admin and HR can register users.",
    });
  }

  try {
    let {
      name,
      email,
      designation,
      basic_salary,
      face_embedding,
      role,
      password,
    } = req.body;

    if (!name || !email || !designation || !basic_salary || !face_embedding) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Employee ID or email already exists" });
    }

    const lastUser = await User.findOne()
      .sort({ emp_id: { $regex: /^EMP_/ } })
      .sort({ _id: -1 });

    let newEmpId = "EMP_001";

    if (lastUser && lastUser.emp_id) {
      const lastEmpIdNum = parseInt(lastUser.emp_id.split("_")[1], 10);
      if (!isNaN(lastEmpIdNum)) {
        const nextEmpIdNum = lastEmpIdNum + 1;
        newEmpId = `EMP_${String(nextEmpIdNum).padStart(3, "0")}`;
      }
    }

    if (!password) password = emp_id;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({
      emp_id: newEmpId,
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
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        joined_date: user.joined_date,
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
    let today_status = "Not Punched Yet";
    let in_time = "--";

    if (todayRecord) {
      today_status = "IN";
      in_time = todayRecord.checkIn;
    }
    in_time = in_time
      ? formatInTimeZone(new Date(in_time), "Asia/Colombo", "HH:mm:ss")
      : "--";

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
      .select("date checkIn checkOut late_minutes ot_minutes status");

    const timeZone = "Asia/Colombo";
    const formatted_attendance = recent_attendance.map((record) => {
      return {
        _id: record._id,
        date: record.date,
        in_time: record.checkIn
          ? formatInTimeZone(new Date(record.checkIn), timeZone, "HH:mm:ss")
          : "--",
        out_time: record.checkOut
          ? formatInTimeZone(new Date(record.checkOut), timeZone, "HH:mm:ss")
          : "--",
        late_minutes: record.late_minutes || 0,
        ot_minutes: record.ot_minutes || 0,
        status: record.status || "Present",
      };
    });

    res.status(200).json({
      success: true,
      data: {
        today_status,
        in_time,
        late_days_this_month: late_days,
        ot_hours_this_month: ot_hours,
        available_leaves,
        recent_attendance: formatted_attendance,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    next(error);
  }
};
