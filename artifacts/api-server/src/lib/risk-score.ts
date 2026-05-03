import type { FormSchema } from "./forms.js";
import type { Warning } from "./warnings.js";

export interface ScoreComponent {
  name: string;
  score: number; // 0-100, higher = more submission-ready
  label: string;
  explanation: string;
  improvement?: string;
}

export interface RiskFactor {
  description: string;
  impact: number;
  category: "missing_required" | "inconsistency" | "optional_blank" | "rejection_pattern";
}

export interface RiskScoreResult {
  sessionId: string;
  score: number; // 0-100, higher = more rejection risk
  level: "low" | "medium" | "high";
  headline: string;
  factors: RiskFactor[];
  components: ScoreComponent[];
  disclaimer: string;
}

export function calculateRiskScore(
  sessionId: string,
  form: FormSchema,
  answers: Record<string, string>,
  warnings: Warning[],
): RiskScoreResult {
  const factors: RiskFactor[] = [];

  // ─── Component 1: Completion ───
  const requiredQuestions = form.questions.filter((q) => {
    if (!q.required) return false;
    if (q.conditionalOn) {
      const condVal = answers[q.conditionalOn.questionId];
      if (!condVal || condVal.toLowerCase() !== q.conditionalOn.value.toLowerCase()) return false;
    }
    return true;
  });

  const filledRequired = requiredQuestions.filter((q) => {
    const ans = answers[q.id];
    return ans && ans.trim() !== "";
  });

  const missingRequired = requiredQuestions.filter((q) => {
    const ans = answers[q.id];
    return !ans || ans.trim() === "";
  });

  const completionScore =
    requiredQuestions.length > 0
      ? Math.round((filledRequired.length / requiredQuestions.length) * 100)
      : 100;

  for (const q of missingRequired) {
    factors.push({
      description: `Required field missing: "${q.officialLabel}"`,
      impact: 10,
      category: "missing_required",
    });
  }

  // ─── Component 2: Consistency ───
  const inconsistencies = warnings.filter(
    (w) => w.category === "inconsistency" && w.severity === "error",
  );

  const consistencyScore = Math.max(0, 100 - inconsistencies.length * 25);

  for (const w of inconsistencies) {
    factors.push({ description: w.message, impact: 15, category: "inconsistency" });
  }

  // ─── Component 3: Evidence Sufficiency ───
  const optionalBlanks = form.questions.filter((q) => {
    if (q.required) return false;
    if (q.conditionalOn) {
      const condVal = answers[q.conditionalOn.questionId];
      if (!condVal || condVal.toLowerCase() !== q.conditionalOn.value.toLowerCase()) return false;
    }
    const ans = answers[q.id];
    return !ans || ans.trim() === "";
  });

  const evidenceScore = Math.max(0, 100 - optionalBlanks.length * 5 - inconsistencies.length * 10);

  if (optionalBlanks.length > 0) {
    const impact = Math.min(optionalBlanks.length * 3, 15);
    factors.push({
      description: `${optionalBlanks.length} supporting field(s) left blank — may weaken your application`,
      impact,
      category: "optional_blank",
    });
  }

  // ─── Component 4: Eligibility ───
  const eligibilityWarnings = warnings.filter(
    (w) => w.category === "eligibility" && w.severity === "warning",
  );

  let eligibilityScore = 100;
  for (const w of eligibilityWarnings) {
    eligibilityScore = Math.max(0, eligibilityScore - 25);
    factors.push({ description: w.message, impact: 10, category: "rejection_pattern" });
  }

  for (const reason of form.commonRejectionReasons) {
    const trigger = getCommonRejectionTrigger(reason, form, answers);
    if (trigger) {
      eligibilityScore = Math.max(0, eligibilityScore - 20);
      factors.push({
        description: `Common rejection pattern: ${reason}`,
        impact: 10,
        category: "rejection_pattern",
      });
    }
  }

  // ─── Component 5: Submission Readiness ───
  let submissionScore =
    form.submissionMethod === "online" ? 95 : form.submissionMethod === "walk-in" ? 85 : 90;
  submissionScore = Math.max(0, submissionScore - missingRequired.length * 5);

  // ─── Composite risk score ───
  const weights = {
    completion: 0.35,
    consistency: 0.25,
    evidence: 0.15,
    eligibility: 0.20,
    submission: 0.05,
  };
  const avgReadiness =
    completionScore * weights.completion +
    consistencyScore * weights.consistency +
    evidenceScore * weights.evidence +
    eligibilityScore * weights.eligibility +
    submissionScore * weights.submission;

  const score = Math.min(100, Math.max(0, Math.round(100 - avgReadiness)));
  const level: "low" | "medium" | "high" = score <= 25 ? "low" : score <= 55 ? "medium" : "high";
  const issueCount = factors.filter((f) => f.category !== "optional_blank").length;

  const headline =
    level === "low"
      ? "Low Risk — Your form looks well prepared"
      : level === "medium"
        ? `Medium Risk — ${issueCount} issue${issueCount !== 1 ? "s" : ""} to address before submitting`
        : `High Risk — ${issueCount} issue${issueCount !== 1 ? "s" : ""} likely to cause rejection`;

  const components: ScoreComponent[] = [
    {
      name: "Completion",
      score: completionScore,
      label: `${filledRequired.length} of ${requiredQuestions.length} required fields filled`,
      explanation: "Whether all required fields have been answered.",
      improvement:
        missingRequired.length > 0
          ? `Fill in: ${missingRequired.map((q) => q.officialLabel).slice(0, 3).join(", ")}${missingRequired.length > 3 ? ` and ${missingRequired.length - 3} more` : ""}.`
          : undefined,
    },
    {
      name: "Consistency",
      score: consistencyScore,
      label:
        inconsistencies.length === 0
          ? "No cross-field conflicts detected"
          : `${inconsistencies.length} conflict${inconsistencies.length !== 1 ? "s" : ""} found`,
      explanation: "Whether your answers are internally consistent with each other.",
      improvement:
        inconsistencies.length > 0 ? "Review your answers for contradictions." : undefined,
    },
    {
      name: "Evidence",
      score: evidenceScore,
      label:
        optionalBlanks.length === 0
          ? "All supporting fields provided"
          : `${optionalBlanks.length} supporting field${optionalBlanks.length !== 1 ? "s" : ""} empty`,
      explanation: "How completely you have provided supporting information to strengthen your application.",
      improvement:
        optionalBlanks.length > 0 ? "Filling optional fields can strengthen your case." : undefined,
    },
    {
      name: "Eligibility",
      score: eligibilityScore,
      label:
        eligibilityScore >= 80
          ? "No eligibility concerns detected"
          : "Potential eligibility concerns found",
      explanation: "Whether your answers suggest you meet the eligibility criteria for this form.",
      improvement:
        eligibilityScore < 80
          ? "Review eligibility thresholds with your local office if unsure."
          : undefined,
    },
    {
      name: "Submission Readiness",
      score: submissionScore,
      label:
        missingRequired.length === 0 ? "Ready to submit" : "Required fields still missing",
      explanation: `Readiness for ${form.submissionMethod === "walk-in" ? "in-person" : form.submissionMethod === "online" ? "online" : ""} submission based on completion and channel requirements.`,
      improvement:
        missingRequired.length > 0 ? "Complete all required fields before submitting." : undefined,
    },
  ];

  return {
    sessionId,
    score,
    level,
    headline,
    factors,
    components,
    disclaimer:
      "This estimate is based on common rejection patterns and is not a guarantee of outcome. Eligibility is determined solely by the relevant government authority. QueueCutter provides document preparation support, not legal or benefits advice.",
  };
}

