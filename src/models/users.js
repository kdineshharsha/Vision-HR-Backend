import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  emp_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Admin", "HR", "Employee"],
    default: "Employee",
  },
  designation: {
    type: String,
    required: true,
  },
  basic_salary: {
    type: Number,
    required: true,
  },
  face_embeddings: {
    type: [Number],
    default: [],
  },

  status: {
    type: String,
    enum: ["Active", "Suspended", "Resigned"],
    default: "Active",
  },
  resigned_date: {
    type: String,
    default: null,
  },
  joined_date: {
    type: String,
    default: new Date().toISOString().split("T")[0],
  },
  leave_balance: {
    casual_leaves: {
      type: Number,
      default: 7,
    },
    annual_leaves: {
      type: Number,
      default: 14,
    },
    short_leaves: {
      type: Number,
      default: 2,
    },
    medical_leaves: {
      type: Number,
      default: 7,
    },
  },
});

const User = mongoose.model("User", userSchema);
export default User;
