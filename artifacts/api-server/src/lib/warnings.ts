import type { FormSchema } from "./forms.js";

export interface Warning {
  id: string;
  severity: "error" | "warning" | "info";
  category: "missing" | "format" | "inconsistency" | "eligibility" | "general";
  field?: string;
  message: string;
  suggestion: string;
}

export function generateWarnings(
  form: FormSchema,
  answers: Record<string, string>,
): Warning[] {
  const warnings: Warning[] = [];

  form.questions.forEach((question) => {
    // Skip conditional questions that aren't triggered
    if (question.conditionalOn) {
      const condValue = answers[question.conditionalOn.questionId];
      if (!condValue || condValue.toLowerCase() !== question.conditionalOn.value.toLowerCase()) {
        return;
      }
    }

    const answer = answers[question.id];

    // Missing required fields
    if (question.required && (!answer || answer.trim() === "")) {
      warnings.push({
        id: `missing_${question.id}`,
        severity: "error",
        category: "missing",
        field: question.fieldMapping,
        message: `Required field "${question.officialLabel}" is missing.`,
        suggestion: `Please provide your ${question.text.toLowerCase().replace("?", "")}.`,
      });
      return;
    }

    if (!answer || answer.trim() === "") return;

    // Format validation
    if (question.validationPattern) {
      const regex = new RegExp(question.validationPattern);
      if (!regex.test(answer.trim())) {
        warnings.push({
          id: `format_${question.id}`,
          severity: "warning",
          category: "format",
          field: question.fieldMapping,
          message: `The value for "${question.officialLabel}" may be incorrectly formatted.`,
          suggestion: getFormatSuggestion(question.id, question.type),
        });
      }
    }

    // Number-specific checks
    if (question.type === "number") {
      const num = parseFloat(answer);
      if (isNaN(num) || num < 0) {
        warnings.push({
          id: `invalid_num_${question.id}`,
          severity: "warning",
          category: "format",
          field: question.fieldMapping,
          message: `"${question.officialLabel}" must be a valid positive number.`,
          suggestion: "Enter a numeric value (e.g., 3 for household size, or 1500 for income).",
        });
      }
    }
  });

  // SNAP-specific cross-field checks
  if (form.id === "snap-benefits") {
    const householdSize = parseInt(answers["household_size"] || "0");
    const monthlyIncome = parseFloat(answers["monthly_income"] || "0");
    const hasAssets = answers["has_assets"];
    const citizenship = answers["citizenship"];

    // Income vs household size eligibility hint
    if (householdSize > 0 && monthlyIncome > 0) {
      const grossIncomeLimit = getSnapIncomeLimit(householdSize);
      if (monthlyIncome > grossIncomeLimit) {
        warnings.push({
          id: "snap_income_over_limit",
          severity: "warning",
          category: "eligibility",
          message: `Your reported monthly income ($${monthlyIncome}) may exceed the gross income limit for a household of ${householdSize} ($${grossIncomeLimit}/month).`,
          suggestion:
            "You may still qualify if you have high expenses (shelter, childcare, medical). Deductions can lower your countable income. Submit your application and let your caseworker determine eligibility.",
        });
      }
    }

    if (hasAssets === "yes") {
      warnings.push({
        id: "snap_assets_over_limit",
        severity: "warning",
        category: "eligibility",
        message: "You indicated household assets may exceed the SNAP asset limit.",
        suggestion:
          "The asset limit is $2,750 (or $4,250 if someone is 60+ or disabled). Certain assets like your home and primary vehicle are excluded. Confirm the exact value with your caseworker.",
      });
    }

    if (citizenship === "Neither") {
      warnings.push({
        id: "snap_citizenship",
        severity: "error",
        category: "eligibility",
        message: "SNAP generally requires U.S. citizenship or qualified non-citizen status.",
        suggestion:
          "If you are not a citizen or qualified non-citizen, you may not be eligible. However, U.S.-citizen children in mixed-status households can still receive benefits. Contact your local SNAP office for guidance.",
      });
    }
  }

  // Change of Address: same old/new address
  if (form.id === "change-of-address") {
    const oldStreet = (answers["old_street"] || "").trim().toLowerCase();
    const newStreet = (answers["new_street"] || "").trim().toLowerCase();
    const oldZip = (answers["old_zip"] || "").trim();
    const newZip = (answers["new_zip"] || "").trim();

    if (
      oldStreet &&
      newStreet &&
      oldStreet === newStreet &&
      oldZip === newZip
    ) {
      warnings.push({
        id: "coa_same_address",
        severity: "error",
        category: "inconsistency",
        message: "Your old and new addresses appear to be the same.",
        suggestion: "Double-check that you entered the correct new address.",
      });
    }

    const effectiveDateStr = answers["effective_date"];
    if (effectiveDateStr && effectiveDateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [month, day, year] = effectiveDateStr.split("/").map(Number);
      const effectiveDate = new Date(year, month - 1, day);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      if (effectiveDate < twoYearsAgo) {
        warnings.push({
          id: "coa_old_date",
          severity: "info",
          category: "general",
          field: "effective_date",
          message: "Your move date is more than 2 years ago.",
          suggestion:
            "USPS mail forwarding is typically valid for 12 months. If you moved more than a year ago, you may need to contact your local post office directly.",
        });
      }
    }
  }

  // General info reminder
  warnings.push({
    id: "general_disclaimer",
    severity: "info",
    category: "general",
    message: "This is a preparation tool, not an official filing system.",
    suggestion:
      "Review all fields carefully before transferring information to the official form. QueueCutter helps you organize your answers but cannot guarantee eligibility or approval.",
  });

  return warnings;
}

function getSnapIncomeLimit(householdSize: number): number {
  // 2024 SNAP gross income limits (130% of Federal Poverty Level)
  const limits: Record<number, number> = {
    1: 1580, 2: 2137, 3: 2694, 4: 3250, 5: 3807,
    6: 4364, 7: 4921, 8: 5478,
  };
  if (householdSize <= 8) return limits[householdSize] ?? 5478;
  return 5478 + (householdSize - 8) * 557;
}

function getFormatSuggestion(questionId: string, type: string): string {
  if (questionId.includes("date") || questionId.includes("dob")) {
    return "Enter the date in MM/DD/YYYY format (e.g., 01/15/1985).";
  }
  if (questionId.includes("ssn")) {
    return "Enter exactly 9 digits with no spaces or dashes (e.g., 123456789).";
  }
  if (questionId.includes("zip")) {
    return "Enter a 5-digit ZIP code (e.g., 10001) or 9-digit ZIP+4 (e.g., 10001-0001).";
  }
  if (questionId.includes("phone")) {
    return "Enter 10 digits with no spaces or dashes (e.g., 5551234567).";
  }
  return "Check that the value matches the expected format.";
}
