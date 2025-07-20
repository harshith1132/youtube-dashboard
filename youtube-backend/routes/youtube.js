const express = require("express");
const router = express.Router();
const db = require("../db");
const { google } = require("googleapis");
const dotenv = require("dotenv");
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

let isAuthed = false; // Simple memory check for login

// 🔁 Middleware to check auth
const checkAuth = (req, res, next) => {
  if (!isAuthed) {
    return res.status(401).json({ error: "You must authenticate first." });
  }
  next();
};

// ✅ Ping
router.get("/ping", (req, res) => {
  res.json({ message: "API is working!" });
});

// ✅ Add note
router.post("/notes", (req, res) => {
  const { content } = req.body;
  db.run("INSERT INTO notes (content) VALUES (?)", [content], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// ✅ Get notes
router.get("/notes", (req, res) => {
  db.all("SELECT * FROM notes", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Log events
router.post("/logs", (req, res) => {
  const { event } = req.body;
  db.run("INSERT INTO logs (event) VALUES (?)", [event], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// ✅ Step 1: Start YouTube OAuth login
router.get("/auth", (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/youtube.force-ssl"];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
  res.redirect(authUrl);
});

// ✅ Step 2: Handle YouTube auth callback
router.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    isAuthed = true;
    res.json({ message: "YouTube Auth successful!", tokens });
  } catch (err) {
    res.status(500).json({ error: "Auth failed", details: err.message });
  }
});

// ✅ Step 3: Get video details by ID
router.get("/video/:videoId", checkAuth, async (req, res) => {
  console.log("🔍 Video route hit with ID:", req.params.videoId);
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const videoId = req.params.videoId;

  try {
    const response = await youtube.videos.list({
      part: "snippet,contentDetails,statistics",
      id: videoId,
    });

    if (response.data.items.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json(response.data.items[0]);
  } catch (error) {
    console.error("YouTube API error:", error);
    res.status(500).json({ error: error.message });
  }
});


// Add comment to video
router.post("/comment", checkAuth, async (req, res) => {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const { videoId, text } = req.body;
  try {
    const response = await youtube.commentThreads.insert({
      part: "snippet",
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: text,
            },
          },
        },
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to a comment
router.post("/comment/reply", checkAuth, async (req, res) => {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const { parentId, text } = req.body;
  try {
    const response = await youtube.comments.insert({
      part: "snippet",
      requestBody: {
        snippet: {
          parentId,
          textOriginal: text,
        },
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit video title and description
router.put("/video/:videoId", checkAuth, async (req, res) => {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const videoId = req.params.videoId;
  const { title, description } = req.body;
  try {
    // First get current snippet
    const getResp = await youtube.videos.list({
      part: "snippet",
      id: videoId,
    });
    if (getResp.data.items.length === 0) {
      return res.status(404).json({ error: "Video not found" });
    }
    const snippet = getResp.data.items[0].snippet;
    snippet.title = title || snippet.title;
    snippet.description = description || snippet.description;

    // Update video
    const updateResp = await youtube.videos.update({
      part: "snippet",
      requestBody: {
        id: videoId,
        snippet,
      },
    });
    res.json(updateResp.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete comment by commentId
router.delete("/comment/:commentId", checkAuth, async (req, res) => {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const commentId = req.params.commentId;
  try {
    await youtube.comments.delete({
      id: commentId,
    });
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notes routes

// Add note
router.post("/notes", (req, res) => {
  const { content } = req.body;
  db.run("INSERT INTO notes (content) VALUES (?)", [content], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Get all notes
router.get("/notes", (req, res) => {
  db.all("SELECT * FROM notes", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Logs routes

// Add log event
router.post("/logs", (req, res) => {
  const { event } = req.body;
  db.run("INSERT INTO logs (event) VALUES (?)", [event], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Ping route
router.get("/ping", (req, res) => {
  res.json({ message: "API is working!" });
});

module.exports = router;
