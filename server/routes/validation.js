const express = require("express");
const Student = require("../models/Student");
const Flag = require("../models/Flag");
const { checkApaarFormat, findDuplicates } = require("../validation/rules");

const router = express.Router();

// saare students pe rules chalao
router.post("/run", async (req, res) => {
  try {
    const students = await Student.find();
    await Flag.deleteMany({}); // purane flags hatao, taaki baar-baar chalane par repeat na ho

    const flags = [];

    students.forEach((s) => {
      const problem = checkApaarFormat(s);
      if (problem) {
        flags.push({
          studentId: s._id,
          apaarId: s.apaarId,
          institutionCode: s.institutionCode,
          ...problem,
        });
      }
    });

    findDuplicates(students).forEach((d) => {
      flags.push({
        studentId: d.student._id,
        apaarId: d.student.apaarId,
        institutionCode: d.student.institutionCode,
        flagType: d.flagType,
        reason: d.reason,
        severity: d.severity,
      });
    });

    const saved = await Flag.insertMany(flags);
    res.json({
      studentsChecked: students.length,
      flagsCreated: saved.length,
      flags: saved,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// flags dekho
router.get("/flags", async (req, res) => {
  const flags = await Flag.find().sort({ createdAt: -1 });
  res.json(flags);
});

module.exports = router;