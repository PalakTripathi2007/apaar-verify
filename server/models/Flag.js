const mongoose = require("mongoose");

const flagSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    apaarId: String,
    institutionCode: String,
    flagType: { type: String, required: true },
    reason: { type: String, required: true },
    severity: { type: String, default: "medium" },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flag", flagSchema);