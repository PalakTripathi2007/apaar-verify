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

router.post(
  "/issue/:studentId",
  requireRole("institution", "aicte_admin"),
  async (req, res) => {
    try {
      const student = await Student.findById(req.params.studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      // college sirf apne students ka record bana sakta hai
      if (
        req.user.role === "institution" &&
        student.institutionCode !== req.user.institutionCode
      ) {
        return res.status(403).json({ error: "Not your student" });
      }

      // sirf saaf data wale student ka record bane
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
        issuedBy: req.user.id,
      });

      const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verifyCode}`;
      const qr = await QRCode.toDataURL(verifyUrl);

      res.status(201).json({ verifyCode, verifyUrl, qr });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;