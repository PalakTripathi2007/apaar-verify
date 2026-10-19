const express = require("express");
const Student = require("../models/Student");
const Flag = require("../models/Flag");
const Program = require("../models/Program");
const {
  checkApaarFormat,
  findDuplicates,
  checkIntake,
} = require("../validation/rules");

const router = express.Router();

// saare students pe rules chalao
router.post("/run", async (req, res) => {
  try {
    const students = await Student.find();
    const programs = await Program.find();
    await Flag.deleteMany({}); // purane flags hatao

    const flags = [];

    // Rule 1: missing ya invalid ID
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

    // Rule 2: duplicate aur cross-institution
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

    // Rule 3: intake se zyada admissions
    checkIntake(students, programs).forEach((r) => flags.push(r));

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