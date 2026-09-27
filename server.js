import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());


// ===============================
// STATIC WEBSITE
// ===============================

app.use(express.static(__dirname));


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ===============================
// AI CHAT PAGE
// ===============================

app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});


// ===============================
// GEMINI
// ===============================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


app.post("/api/chat", async (req, res) => {

  try {

    const message = req.body?.message?.trim();

    if (!message) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message
    });

    res.json({
      reply: response.text
    });

  } catch (error) {

    console.error("AI Error:", error);

    res.status(500).json({
      error: "AI response failed."
    });

  }

});


// ===============================
// HEALTH
// ===============================

app.get("/health", (req, res) => {

  res.json({
    status: "ok",
    service: "RAAZ AI HUB"
  });

});


// ===============================
// SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {

  console.log(`RAAZ AI HUB running on port ${PORT}`);

});
