import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: true,
    },

    basic_salary_snapshot: {
      type: Number,
      required: true,
    },

    attendance_summary: {
      standard_working_days: { type: Number, required: true },
      actual_open_days: { type: Number, required: true },
      total_working_days: { type: Number, default: 0 },
      present_days: { type: Number, default: 0 },
      approved_leaves: { type: Number, default: 0 },
      absent_days: { type: Number, default: 0 },
      late_minutes: { type: Number, default: 0 },
      ot_minutes: { type: Number, default: 0 },
    },

    earnings: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],

    deductions: [
      {
        name: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],

    gross_pay: {
      type: Number,
      required: true,
    },
    total_deductions: {
      type: Number,
      required: true,
    },
    net_pay: {
      type: Number,
      required: true,
    },

    payment_status: {
      type: String,
      enum: ["Pending", "Paid", "Hold"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

payrollSchema.index({ user: 1, month: 1 }, { unique: true });

const Payroll = mongoose.model("Payroll", payrollSchema);
export default Payroll;
