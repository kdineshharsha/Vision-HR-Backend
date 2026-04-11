import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import userRouter from "./routes/userRouter.js";
import attendanceRouter from "./routes/attendanceRouter.js";
import leaveRouter from "./routes/leaveRouter.js";
const app = express();

app.use(helmet());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json({ limit: "50kb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(cors());
app.use("/api", limiter);
app.use("/api/users", userRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leaves", leaveRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: err.status || "error",
    message: err.message || "Internal Server Error",
  });
});

export default app;
