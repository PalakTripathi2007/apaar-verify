const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    verifyCode: { type: String, required: true, unique: true },
    snapshot: {
      apaarId: String,
      fullName: String,
      institutionCode: String,
      program: String,
      academicYear: String,
    },
    signature: { type: String, required: true },
    status: { type: String, enum: ["valid", "revoked"], default: "valid" },
    issuedBy: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerifiedRecord", recordSchema);