import User from "../models/users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { daysInWeek } from "date-fns/constants";
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
        user_id: user.emp_id,
        name: user.name,
        in_time: user.checkIn,
        out_time: user.checkOut,
        leave_type: user.status,
      };

      console.log(process.env.JWT_SECRET);
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
