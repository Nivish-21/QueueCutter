import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  AiExplainBody,
  AiInterpretBody,
} from "@workspace/api-zod";

const router = Router();

function extractJson(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return {};
  }
}

router.post("/explain", async (req, res) => {
  const body = AiExplainBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { questionId, questionText, hint, formName, officialLabel } = body.data;

  const prompt = `You are a government form assistant helping ordinary people fill out official paperwork.

A user is filling out the "${formName}" form and has reached this question:
- Question: "${questionText}"
${hint ? `- Hint shown to user: "${hint}"` : ""}
- Official field label: "${officialLabel}"

Respond with ONLY a JSON object, no other text:
{
  "explanation": "1-2 sentence plain-language explanation of what this question is asking",
  "whyWeAsk": "brief sentence explaining why the government needs this info",
  "commonMistakes": ["mistake 1", "mistake 2"],
  "example": "a concrete example answer, or null"
}`;

  let parsed: Record<string, unknown> = {};
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    parsed = extractJson(raw);
  } catch (err) {
    req.log?.warn({ err }, "AI explain call failed");
  }

  res.json({
    questionId,
    explanation: typeof parsed.explanation === "string"
      ? parsed.explanation
      : "This question asks for information required by the form.",
    whyWeAsk: typeof parsed.whyWeAsk === "string"
      ? parsed.whyWeAsk
      : "This information is required to process your application.",
    commonMistakes: Array.isArray(parsed.commonMistakes)
      ? (parsed.commonMistakes as string[])
      : [],
    example: typeof parsed.example === "string" ? parsed.example : undefined,
  });
});

router.post("/interpret", async (req, res) => {
  const body = AiInterpretBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "bad_request", message: "Invalid request body" });
    return;
  }

  const { questionId, questionText, questionType, rawInput, options } = body.data;

  const optionsText = options && options.length > 0
    ? `\nValid options: ${options.map((o) => `"${o}"`).join(", ")}`
    : "";

  const prompt = `You are a government form assistant. Interpret and normalize a user's answer.

Question: "${questionText}"
Field type: ${questionType}${optionsText}
User typed: "${rawInput}"

Respond with ONLY a JSON object, no other text:
{
  "interpretedValue": "the normalized clean value to store",
  "confidence": "high or medium or low",
  "explanation": "brief explanation of interpretation",
  "needsClarification": false,
  "clarificationPrompt": null
}

Rules: strip currency symbols/commas from numbers, normalize dates to YYYY-MM-DD, normalize yes/no to exactly "yes" or "no", match options if provided. If ambiguous set needsClarification to true and clarificationPrompt to what to ask.`;

  let parsed: Record<string, unknown> = {};
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    parsed = extractJson(raw);
  } catch (err) {
    req.log?.warn({ err }, "AI interpret call failed");
  }

  res.json({
    questionId,
    interpretedValue: typeof parsed.interpretedValue === "string"
      ? parsed.interpretedValue
      : rawInput,
    confidence: (["high", "medium", "low"].includes(parsed.confidence as string)
      ? parsed.confidence
      : "low") as "high" | "medium" | "low",
    explanation: typeof parsed.explanation === "string"
      ? parsed.explanation
      : "Could not interpret the input.",
    needsClarification: typeof parsed.needsClarification === "boolean"
      ? parsed.needsClarification
      : true,
    clarificationPrompt: typeof parsed.clarificationPrompt === "string"
      ? parsed.clarificationPrompt
      : undefined,
  });
});

export default router;
