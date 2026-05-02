import { Router } from "express";
import { FORMS, COUNTRIES, getFormById } from "../lib/forms.js";

const router = Router();

// GET /api/forms
router.get("/", (req, res) => {
  const { countryCode } = req.query as { countryCode?: string };
  const forms = FORMS
    .filter((f) => !countryCode || f.countryCode === countryCode.toUpperCase())
    .map((f) => ({
      id: f.id,
      countryCode: f.countryCode,
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

export { COUNTRIES };
export default router;
