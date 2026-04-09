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
  leave_balance: {
    casual_leaves: {
      type: Number,
      default: 12,
    },
    short_leaves: {
      type: Number,
      default: 2,
    },
  },
});

const User = mongoose.model("User", userSchema);
export default User;
