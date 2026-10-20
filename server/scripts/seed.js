require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});

  const users = [
    { email: "admin@aicte.demo", password: "Admin@123", role: "aicte_admin" },
    { email: "col001@demo.test", password: "Col001@123", role: "institution", institutionCode: "COL001" },
    { email: "col002@demo.test", password: "Col002@123", role: "institution", institutionCode: "COL002" },
  ];

  for (const u of users) {
    await User.create({
      email: u.email,
      passwordHash: await bcrypt.hash(u.password, 10),
      role: u.role,
      institutionCode: u.institutionCode,
    });
  }

  console.log("Demo users created");
  await mongoose.disconnect();
}

seed();