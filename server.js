import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static("."));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message || !message.trim()) {
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
      error: "AI response failed. Please try again."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "RAAZ AI HUB"
  });
});

app.listen(PORT, () => {
  console.log(`RAAZ AI HUB running on port ${PORT}`);
});
