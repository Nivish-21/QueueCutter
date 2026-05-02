import type { FormSchema } from "./forms.js";
import type { Warning } from "./warnings.js";

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
  disclaimer: string;
}

export function calculateRiskScore(
  sessionId: string,
  form: FormSchema,
  answers: Record<string, string>,
  warnings: Warning[],
): RiskScoreResult {
  const factors: RiskFactor[] = [];
  let score = 0;

  // +10 per missing required field
  const missingRequired = form.questions.filter((q) => {
    if (q.conditionalOn) {
      const condVal = answers[q.conditionalOn.questionId];
      if (!condVal || condVal.toLowerCase() !== q.conditionalOn.value.toLowerCase()) return false;
    }
    if (!q.required) return false;
    const ans = answers[q.id];
    return !ans || ans.trim() === "";
  });

  for (const q of missingRequired) {
    const impact = 10;
    score += impact;
    factors.push({
      description: `Required field missing: "${q.officialLabel}"`,
      impact,
      category: "missing_required",
    });
  }

  // +15 per inconsistency warning
  const inconsistencies = warnings.filter(
    (w) => w.category === "inconsistency" && w.severity === "error",
  );
  for (const w of inconsistencies) {
    const impact = 15;
    score += impact;
    factors.push({
      description: w.message,
      impact,
      category: "inconsistency",
    });
  }

  // +5 per eligibility warning
  const eligibilityWarnings = warnings.filter(
    (w) => w.category === "eligibility" && w.severity === "warning",
  );
  for (const w of eligibilityWarnings) {
    const impact = 10;
    score += impact;
    factors.push({
      description: w.message,
      impact,
      category: "rejection_pattern",
    });
  }

  // +3 per optional field left blank
  const optionalBlanks = form.questions.filter((q) => {
    if (q.required) return false;
    if (q.conditionalOn) {
      const condVal = answers[q.conditionalOn.questionId];
      if (!condVal || condVal.toLowerCase() !== q.conditionalOn.value.toLowerCase()) return false;
    }
    const ans = answers[q.id];
    return !ans || ans.trim() === "";
  });

  if (optionalBlanks.length > 0) {
    const impact = Math.min(optionalBlanks.length * 3, 15); // cap optional blanks at 15
    score += impact;
    factors.push({
      description: `${optionalBlanks.length} optional field(s) left blank — may weaken your application`,
      impact,
      category: "optional_blank",
    });
  }

  // +10 per common rejection reason triggered
  const answersStr = JSON.stringify(answers).toLowerCase();
  for (const reason of form.commonRejectionReasons) {
    const trigger = getCommonRejectionTrigger(reason, form, answers);
    if (trigger) {
      score += 10;
      factors.push({
        description: `Common rejection pattern: ${reason}`,
        impact: 10,
        category: "rejection_pattern",
      });
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  const level: "low" | "medium" | "high" =
    score <= 30 ? "low" : score <= 60 ? "medium" : "high";

  const issueCount = factors.filter((f) => f.category !== "optional_blank").length;

  const headline =
    level === "low"
      ? "Low Risk — Your form looks complete"
      : level === "medium"
        ? `Medium Risk — ${issueCount} issue${issueCount !== 1 ? "s" : ""} may cause delays`
        : `High Risk — ${issueCount} issue${issueCount !== 1 ? "s" : ""} may cause rejection`;

  return {
    sessionId,
    score,
    level,
    headline,
    factors,
    disclaimer:
      "This is an estimate based on common rejection patterns, not a guarantee. Eligibility is determined by the relevant government authority.",
  };
}

function getCommonRejectionTrigger(
  reason: string,
  form: FormSchema,
  answers: Record<string, string>,
): boolean {
  const r = reason.toLowerCase();

  // SNAP specific
  if (r.includes("income") && r.includes("limit")) {
    if (form.id === "snap-benefits") {
      const householdSize = parseInt(answers["household_size"] || "0");
      const monthlyIncome = parseFloat(answers["monthly_income"] || "0");
      if (householdSize > 0 && monthlyIncome > 0) {
        const limits: Record<number, number> = { 1: 1580, 2: 2137, 3: 2694, 4: 3250, 5: 3807, 6: 4364, 7: 4921, 8: 5478 };
        const limit = householdSize <= 8 ? (limits[householdSize] ?? 5478) : 5478 + (householdSize - 8) * 557;
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

  // Address same
  if (r.includes("same")) {
    const oldStreet = (answers["old_street"] || "").trim().toLowerCase();
    const newStreet = (answers["new_street"] || "").trim().toLowerCase();
    if (oldStreet && newStreet && oldStreet === newStreet) return true;
  }

  // UK savings limit
  if (r.includes("16,000") || r.includes("savings")) {
    const savings = parseFloat(answers["savings"] || "0");
    if (savings > 16000) return true;
  }

  // India Aadhaar mismatch (if field is provided but very short)
  if (r.includes("aadhaar")) {
    const aadhaar = answers["aadhaar_number"] || "";
    if (aadhaar && aadhaar.replace(/\D/g, "").length !== 12) return true;
  }

  return false;
}
