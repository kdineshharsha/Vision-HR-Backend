import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    shift_start_time: {
      type: String,
      default: "08:00",
    },
    shift_end_time: {
      type: String,
      default: "17:00",
    },
    grace_period_mins: {
      type: Number,
      default: 15,
    },
    min_ot_mins: {
      type: Number,
      default: 30,
    },
    standard_working_days: {
      type: Number,
      default: 22,
    },
  },
  { timestamps: true },
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
