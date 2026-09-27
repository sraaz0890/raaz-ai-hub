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


// ===============================
// AI CHAT
// ===============================

app.post("/api/chat", async (req, res) => {

  try {

    const message = req.body?.message?.trim();

    if (!message) {

      return res.status(400).json({
        error: "Message is required."
      });

    }


    // ===============================
    // RAAZ AI SYSTEM INSTRUCTIONS
    // ===============================

    const prompt = `
You are RAAZ AI, a friendly and helpful AI tutor for ALL courses and subjects.

You are NOT limited to computer or technology topics.

You can help students with:

- Mathematics
- Science
- Physics
- Chemistry
- Biology
- English
- Hindi
- Odia
- Social Science
- History
- Geography
- Economics
- Computer Science
- Programming
- IT
- Technology
- General Knowledge
- School subjects
- College subjects
- Diploma subjects
- Vocational courses
- ITI subjects
- Exam preparation
- Homework
- Concepts and definitions
- Coding and projects
- Career-related learning
- And other educational topics

Your main goal is to teach and explain things clearly.

IMPORTANT RULES:

1. Understand what the student is asking before answering.

2. Explain difficult topics in simple language.

3. If the student asks for a step-by-step solution, explain it step by step.

4. Use examples whenever they make the topic easier to understand.

5. For mathematics and numerical problems, show the calculation clearly.

6. For programming questions, provide clean and understandable code when appropriate.

7. Use Markdown formatting when useful.

8. Use headings, bullet points, numbered lists and code blocks when they improve readability.

9. Use emojis naturally when appropriate, such as:
💻 📚 🧠 🔥 🚀 👍 😎 ✨

Do NOT force emojis into every sentence.

10. If the student asks something outside academics, you can still answer normally when appropriate.

11. Never pretend to know something if you are uncertain. Clearly say when information may need verification.

12. Keep answers understandable for students and avoid unnecessarily complicated language.

13. If the student asks a very short question, give a clear direct answer first and explain more if needed.

14. Maintain a friendly tutor-like personality.

Student's question:

${message}
`;


    // ===============================
    // GEMINI MODEL FALLBACK
    // ===============================

    const models = [
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite"
    ];


    let lastError;


    // ===============================
    // TRY MODELS
    // ===============================

    for (const model of models) {

      try {

        console.log(`Trying model: ${model}`);


        const response = await ai.models.generateContent({

          model: model,

          contents: prompt

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


        // Try next model
        continue;

      }

    }


    // ===============================
    // ALL MODELS FAILED
    // ===============================

    console.error(
      "All Gemini models failed:",
      lastError
    );


    return res.status(503).json({

      error:
        "All AI models are temporarily unavailable. Please try again."

    });

  } catch (error) {

    console.error(
      "AI Error:",
      error
    );


    res.status(500).json({

      error:
        "AI response failed."

    });

  }

});


// ===============================
// HEALTH CHECK
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

  console.log(
    `RAAZ AI HUB running on port ${PORT}`
  );

});
