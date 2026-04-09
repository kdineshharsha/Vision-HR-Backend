import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emp_id: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "On Leave", "Medical Leave"],
      default: "Present",
    },
    workHours: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
