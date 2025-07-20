const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const db = require("./db");
const youtubeRoutes = require("./routes/youtube");

app.use(cors());
app.use(express.json());
app.use("/api", youtubeRoutes);

app.listen(4000, () => {
  console.log("✅ Backend running at http://localhost:4000");
});
