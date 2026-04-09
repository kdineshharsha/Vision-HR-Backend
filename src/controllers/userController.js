import User from "../models/users.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

export const registerUser = async (req, res, next) => {
  try {
    const { emp_id, name, email, password, role, designation, basic_salary } =
      req.body;

    if (
      !emp_id ||
      !name ||
      !email ||
      !password ||
      !designation ||
      !basic_salary
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ emp_id }, { email }] });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Employee ID or email already exists" });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({
      emp_id,
      name,
      email,
      password: hashedPassword,
      role,
      designation,
      basic_salary,
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
        _id: user._id,
        emp_id: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
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
