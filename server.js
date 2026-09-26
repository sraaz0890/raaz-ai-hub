import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());

// Serve all HTML/CSS/JS files from the GitHub repository
app.use(express.static(process.cwd()));

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
      model: "gemini-2.5-flash",
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

// Home page
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// Chat page
app.get("/chat.html", (req, res) => {
  res.sendFile(process.cwd() + "/chat.html");
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RAAZ AI HUB"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`RAAZ AI HUB running on port ${PORT}`);
});
