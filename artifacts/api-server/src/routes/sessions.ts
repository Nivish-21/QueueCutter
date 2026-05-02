import { Router } from "express";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import { getFormById, FORMS } from "../lib/forms.js";
import { generateWarnings } from "../lib/warnings.js";
import { generateChecklist } from "../lib/checklist.js";
import { generatePdf } from "../lib/pdf-generator.js";

const router = Router();

// In-memory PDF cache (keyed by sessionId)
const pdfCache = new Map<string, Buffer>();

// GET /api/sessions
router.get("/", async (req, res) => {
  const sessions = await db
    .select()
    .from(sessionsTable)
    .orderBy(sessionsTable.updatedAt)
    .limit(20);
  res.json({ sessions });
});

// POST /api/sessions
router.post("/", async (req, res) => {
  const { formId } = req.body as { formId?: string };
  if (!formId) {
    res.status(400).json({ error: "bad_request", message: "formId is required" });
    return;
  }

  const form = getFormById(formId);
  if (!form) {
    res.status(400).json({ error: "bad_request", message: `Unknown form: ${formId}` });
    return;
  }

  const id = randomUUID();
  const now = new Date();

  const [session] = await db
    .insert(sessionsTable)
    .values({
      id,
      formId,
      formName: form.name,
      status: "in_progress",
      currentStep: 0,
      totalSteps: form.questions.length,
      answers: {},
      completionPercent: 0,
    })
    .returning();

  res.status(201).json(session);
});

// GET /api/sessions/:sessionId
router.get("/:sessionId", async (req, res) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, req.params.sessionId));

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  res.json(session);
});

// PUT /api/sessions/:sessionId/answers
router.put("/:sessionId/answers", async (req, res) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, req.params.sessionId));

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const { answers, step } = req.body as { answers: Record<string, string>; step: number };
  const form = getFormById(session.formId);
  if (!form) {
    res.status(400).json({ error: "bad_request", message: "Form not found" });
    return;
  }

  const mergedAnswers = { ...(session.answers as Record<string, string>), ...answers };
  const requiredQuestions = form.questions.filter((q) => q.required);
  const answeredRequired = requiredQuestions.filter(
    (q) => mergedAnswers[q.id] && mergedAnswers[q.id].trim() !== "",
  );
  const completionPercent = Math.round(
    (answeredRequired.length / Math.max(requiredQuestions.length, 1)) * 100,
  );

  const isLastStep = step >= form.questions.length - 1;
  const status = isLastStep ? "completed" : "in_progress";

  const [updated] = await db
    .update(sessionsTable)
    .set({
      answers: mergedAnswers,
      currentStep: step,
      completionPercent,
      status,
      updatedAt: new Date(),
    })
    .where(eq(sessionsTable.id, req.params.sessionId))
    .returning();

  res.json(updated);
});

// GET /api/sessions/:sessionId/preview
router.get("/:sessionId/preview", async (req, res) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, req.params.sessionId));

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const form = getFormById(session.formId);
  if (!form) {
    res.status(404).json({ error: "not_found", message: "Form schema not found" });
    return;
  }

  const answers = session.answers as Record<string, string>;

  const mappedFields = form.questions.map((q) => {
    const value = answers[q.id] ?? "";
    const isEmpty = !value || value.trim() === "";
    return {
      fieldName: q.fieldMapping,
      officialLabel: q.officialLabel,
      value: isEmpty ? "" : value,
      source: isEmpty ? "default" : "user_answer",
      confidence: isEmpty ? "low" : "high",
      isEmpty,
    };
  });

  const missingCount = mappedFields.filter((f) => f.isEmpty).length;
  const warnings = generateWarnings(form, answers);
  const warningCount = warnings.filter((w) => w.severity !== "info").length;

  res.json({
    sessionId: session.id,
    formName: form.name,
    mappedFields,
    completionPercent: session.completionPercent,
    missingCount,
    warningCount,
  });
});

// GET /api/sessions/:sessionId/warnings
router.get("/:sessionId/warnings", async (req, res) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, req.params.sessionId));

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const form = getFormById(session.formId);
  if (!form) {
    res.status(404).json({ error: "not_found", message: "Form schema not found" });
    return;
  }

  const answers = session.answers as Record<string, string>;
  const warnings = generateWarnings(form, answers);

  res.json({
    sessionId: session.id,
    warnings,
    errorCount: warnings.filter((w) => w.severity === "error").length,
    warningCount: warnings.filter((w) => w.severity === "warning").length,
    infoCount: warnings.filter((w) => w.severity === "info").length,
  });
});

// GET /api/sessions/:sessionId/checklist
router.get("/:sessionId/checklist", async (req, res) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, req.params.sessionId));

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const form = getFormById(session.formId);
  if (!form) {
    res.status(404).json({ error: "not_found", message: "Form schema not found" });
    return;
  }

  const answers = session.answers as Record<string, string>;
  const { items, submissionSteps } = generateChecklist(form, answers);
  const warnings = generateWarnings(form, answers);
  const warningMessages = warnings
    .filter((w) => w.severity === "error" || w.severity === "warning")
    .map((w) => w.message);

  res.json({
    sessionId: session.id,
    formName: form.name,
    items,
    submissionSteps,
    submissionOffice: form.submissionOffice,
    processingTime: form.processingTime,
    fee: form.fee,
    warnings: warningMessages,
  });
});

// POST /api/sessions/:sessionId/pdf
router.post("/:sessionId/pdf", async (req, res) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, req.params.sessionId));

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const form = getFormById(session.formId);
  if (!form) {
    res.status(404).json({ error: "not_found", message: "Form schema not found" });
    return;
  }

  const answers = session.answers as Record<string, string>;

  const mappedFields = form.questions.map((q) => ({
    fieldName: q.fieldMapping,
    officialLabel: q.officialLabel,
    value: answers[q.id] ?? "",
    isEmpty: !answers[q.id] || answers[q.id].trim() === "",
  }));

  const pdfBuffer = Buffer.from(await generatePdf(form, mappedFields, answers));
  pdfCache.set(session.id, pdfBuffer);

  res.json({
    sessionId: session.id,
    downloadUrl: `/api/sessions/${session.id}/pdf/download`,
    generatedAt: new Date().toISOString(),
    fieldCount: mappedFields.length,
    filledCount: mappedFields.filter((f) => !f.isEmpty).length,
  });
});

// GET /api/sessions/:sessionId/pdf/download
router.get("/:sessionId/pdf/download", async (req, res) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, req.params.sessionId));

  if (!session) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  let pdfBuffer = pdfCache.get(session.id);

  if (!pdfBuffer) {
    // Generate on the fly if not cached
    const form = getFormById(session.formId);
    if (!form) {
      res.status(404).json({ error: "not_found", message: "Form schema not found" });
      return;
    }
    const answers = session.answers as Record<string, string>;
    const mappedFields = form.questions.map((q) => ({
      fieldName: q.fieldMapping,
      officialLabel: q.officialLabel,
      value: answers[q.id] ?? "",
      isEmpty: !answers[q.id] || answers[q.id].trim() === "",
    }));
    pdfBuffer = Buffer.from(await generatePdf(form, mappedFields, answers));
    pdfCache.set(session.id, pdfBuffer);
  }

  const formName = session.formName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="queuecutter_${formName}_${session.id.slice(0, 8)}.pdf"`,
  );
  res.setHeader("Content-Length", pdfBuffer.length);
  res.end(pdfBuffer);
});

export default router;
