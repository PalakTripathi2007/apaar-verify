require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { authenticate, requireRole } = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", authenticate, require("./routes/students"));
app.use("/api/validation", authenticate, require("./routes/validation"));
app.use("/api/upload", authenticate, require("./routes/upload"));
app.use(
  "/api/programs",
  authenticate,
  requireRole("aicte_admin"),
  require("./routes/programs")
);
app.use("/api/records", authenticate, require("./routes/records"));
app.use("/api/verify", require("./routes/verify"));
app.use(
  "/api/audit",
  authenticate,
  requireRole("aicte_admin"),
  require("./routes/audit")
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("DB connection failed:", err.message));