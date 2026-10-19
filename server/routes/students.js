const express = require("express");
const Student = require("../models/Student");

const router = express.Router();

// naya student save karo
router.post("/", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// saare students dikhao
router.get("/", async (req, res) => {
  const students = await Student.find();
  res.json(students);
});
// sirf testing ke liye: saare students delete karo
router.delete("/", async (req, res) => {
  await Student.deleteMany({});
  res.json({ message: "All students deleted" });
});
module.exports = router;