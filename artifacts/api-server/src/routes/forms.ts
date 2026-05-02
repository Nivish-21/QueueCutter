import { Router } from "express";
import { FORMS, getFormById } from "../lib/forms.js";

const router = Router();

// GET /api/forms
router.get("/", (_req, res) => {
  const forms = FORMS.map((f) => ({
    id: f.id,
    name: f.name,
    shortDescription: f.shortDescription,
    whoItIsFor: f.whoItIsFor,
    estimatedMinutes: Math.ceil(f.questions.length * 1.5),
    questionCount: f.questions.length,
    category: f.category,
  }));
  res.json({ forms });
});

// GET /api/forms/:formId
router.get("/:formId", (req, res) => {
  const form = getFormById(req.params.formId);
  if (!form) {
    res.status(404).json({ error: "not_found", message: `Form "${req.params.formId}" not found` });
    return;
  }
  res.json(form);
});

export default router;
