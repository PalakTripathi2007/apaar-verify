const mongoose = require("mongoose");

const programSchema = new mongoose.Schema(
  {
    institutionCode: { type: String, required: true },
    program: { type: String, required: true },
    academicYear: { type: String, required: true },
    approvedIntake: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Program", programSchema);