const crypto = require("crypto");

// record ke fields ko ek fixed order mein jodo
function canonical(code, s) {
  return [code, s.apaarId, s.fullName, s.institutionCode, s.program, s.academicYear].join("|");
}

function sign(code, snapshot) {
  return crypto
    .createHmac("sha256", process.env.RECORD_SECRET)
    .update(canonical(code, snapshot))
    .digest("hex");
}

function isValidSignature(code, snapshot, signature) {
  const expected = Buffer.from(sign(code, snapshot));
  const given = Buffer.from(String(signature));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

function maskName(name) {
  return name
    .split(" ")
    .map((w) => w[0] + "*".repeat(Math.max(w.length - 1, 2)))
    .join(" ");
}

function maskId(id) {
  return "*".repeat(Math.max(id.length - 4, 0)) + id.slice(-4);
}

module.exports = { sign, isValidSignature, maskName, maskId };