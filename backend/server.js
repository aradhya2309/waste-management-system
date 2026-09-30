const express = require("express");
const mongoose = require("mongoose");

const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/waste_management")
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
  });

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});