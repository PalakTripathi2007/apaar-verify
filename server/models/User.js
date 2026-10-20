const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["institution", "aicte_admin"],
      required: true,
    },
    institutionCode: String, // sirf college users ke liye
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);