import type { FormSchema } from "./forms.js";

export interface ChecklistItem {
  id: string;
  category: "carry" | "verify" | "do_next";
  text: string;
  required: boolean;
  note?: string;
}

export interface SubmissionStep {
  step: number;
  title: string;
  description: string;
}

export function generateChecklist(
  form: FormSchema,
  answers: Record<string, string>,
): { items: ChecklistItem[]; submissionSteps: SubmissionStep[] } {
  const items: ChecklistItem[] = [];

  // --- CARRY: documents to bring ---
  form.requiredDocuments.forEach((doc, i) => {
    items.push({
      id: `carry_${i}`,
      category: "carry",
      text: doc,
      required: true,
    });
  });

  // --- VERIFY: form-specific checks ---
  if (form.id === "snap-benefits") {
    items.push({
      id: "verify_income_docs",
      category: "verify",
      text: "Verify that your income documentation covers the last 30 days",
      required: true,
      note: "If self-employed, bring your most recent tax return or a signed statement of income.",
    });
    items.push({
      id: "verify_all_members",
      category: "verify",
      text: "Confirm you have ID and SSN documentation for ALL household members",
      required: true,
      note: `You reported a household size of ${answers["household_size"] || "?"}.`,
    });
    items.push({
      id: "verify_expenses",
      category: "verify",
      text: "Gather proof of monthly expenses: rent, utilities, childcare, and medical bills",
      required: false,
      note: "These expenses may reduce your countable income and increase your benefit amount.",
    });
    items.push({
      id: "verify_bank",
      category: "verify",
      text: "Bring bank account statements for ALL accounts for the past 30 days",
      required: true,
    });

    if (answers["citizenship"] === "Qualified Non-Citizen") {
      items.push({
        id: "verify_immigration",
        category: "carry",
        text: "Immigration status documentation (I-551 Green Card, I-94, I-766 EAD, or other proof)",
        required: true,
        note: "Your caseworker will need to verify your immigration status.",
      });
    }
  }

  if (form.id === "change-of-address") {
    items.push({
      id: "verify_address_proof",
      category: "verify",
      text: "Confirm your proof-of-new-address document shows your exact new address",
      required: true,
      note: "The address on the document must match exactly what you write on the form.",
    });

    if (answers["update_voter"] === "yes") {
      items.push({
        id: "verify_voter",
        category: "verify",
        text: "Confirm your voter registration deadline — most states require 15-30 days before an election",
        required: true,
        note: "Contact your county clerk or visit vote.gov for your state's deadline.",
      });
      items.push({
        id: "carry_voter_id",
        category: "carry",
        text: "Your current voter registration card (if available)",
        required: false,
      });
    }
  }

  // --- DO NEXT: action items ---
  items.push({
    id: "next_review_pdf",
    category: "do_next",
    text: "Review all fields in your prepared document carefully before submitting",
    required: true,
    note: "Look for any blank fields or formatting issues highlighted in red.",
  });
  items.push({
    id: "next_make_copies",
    category: "do_next",
    text: "Make copies of all documents and your completed form for your records",
    required: true,
  });
  items.push({
    id: "next_submit",
    category: "do_next",
    text: `Submit your completed form to: ${form.submissionOffice}`,
    required: true,
  });
  items.push({
    id: "next_follow_up",
    category: "do_next",
    text: "Note the date you submitted and ask for a confirmation receipt or number",
    required: true,
    note: "Keep this for your records in case there are any questions about your application.",
  });

  // --- Submission Steps ---
  const steps: SubmissionStep[] = getSubmissionSteps(form, answers);

  return { items, submissionSteps: steps };
}

function getSubmissionSteps(
  form: FormSchema,
  answers: Record<string, string>,
): SubmissionStep[] {
  if (form.id === "snap-benefits") {
    return [
      {
        step: 1,
        title: "Complete your application",
        description:
          "Use the field values from this QueueCutter document to fill in the official SNAP application form from your state agency. You can often complete it online at your state's benefits portal.",
      },
      {
        step: 2,
        title: "Gather all required documents",
        description:
          "Collect your ID, SSN cards, income proof (last 30 days of pay stubs or benefit letters), proof of address, bank statements, and expense receipts.",
      },
      {
        step: 3,
        title: "Submit your application",
        description:
          "Submit online through your state's benefits portal, by mail, in person at your local SNAP/DHHS office, or by fax. Keep a copy of everything you submit.",
      },
      {
        step: 4,
        title: "Attend your interview",
        description:
          "Most applicants must complete an interview (in person or by phone) within 30 days. A caseworker will review your information and may ask for additional documentation.",
      },
      {
        step: 5,
        title: "Await your determination",
        description: `You should receive a decision within 30 days of your application date (${form.processingTime}). Expedited processing (7 days) may be available if your income and resources are very low.`,
      },
      {
        step: 6,
        title: "Receive your EBT card",
        description:
          "If approved, benefits are loaded monthly onto your Electronic Benefit Transfer (EBT) card, which works like a debit card at authorized grocery stores.",
      },
    ];
  }

  if (form.id === "change-of-address") {
    const steps: SubmissionStep[] = [
      {
        step: 1,
        title: "Review your prepared form",
        description:
          "Use the field values from this document to complete the official USPS Change of Address form (PS Form 3575). You can submit online at moversguide.usps.com or in person at any post office.",
      },
      {
        step: 2,
        title: "Submit the USPS Change of Address",
        description: `Go to moversguide.usps.com (there is a $1.10 identity verification fee) or visit your local post office with the completed PS Form 3575. Fee: ${form.fee}.`,
      },
      {
        step: 3,
        title: "Verify mail forwarding start date",
        description:
          "Forwarding typically begins 7-10 business days after submission. Your mail will be forwarded for 12 months for first-class mail.",
      },
    ];

    if (answers["update_voter"] === "yes") {
      steps.push({
        step: 4,
        title: "Update your voter registration address",
        description:
          "Visit vote.gov or your state's election website to update your voter registration. You can also visit your County Clerk or Board of Elections in person. Most states require you to update at least 15-30 days before any election.",
      });
      steps.push({
        step: 5,
        title: "Update other important records",
        description:
          "Notify your bank, employer, insurance companies, the IRS (via Form 8822), your state DMV (driver's license), and any subscriptions or services of your new address.",
      });
    } else {
      steps.push({
        step: 4,
        title: "Update other important records",
        description:
          "Notify your bank, employer, insurance companies, the IRS (via Form 8822), your state DMV (driver's license), and any subscriptions or services of your new address.",
      });
    }

    return steps;
  }

  return [];
}
