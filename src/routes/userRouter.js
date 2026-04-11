import express from "express";
import {
  getAllUsers,
  loginUser,
  registerUser,
  updateUser,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", getAllUsers);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.patch("/update/:emp_id", updateUser);

export default userRouter;
