const express = require("express");
const Program = require("../models/Program");

const router = express.Router();

// bahut saare programs ek saath save karo
router.post("/bulk", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Send an array of programs" });
    }
    const programs = await Program.insertMany(req.body);
    res.status(201).json({ saved: programs.length, programs });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// saare programs dikhao
router.get("/", async (req, res) => {
  const programs = await Program.find();
  res.json(programs);
});

// sirf testing ke liye: saare programs delete karo
router.delete("/", async (req, res) => {
  await Program.deleteMany({});
  res.json({ message: "All programs deleted" });
});

module.exports = router;