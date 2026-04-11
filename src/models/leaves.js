import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emp_id: { type: String, required: true },
    date: { type: Date, required: true },
    leave_type: {
      type: String,
      enum: ["Annual", "Medical", "Casual", "Short Leave"],
      required: true,
    },
    reason: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
