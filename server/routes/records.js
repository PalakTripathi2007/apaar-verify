
const { logAction } = require("../utils/audit");
const express = require("express");
const crypto = require("crypto");
const QRCode = require("qrcode");
const Student = require("../models/Student");
const Flag = require("../models/Flag");
const VerifiedRecord = require("../models/VerifiedRecord");
const { requireRole } = require("../middleware/auth");
const { checkApaarFormat } = require("../validation/rules");
const { sign } = require("../utils/signing");

const router = express.Router();

// college ko sirf apne records, AICTE ko sab
const scope = (req) =>
  req.user.role === "institution"
    ? { "snapshot.institutionCode": req.user.institutionCode }
    : {};

// records ki list
router.get("/", async (req, res) => {
  const records = await VerifiedRecord.find(scope(req)).sort({ createdAt: -1 });
  res.json(
    records.map((r) => ({
      verifyCode: r.verifyCode,
      fullName: r.snapshot.fullName,
      institutionCode: r.snapshot.institutionCode,
      status: r.status,
      consentGranted: !!(r.consent && r.consent.granted),
      createdAt: r.createdAt,
    }))
  );
});

// record issue karo (consent confirm karna zaroori)
router.post(
  "/issue/:studentId",
  requireRole("institution", "aicte_admin"),
  async (req, res) => {
    try {
      if (req.body.consentGiven !== true) {
        return res
          .status(400)
          .json({ error: "Student consent must be confirmed before issuing a record" });
      }

      const student = await Student.findById(req.params.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      if (
        req.user.role === "institution" &&
        student.institutionCode !== req.user.institutionCode
      ) {
        return res.status(403).json({ error: "Not your student" });
      }

      if (checkApaarFormat(student)) {
        return res.status(400).json({ error: "Student has a missing or invalid APAAR ID" });
      }
      const blocking = await Flag.findOne({
        studentId: student._id,
        severity: "high",
        resolved: false,
      });
      if (blocking) {
        return res.status(400).json({ error: `Unresolved issue: ${blocking.reason}` });
      }

      const verifyCode = crypto.randomBytes(8).toString("hex");
      const snapshot = {
        apaarId: student.apaarId,
        fullName: student.fullName,
        institutionCode: student.institutionCode,
        program: student.program,
        academicYear: student.academicYear,
      };

      await VerifiedRecord.create({
        studentId: student._id,
        verifyCode,
        snapshot,
        signature: sign(verifyCode, snapshot),
        consent: { granted: true, updatedAt: new Date() },
        issuedBy: req.user.id,
      });
      await logAction(req.user, "RECORD_ISSUED", `${student.fullName} (${verifyCode})`);
      const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verifyCode}`;
      const qr = await QRCode.toDataURL(verifyUrl);

      res.status(201).json({ verifyCode, verifyUrl, qr });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// consent do ya wapas lo
router.patch("/:code/consent", async (req, res) => {
  try {
    const record = await VerifiedRecord.findOne({ verifyCode: req.params.code });
    if (!record) return res.status(404).json({ error: "Record not found" });

    if (
      req.user.role === "institution" &&
      record.snapshot.institutionCode !== req.user.institutionCode
    ) {
      return res.status(403).json({ error: "Not your record" });
    }

    record.consent = { granted: req.body.granted === true, updatedAt: new Date() };
    await record.save();
        await logAction(
      req.user,
      record.consent.granted ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN",
      `${record.snapshot.fullName} (${record.verifyCode})`
    );

    res.json({ verifyCode: record.verifyCode, consentGranted: record.consent.granted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;