function getCommonRejectionTrigger(
  reason: string,
  form: FormSchema,
  answers: Record<string, string>,
): boolean {
  const r = reason.toLowerCase();

  if (r.includes("income") && r.includes("limit")) {
    if (form.id === "snap-benefits") {
      const householdSize = parseInt(answers["household_size"] || "0");
      const monthlyIncome = parseFloat(answers["monthly_income"] || "0");
      if (householdSize > 0 && monthlyIncome > 0) {
        const limits: Record<number, number> = {
          1: 1580, 2: 2137, 3: 2694, 4: 3250, 5: 3807, 6: 4364, 7: 4921, 8: 5478,
        };
        const limit =
          householdSize <= 8 ? (limits[householdSize] ?? 5478) : 5478 + (householdSize - 8) * 557;
        return monthlyIncome > limit;
      }
    }
  }
  if (r.includes("assets") && r.includes("limit")) {
    return answers["has_assets"] === "yes";
  }
  if (r.includes("non-citizen") || r.includes("citizenship")) {
    return answers["citizenship"] === "Neither";
  }
  if (r.includes("same")) {
    const oldStreet = (answers["old_street"] || "").trim().toLowerCase();
    const newStreet = (answers["new_street"] || "").trim().toLowerCase();
    if (oldStreet && newStreet && oldStreet === newStreet) return true;
  }
  if (r.includes("16,000") || r.includes("savings")) {
    const savings = parseFloat(answers["savings"] || "0");
    if (savings > 16000) return true;
  }
  if (r.includes("aadhaar")) {
    const aadhaar = answers["aadhaar_number"] || "";
    if (aadhaar && aadhaar.replace(/\D/g, "").length !== 12) return true;
  }

  return false;
}
