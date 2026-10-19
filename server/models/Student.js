const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    apaarId: { type: String, index: true },
    fullName: { type: String, required: true },
    dateOfBirth: Date,
    category: String,
    isSupernumerary: { type: Boolean, default: false },
    isNri: { type: Boolean, default: false },
    ociStatus: { type: Boolean, default: false },
    isForeignNational: { type: Boolean, default: false },
    institutionCode: { type: String, required: true },
    program: { type: String, required: true },
    academicYear: { type: String, required: true },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);