import express from "express";
import {
  getAllUsers,
  getDashboardStats,
  loginUser,
  registerUser,
  updateUser,
} from "../controllers/userController.js";
import verifyJWT from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/dashboard-stats", verifyJWT, getDashboardStats);
userRouter.patch("/update/:emp_id", updateUser);

export default userRouter;
