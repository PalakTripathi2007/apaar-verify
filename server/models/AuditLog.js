const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    actorEmail: String,
    actorRole: String,
    institutionCode: String,
    action: { type: String, required: true },
    details: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditSchema);
