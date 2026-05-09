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

// POST /api/ai/simplify — rewrite question for user persona
router.post("/simplify", async (req, res) => {
  const { questionId, questionText, hint, officialLabel, formName, countryCode, persona } = req.body as {
    questionId: string;
    questionText: string;
    hint?: string;
    officialLabel: string;
    formName: string;
    countryCode: string;
    persona?: { role: string; priorExperience: string; comfort: string } | null;
  };

  if (!questionId || !questionText || !formName) {
    res.status(400).json({ error: "bad_request", message: "questionId, questionText, and formName are required" });
    return;
  }

  // Fast fallback if no persona or persona is comfortable
  if (!persona || persona.comfort === "I'm comfortable with it") {
    res.json({ questionId, simplifiedText: questionText, simplifiedHint: hint ?? null });
    return;
  }

  const personaDesc = persona
    ? `- Role: ${persona.role}\n- Prior experience: ${persona.priorExperience}\n- Comfort with paperwork: ${persona.comfort}`
    : "- General member of the public";

  const prompt = `You are helping someone fill out a government form. Rewrite this question in simpler, friendlier language.

Form: "${formName}" (Country: ${countryCode})
Official label: "${officialLabel}"
Original question: "${questionText}"
${hint ? `Current hint: "${hint}"` : ""}

User profile:
${personaDesc}

Rules:
- If comfort is "I find it confusing": use very simple, warm, friendly language. Avoid jargon. Explain what's needed simply.
- If comfort is "I manage okay": clear and helpful but concise.
- Keep the meaning 100% accurate — just simplify how it's asked.
- If the question is already simple, keep it short and just add a gentle tone.

Respond with ONLY a JSON object, no other text:
{
  "simplifiedText": "the simpler version of the question",
  "simplifiedHint": "brief friendly tip for this person (or null if not needed)"
}`;

  let parsed: Record<string, unknown> = {};
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    parsed = extractJson(raw);
  } catch (err) {
    req.log?.warn({ err }, "AI simplify call failed — using original");
  }

  res.json({
    questionId,
    simplifiedText: typeof parsed.simplifiedText === "string" ? parsed.simplifiedText : questionText,
    simplifiedHint: typeof parsed.simplifiedHint === "string" ? parsed.simplifiedHint : (hint ?? null),
  });
});

// POST /api/ai/inconsistencies — cross-field consistency check
router.post("/inconsistencies", async (req, res) => {
  const { sessionId, formId, answers } = req.body as {
    sessionId: string;
    formId: string;
    answers: Record<string, string>;
  };

  if (!sessionId || !formId || !answers) {
    res.status(400).json({ error: "bad_request", message: "sessionId, formId, and answers are required" });
    return;
  }

  const answersText = Object.entries(answers)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `  ${k}: "${v}"`)
    .join("\n");

  const prompt = `You are reviewing a government form application for logical consistency. Be concise.

Form ID: ${formId}
Answers submitted:
${answersText}

Check ONLY for clear factual inconsistencies, such as:
1. Claiming to be unemployed but listing an employer
2. Income wildly inconsistent with stated occupation
3. Date of birth making stated age impossible
4. Old and new address identical on a change-of-address form
5. Residency years stated as more than person's age
6. Aadhaar number being wrong length

Do NOT flag: missing fields, formatting issues, or eligibility concerns.

Respond with ONLY a JSON object, no other text:
{
  "inconsistencies": [
    {"fields": ["field_id_1", "field_id_2"], "message": "plain English explanation of the conflict", "severity": "error"}
  ]
}

If no inconsistencies, return: {"inconsistencies": []}`;

  let parsed: Record<string, unknown> = { inconsistencies: [] };
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const extracted = extractJson(raw);
    if (extracted.inconsistencies) parsed = extracted;
  } catch (err) {
    req.log?.warn({ err }, "AI inconsistencies call failed");
  }

  res.json({
    sessionId,
    inconsistencies: Array.isArray(parsed.inconsistencies) ? parsed.inconsistencies : [],
    checkedAt: new Date().toISOString(),
  });
});

// POST /api/ai/discover — match a free-text situation to the best form
router.post("/discover", async (req, res) => {
  const { situation } = req.body as { situation?: string };

  if (!situation || typeof situation !== "string" || !situation.trim()) {
    res.status(400).json({ error: "bad_request", message: "situation is required" });
    return;
  }

  const catalog = [
    { id: "snap-benefits", name: "SNAP Benefits Application", countryCode: "US", whoItIsFor: "Low-income individuals and families needing food assistance", description: "Apply for monthly food assistance benefits through the Supplemental Nutrition Assistance Program" },
    { id: "ss5-replacement", name: "Social Security Card Replacement", countryCode: "US", whoItIsFor: "U.S. citizens and eligible non-citizens who need to replace their Social Security card", description: "Request a replacement Social Security card when yours is lost, stolen, or damaged" },
    { id: "change-of-address", name: "Change of Address Request", countryCode: "US", whoItIsFor: "Anyone who has moved or is planning to move to a new address", description: "Notify USPS to forward your mail to your new address" },
    { id: "income-certificate-in", name: "Income Certificate", countryCode: "IN", whoItIsFor: "Individuals needing proof of income for government schemes, education, or subsidies", description: "Obtain an official income certificate from state authorities for benefits and admissions" },
    { id: "domicile-certificate-in", name: "Domicile / Residence Certificate", countryCode: "IN", whoItIsFor: "Individuals who are permanent residents of a state and need to prove domicile for government benefits", description: "Get a certificate proving you are a permanent resident of your state for jobs, admissions, or benefits" },
    { id: "council-tax-reduction-gb", name: "Council Tax Reduction Application", countryCode: "GB", whoItIsFor: "Residents on low income, receiving Universal Credit, or eligible benefits who need help paying Council Tax", description: "Apply for a reduction in your Council Tax bill from your local council" },
    { id: "proof-of-address-gb", name: "Proof of Address Letter for Benefits", countryCode: "GB", whoItIsFor: "Anyone applying for UK benefits who needs to formally confirm their residential address", description: "Obtain an official proof-of-address letter for use with DWP or other benefit applications" },
  ];

  const catalogText = catalog
    .map((f) => `- id: "${f.id}" | name: "${f.name}" | country: ${f.countryCode} | for: ${f.whoItIsFor} | description: ${f.description}`)
    .join("\n");

  const prompt = `You are helping a user find the right government form for their situation.

Available forms:
${catalogText}

User's situation: "${situation.trim()}"

Pick the single best matching form. If no form is a reasonable match, return null for formId.

Respond with ONLY a JSON object, no other text:
{
  "formId": "the form id from the list, or null if nothing matches",
  "formName": "the form name, or null",
  "countryCode": "US, IN, or GB, or null",
  "reason": "one sentence explaining why this form matches (or why nothing matched)"
}`;

  let parsed: Record<string, unknown> = {};
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    parsed = extractJson(raw);
  } catch (err) {
    req.log?.warn({ err }, "AI discover call failed");
  }

  const formId = typeof parsed.formId === "string" ? parsed.formId : null;
  const validIds = catalog.map((f) => f.id);
  res.json({
    formId: formId && validIds.includes(formId) ? formId : null,
    formName: typeof parsed.formName === "string" ? parsed.formName : null,
    countryCode: typeof parsed.countryCode === "string" ? parsed.countryCode : null,
    reason: typeof parsed.reason === "string" ? parsed.reason : "We could not find a matching form for your situation.",
  });
});

export default router;
