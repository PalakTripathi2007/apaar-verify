const { logAction } = require("../utils/audit");
const express = require("express");
const Student = require("../models/Student");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// college user ko sirf apna college dikhao, AICTE ko sab
const scope = (req) =>
  req.user.role === "institution"
    ? { institutionCode: req.user.institutionCode }
    : {};

// college user kuch bhi bheje, college code uska apna hi lagega
const own = (req) =>
  req.user.role === "institution"
    ? { institutionCode: req.user.institutionCode }
    : {};

router.post("/", async (req, res) => {
  try {
    const student = await Student.create({ ...req.body, ...own(req) });
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Send an array of students" });
    }
    const rows = req.body.map((s) => ({ ...s, ...own(req) }));
    const students = await Student.insertMany(rows);
    res.status(201).json({ saved: students.length, students });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const students = await Student.find(scope(req));
  res.json(students);
});

// sirf testing ke liye, aur sirf AICTE admin ke liye
router.delete("/", requireRole("aicte_admin"), async (req, res) => {
  await Student.deleteMany({});
  res.json({ message: "All students deleted" });
});

module.exports = router;