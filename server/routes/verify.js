const express = require("express");
const VerifiedRecord = require("../models/VerifiedRecord");
const { isValidSignature, maskName, maskId } = require("../utils/signing");

const router = express.Router();

router.get("/:code", async (req, res) => {
  try {
    const record = await VerifiedRecord.findOne({ verifyCode: req.params.code });
    if (!record) return res.status(404).json({ result: "NOT_FOUND" });

    const s = record.snapshot;
    const ok = isValidSignature(record.verifyCode, s, record.signature);

    if (!ok) return res.json({ result: "TAMPERED" });
    if (record.status === "revoked") return res.json({ result: "REVOKED" });

    res.json({
      result: "VALID",
      issuedAt: record.createdAt,
      student: {
        name: maskName(s.fullName),
        apaarId: maskId(s.apaarId),
        institutionCode: s.institutionCode,
        program: s.program,
        academicYear: s.academicYear,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;