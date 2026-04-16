import Setting from "../models/settings.js";

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = await Setting.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const {
      shift_start_time,
      shift_end_time,
      grace_period_mins,
      min_ot_mins,
      standard_working_days,
    } = req.body;

    const updatedSettings = await Setting.findOneAndUpdate(
      {},
      {
        $set: {
          shift_start_time,
          shift_end_time,
          grace_period_mins,
          min_ot_mins,
          standard_working_days,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    next(error);
  }
};
