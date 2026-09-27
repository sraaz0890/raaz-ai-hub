import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});

app.get("/document-tutor.html", (req, res) => {
  res.sendFile(path.join(__dirname, "document-tutor.html"));
});


/* =========================
   GEMINI
========================= */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


/* =========================
   FILE UPLOAD
========================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, JPG, JPEG, PNG and WEBP files are allowed."
        )
      );
    }

  }
});


/* =========================
   NORMAL AI CHAT
========================= */

app.post("/api/chat", async (req, res) => {

  try {

    const message = req.body?.message?.trim();

    const subject =
      req.body?.subject?.trim() ||
      "All Courses / General";

    if (!message) {

      return res.status(400).json({
        error: "Message is required."
      });

    }


    const prompt = `
You are RAAZ AI, a friendly and helpful AI tutor for ALL courses and subjects.

You can help students with:

- Mathematics
- Physics
- Chemistry
- Biology
- English
- Hindi
- Odia
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
- And other educational topics.

The student has selected this subject/course:

${subject}

Use the selected subject as the main context for the student's question.

If the selected subject is "All Courses / General", answer according to the topic of the student's question.

IMPORTANT RULES:

1. Understand what the student is asking before answering.

2. Explain difficult topics in simple language.

3. If the student asks for a step-by-step solution, explain it step by step.

4. Use examples whenever they make the topic easier to understand.

5. For mathematics and numerical problems, show calculations clearly.

6. For programming questions, provide clean and understandable code when appropriate.

7. Use Markdown formatting when useful.

8. Use headings, bullet points, numbered lists and code blocks when they improve readability.

9. Use emojis naturally when appropriate.

10. If the student's question is related to another subject even though a subject was selected, answer the actual question correctly.

11. Never pretend to know something if you are uncertain.

12. Keep explanations understandable for students.

13. If the student's question is very short, give a clear direct answer first.

14. Maintain a friendly tutor-like personality.

15. Do not unnecessarily repeat the student's question.

16. When teaching, focus on helping the student understand the concept rather than only giving the final answer.

Student's selected subject:

${subject}

Student's question:

${message}
`;


    const models = [
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite"
    ];

    let lastError;


    for (const model of models) {

      try {

        console.log(`Trying model: ${model}`);

        const response =
          await ai.models.generateContent({
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
          error?.status ||
          error?.message ||
          error
        );

      }

    }


    console.error(
      "All Gemini models failed:",
      lastError
    );

    return res.status(503).json({
      error:
        "All AI models are temporarily unavailable. Please try again."
    });


  } catch (error) {

    console.error("AI Error:", error);

    return res.status(500).json({
      error: "AI response failed."
    });

  }

});


/* =========================
   PDF / PHOTO AI TUTOR
========================= */

app.post(
  "/api/document-tutor",
  upload.single("file"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: "Please upload a PDF or image."
        });

      }


      const action =
        req.body?.action ||
        "summary";

      const instruction =
        req.body?.instruction?.trim() ||
        "";


      const actionPrompts = {

        summary: `
Summarise the uploaded study material.
Give:
1. Short overview
2. Main concepts
3. Important points
4. Key terms
5. Final quick revision
`,

        explain: `
Explain the uploaded study material in very simple language.
Teach it like a friendly tutor.
Break difficult concepts into small sections.
Use examples wherever useful.
`,

        notes: `
Create clean study notes from the uploaded material.
Use headings, bullet points, definitions, formulas and examples where appropriate.
Keep the notes useful for revision.
`,

        important: `
Find the most important information from the uploaded study material.
Highlight important concepts, definitions, formulas, dates, facts and examples where relevant.
`,

        questions: `
Create useful questions and answers from the uploaded material.
Include short-answer and conceptual questions.
Provide the answer after each question.
`,

        exam: `
Prepare exam-focused revision material from the uploaded study material.
Identify important concepts, definitions, formulas, likely question areas and quick revision points.
Do not claim a question will definitely appear in an exam.
`

      };


      const selectedPrompt =
        actionPrompts[action] ||
        actionPrompts.summary;


      const prompt = `
You are RAAZ AI, an educational document tutor.

The user has uploaded a study document or photograph of study material.

Your job is to understand the actual content of the uploaded material and help the student learn it.

${selectedPrompt}

IMPORTANT RULES:

- Base your answer primarily on the uploaded material.
- Do not invent information that is not supported by the material.
- If some text is unclear or unreadable, clearly say so.
- Preserve important formulas and technical terms.
- Explain difficult ideas in simple student-friendly language.
- Use Markdown headings and bullet points when useful.
- For mathematical formulas, use readable LaTeX when appropriate.
- If the material contains diagrams, tables or charts, explain their meaning when you can understand them.
- Do not unnecessarily repeat the entire document.
- Focus on understanding and learning.

Additional instruction from the student:

${instruction || "No additional instruction provided."}
`;


      /*
       * Gemini supports inline file data for temporary
       * smaller files such as PDFs and images.
       */

      const filePart = {
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString("base64")
        }
      };


      const models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
      ];

      let lastError;


      for (const model of models) {

        try {

          console.log(
            `Document analysis using model: ${model}`
          );

          const response =
            await ai.models.generateContent({

              model: model,

              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: prompt
                    },
                    filePart
                  ]
                }
              ]

            });


          console.log(
            `Document analysis success: ${model}`
          );


          return res.json({

            reply: response.text,

            model: model,

            filename: req.file.originalname

          });


        } catch (error) {

          lastError = error;

          console.error(
            `${model} document analysis failed:`,
            error?.status ||
            error?.message ||
            error
          );

        }

      }


      console.error(
        "All document models failed:",
        lastError
      );


      return res.status(503).json({

        error:
          "AI document analysis is temporarily unavailable. Please try again."

      });


    } catch (error) {

      console.error(
        "Document Tutor Error:",
        error
      );


      if (
        error?.code === "LIMIT_FILE_SIZE"
      ) {

        return res.status(413).json({

          error:
            "File is too large. Please upload a file smaller than 20 MB."

        });

      }


      return res.status(500).json({

        error:
          error?.message ||
          "Document analysis failed."

      });

    }

  }
);


/* =========================
   HEALTH
========================= */

app.get("/health", (req, res) => {

  res.json({
    status: "ok",
    service: "RAAZ AI HUB"
  });

});


/* =========================
   MULTER ERROR HANDLER
========================= */

app.use((error, req, res, next) => {

  if (error instanceof multer.MulterError) {

    if (error.code === "LIMIT_FILE_SIZE") {

      return res.status(413).json({
        error:
          "File is too large. Maximum allowed size is 20 MB."
      });

    }

    return res.status(400).json({
      error: error.message
    });

  }


  if (error) {

    return res.status(400).json({
      error: error.message
    });

  }

  next();

});


/* =========================
   START SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `RAAZ AI HUB running on port ${PORT}`
  );

});
