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

    const models = [
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash"
    ];

    let lastError;

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);

        const response = await ai.models.generateContent({
          model: model,
          contents: message
        });

        console.log(`Success with model: ${model}`);

        return res.json({
          reply: response.text,
          model: model
        });

      } catch (error) {
        lastError = error;

        console.error(
          `${model} failed:`,
          error?.status || error?.message || error
        );

        // Try the next model
        continue;
      }
    }

    console.error("All Gemini models failed:", lastError);

    return res.status(503).json({
      error: "All AI models are temporarily unavailable. Please try again."
    });

  } catch (error) {
    console.error("AI Error:", error);

    res.status(500).json({
      error: "AI response failed."
    });
  }
});

// ===============================
// SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {

  console.log(`RAAZ AI HUB running on port ${PORT}`);

});
