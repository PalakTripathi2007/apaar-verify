const AuditLog = require("../models/AuditLog");

// action likho. Kuch gadbad ho to bhi main kaam ko mat rokna
async function logAction(actor, action, details = "") {
  try {
    await AuditLog.create({
      actorEmail: actor.email || "unknown",
      actorRole: actor.role || "",
      institutionCode: actor.institutionCode || "",
      action,
      details,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}

module.exports = { logAction };