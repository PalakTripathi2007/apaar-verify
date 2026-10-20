const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logAction } = require("../utils/audit");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      await logAction({ email: email || "unknown" }, "LOGIN_FAILED", "Wrong email or password");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        institutionCode: user.institutionCode,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await logAction(
      { email: user.email, role: user.role, institutionCode: user.institutionCode },
      "LOGIN",
      "Signed in"
    );

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        institutionCode: user.institutionCode,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;