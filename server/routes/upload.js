const express = require("express");
const multer = require("multer");
const Papa = require("papaparse");
const Student = require("../models/Student");

const router = express.Router();

// file ko memory mein rakho, max 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// "true", "yes", "1" ko true maano, baaki sab false
const toBool = (v) =>
  ["true", "yes", "1", "y"].includes(String(v ?? "").trim().toLowerCase());

// khaali cell ko undefined bana do
const clean = (v) => {
  const t = String(v ?? "").trim();
  return t === "" ? undefined : t;
};

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Please upload a CSV file (field name: file)" });
    }

    const text = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });

    const valid = [];
    const rejected = [];

    parsed.data.forEach((row, i) => {
      const student = {
        apaarId: clean(row.apaarId),
        fullName: clean(row.fullName),
        dateOfBirth: clean(row.dateOfBirth),
        category: clean(row.category),
        isSupernumerary: toBool(row.isSupernumerary),
        isNri: toBool(row.isNri),
        ociStatus: toBool(row.ociStatus),
        isForeignNational: toBool(row.isForeignNational),
        institutionCode: clean(row.institutionCode),
        program: clean(row.program),
        academicYear: clean(row.academicYear),
      };

      const missing = ["fullName", "institutionCode", "program", "academicYear"]
        .filter((f) => !student[f]);

      if (missing.length) {
        rejected.push({ row: i + 2, reason: `Missing: ${missing.join(", ")}` });
      } else {
        valid.push(student);
      }
    });

    const saved = valid.length ? await Student.insertMany(valid) : [];

    res.status(201).json({
      rowsInFile: parsed.data.length,
      saved: saved.length,
      rejected,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;