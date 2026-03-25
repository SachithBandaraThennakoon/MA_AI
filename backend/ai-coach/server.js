import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/feedback", async (req, res) => {
  try {
    const { angles, step } = req.body;

    const prompt = `
You are a professional boxing coach.

Current step: ${step}

Angles:
${JSON.stringify(angles)}

Give very short coaching feedback (max 1 sentence).
Be direct and helpful.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const message = response.choices[0].message.content;

    res.json({ message });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating feedback" });
  }
});

app.listen(3001, () => {
  console.log("🔥 AI Coach running on http://localhost:3001");
});