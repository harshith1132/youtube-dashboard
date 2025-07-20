const express = require("express");
const router = express.Router();
const db = require("../db");

// Ping
router.get("/ping", (req, res) => {
  res.json({ message: "API is working!" });
});

// Add note
router.post("/notes", (req, res) => {
  const { content } = req.body;
  db.run("INSERT INTO notes (content) VALUES (?)", [content], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Get notes
router.get("/notes", (req, res) => {
  db.all("SELECT * FROM notes", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Log events
router.post("/logs", (req, res) => {
  const { event } = req.body;
  db.run("INSERT INTO logs (event) VALUES (?)", [event], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

module.exports = router;
