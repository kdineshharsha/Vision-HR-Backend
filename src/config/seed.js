import mongoose from "mongoose";
import Attendance from "../models/attendance.js";

// Add your actual MongoDB connection string here
const MONGO_URI =
  "mongodb+srv://dineshharsha182_db_user:MxgCmV455bea@cluster0.bh9jw0i.mongodb.net/?appName=Cluster0";

const users = [
  {
    _id: "69dc9edfe45e6d86c912296e",
    emp_id: "EMP_001",
    name: "Dinesh Harsha",
    type: "Perfect_With_OT",
  },
  {
    _id: "69dd01ab1668da810ee4917d",
    emp_id: "EMP_002",
    name: "Shaini Imalsha",
    type: "Always_Late",
  },
  {
    _id: "69dd01f51668da810ee49181",
    emp_id: "EMP_003",
    name: "Nethmi Amaya",
    type: "Mixed_With_Absent",
  },
];

// Helper to generate dates between a range
const getDaysArray = (start, end) => {
  const arr = [];
  for (
    let dt = new Date(start);
    dt <= new Date(end);
    dt.setDate(dt.getDate() + 1)
  ) {
    arr.push(new Date(dt));
  }
  return arr;
};

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for Seeding...");

    // Clear existing attendance for this specific period to avoid duplicates
    await Attendance.deleteMany({
      date: { $gte: "2026-03-21", $lte: "2026-04-20" },
    });
    console.log("Cleared old attendance records for the period.");

    const dates = getDaysArray("2026-03-21", "2026-04-20");
    const attendanceRecords = [];

    for (const dateObj of dates) {
      // Skip Weekends (Saturday = 6, Sunday = 0)
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;

      const dateStr = dateObj.toISOString().split("T")[0];

      for (const user of users) {
        let status = "Present";
        let late_minutes = 0;
        let ot_minutes = 0;
        let checkInTime = new Date(`${dateStr}T07:50:00Z`);
        let checkOutTime = new Date(`${dateStr}T17:00:00Z`);

        // Apply custom logic based on user type to test the Payroll Engine
        if (user.type === "Perfect_With_OT") {
          // Dinesh: Always on time, 2 hours OT every day
          ot_minutes = 120;
          checkOutTime = new Date(`${dateStr}T19:00:00Z`);
        } else if (user.type === "Always_Late") {
          // Shaini: 45 minutes late every day
          status = "Late";
          late_minutes = 45;
          checkInTime = new Date(`${dateStr}T08:45:00Z`);
        } else if (user.type === "Mixed_With_Absent") {
          // Nethmi: Make her absent on the 25th and 26th of March
          if (dateStr === "2026-03-25" || dateStr === "2026-03-26") {
            status = "Absent";
            checkInTime = null;
            checkOutTime = null;
          }
        }

        attendanceRecords.push({
          user: user._id,
          emp_id: user.emp_id,
          date: dateStr,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          status: status,
          workHours: status === "Absent" ? 0 : 8,
          late_minutes: late_minutes,
          ot_minutes: ot_minutes,
        });
      }
    }

    // Insert all records into the database
    await Attendance.insertMany(attendanceRecords);
    console.log(
      `Successfully seeded ${attendanceRecords.length} attendance records!`,
    );

    process.exit();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
