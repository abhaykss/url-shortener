const express = require("express");
const mongoose = require("mongoose");
const shortid = require("shortid");
const cors = require("cors");
const validUrl = require("valid-url");

const Url = require("./models/Url");

const app = express();

app.set("trust proxy", 1); // important for Render
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// 🔹 MongoDB Connection
mongoose.connect(
  "mongodb+srv://abhaykumarsaxena19_db_user:Abhay199@cluster0.eimjgjs.mongodb.net/urlshortener?retryWrites=true&w=majority"
)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

// 🔹 Home Route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🔹 Shorten URL
app.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: "URL is required" });
    }

    if (!validUrl.isUri(originalUrl)) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    // 🔥 Check duplicate correctly
    const existingUrl = await Url.findOne({ originalUrl });
    if (existingUrl) {
      return res.json({
        shortUrl: `${req.protocol}://${req.get("host")}/${existingUrl.shortCode}`
      });
    }

    const shortCode = shortid.generate();

    const newUrl = new Url({
      shortCode,
      originalUrl
    });

    await newUrl.save();

    return res.json({
      shortUrl: `${req.protocol}://${req.get("host")}/${shortCode}`
    });

  } catch (error) {
    console.error("SHORTEN ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 Redirect Route
app.get("/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const url = await Url.findOne({ shortCode: code });

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    url.clicks++;
    await url.save();

    return res.redirect(url.originalUrl);

  } catch (error) {
    console.error("REDIRECT ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});