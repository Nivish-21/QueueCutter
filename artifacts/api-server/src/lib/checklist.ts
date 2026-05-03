import type { FormSchema } from "./forms.js";
import type { Persona } from "@workspace/db";

export interface ChecklistItem {
  id: string;
  category: "carry" | "verify" | "do_next";
  text: string;
  required: boolean;
  note?: string;
  rejectionRisk?: boolean;
}

export interface SubmissionStep {
  step: number;
  title: string;
  description: string;
}

export function generateChecklist(
  form: FormSchema,
  answers: Record<string, string>,
  persona?: Persona | null,
): { items: ChecklistItem[]; submissionSteps: SubmissionStep[]; disclaimer: string } {
  const items: ChecklistItem[] = [];
  const isConfused = persona?.comfort === "I find it confusing";
  const wasRejected = persona?.priorExperience === "Applied before but it was rejected";
  const isFirstTimer = persona?.priorExperience === "First time";
  const isSenior = persona?.role === "Senior Citizen";

  // ─── CARRY: documents to bring ───
  form.requiredDocuments.forEach((doc, i) => {
    const isHighRisk = isHighRejectionRiskDoc(doc, form.countryCode);
    items.push({
      id: `carry_${i}`,
      category: "carry",
      text: doc,
      required: true,
      rejectionRisk: isHighRisk || wasRejected,
      note: isHighRisk && (isFirstTimer || isConfused || isSenior)
        ? "This document is commonly missing — applications are often rejected without it."
        : undefined,
    });
  });

  // ─── VERIFY: form-specific checks ───
  if (form.id === "snap-benefits") {
    items.push({
      id: "verify_income_docs",
      category: "verify",
      text: "Verify that your income documentation covers the last 30 days",
      required: true,
      rejectionRisk: true,
      note: isConfused
        ? "This means pay stubs, bank printouts, or letters that show money you received in the last month."
        : "If self-employed, bring your most recent tax return or a signed statement of income.",
    });
    items.push({
      id: "verify_all_members",
      category: "verify",
      text: "Confirm you have ID and Social Security card for ALL household members",
      required: true,
      rejectionRisk: true,
      note: `You reported a household size of ${answers["household_size"] || "?"}. Missing SSN for even one member causes rejection.`,
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
      rejectionRisk: wasRejected,
    });

    if (answers["citizenship"] === "Qualified Non-Citizen") {
      items.push({
        id: "verify_immigration",
        category: "carry",
        text: "Immigration status documentation (I-551 Green Card, I-94, I-766 EAD, or other proof)",
        required: true,
        rejectionRisk: true,
        note: "Your caseworker must verify your immigration status. This is one of the most common rejection reasons.",
      });
    }
  }

  if (form.id === "change-of-address") {
    items.push({
      id: "verify_address_proof",
      category: "verify",
      text: "Confirm your proof-of-new-address document shows your EXACT new address",
      required: true,
      rejectionRisk: true,
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

  if (form.id === "ss5-replacement") {
    items.push({
      id: "verify_originals",
      category: "verify",
      text: "Confirm all documents are ORIGINALS — no photocopies accepted",
      required: true,
      rejectionRisk: true,
      note: "The SSA will return originals to you after verification. This is the most common rejection reason.",
    });
    items.push({
      id: "verify_name_match",
      category: "verify",
      text: "Ensure the name on your ID matches the name on your application exactly",
      required: true,
      rejectionRisk: true,
    });
  }

  if (form.id === "income-certificate-in") {
    items.push({
      id: "verify_aadhaar_match",
      category: "verify",
      text: "Check that your name on Aadhaar matches your name on the Ration Card exactly",
      required: true,
      rejectionRisk: true,
      note: "Name mismatches between Aadhaar and Ration Card are the #1 cause of rejection.",
    });
    items.push({
      id: "verify_income_declaration",
      category: "carry",
      text: "Self-declaration affidavit of income on stamp paper (as required by your state)",
      required: true,
      rejectionRisk: true,
      note: isConfused
        ? "This is a signed paper saying what your income is. Your local stationery shop or CSC can help you get this."
        : "Required affidavit — missing this document causes immediate rejection.",
    });
  }

  if (form.id === "domicile-certificate-in") {
    items.push({
      id: "verify_address_aadhaar",
      category: "verify",
      text: "Confirm your Aadhaar shows the same address you are claiming domicile for",
      required: true,
      rejectionRisk: true,
      note: "If Aadhaar address differs, bring an official address update receipt from UIDAI.",
    });
    items.push({
      id: "verify_residency_proof",
      category: "carry",
      text: "Self-declaration affidavit of years of residence on stamp paper",
      required: true,
      rejectionRisk: true,
    });
  }

  if (form.id === "council-tax-reduction-gb") {
    items.push({
      id: "verify_proof_date",
      category: "verify",
      text: "Confirm all proof-of-address documents are dated within the last 3 months",
      required: true,
      rejectionRisk: true,
      note: "A document dated more than 3 months ago is rejected by most councils.",
    });
    items.push({
      id: "verify_ni_number",
      category: "verify",
      text: "Double-check your National Insurance number is correct (format: XX999999X)",
      required: true,
      rejectionRisk: true,
      note: "Incorrect NI numbers are among the top reasons Council Tax Reduction applications fail.",
    });
    items.push({
      id: "verify_savings",
      category: "verify",
      text: "If savings exceed £16,000, note that you may not be eligible",
      required: false,
      rejectionRisk: parseFloat(answers["savings"] || "0") > 16000,
      note: "Capital over £16,000 usually disqualifies applicants from Council Tax Reduction.",
    });
  }

  if (form.id === "proof-of-address-gb") {
    items.push({
      id: "verify_doc_currency",
      category: "verify",
      text: "Confirm your proof-of-address document is dated within 3 months and shows your name",
      required: true,
      rejectionRisk: true,
      note: isConfused
        ? "This could be a gas bill, electric bill, or bank statement — it must be recent and show your name and address."
        : "Mobile phone bills are generally not accepted. Use utility bills or bank statements.",
    });
  }

  // ─── DO NEXT: action items ───
  items.push({
    id: "next_review_pdf",
    category: "do_next",
    text: "Review all fields in your prepared document carefully before submitting",
    required: true,
    note: "Look for any blank fields highlighted in red.",
  });
  items.push({
    id: "next_make_copies",
    category: "do_next",
    text: "Make photocopies of all documents and your completed form",
    required: true,
    note: isConfused ? "Make copies before you go. If something goes wrong, you'll have a backup." : undefined,
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
    text: "Ask for a confirmation receipt or reference number when you submit",
    required: true,
    note: "Keep this safe — you may need it if there are questions about your application.",
  });

  if (wasRejected) {
    items.push({
      id: "next_rejection_check",
      category: "do_next",
      text: "Ask why your previous application was rejected and confirm you have resolved those issues",
      required: false,
      rejectionRisk: true,
      note: "If you were rejected before, the same issue may come up again. Ask the office directly what was wrong.",
    });
  }

  if (form.countryCode === "IN") {
    items.push({
      id: "next_escalation_guide",
      category: "do_next",
      text: "Save the escalation guide in case your application is delayed beyond the statutory window (7–30 days)",
      required: false,
      note: "If your certificate is not issued within the required time, you have rights under the Right to Services Act and the RTI Act, 2005. An escalation guide is available in your QueueCutter session.",
    });
  }

  const submissionSteps = getSubmissionSteps(form, answers, persona);
  const disclaimer = getDisclaimer(form);

  return { items, submissionSteps, disclaimer };
}

function isHighRejectionRiskDoc(doc: string, countryCode: string): boolean {
  const d = doc.toLowerCase();
  if (countryCode === "IN") {
    return d.includes("aadhaar") || d.includes("affidavit") || d.includes("self-declaration");
  }
  if (countryCode === "GB") {
    return d.includes("national insurance") || d.includes("ni ") || d.includes("passport");
  }
  if (countryCode === "US") {
    return d.includes("social security") || d.includes("original") || d.includes("itin");
  }
  return false;
}

function getDisclaimer(form: FormSchema): string {
  if (form.countryCode === "IN") {
    return "Requirements may vary by state and district. QueueCutter provides document preparation support only — not legal or administrative advice. Always verify current requirements with your local Tehsil/SDM office or Common Service Centre before visiting. Eligibility and issuance are determined solely by the relevant government authority.";
  }
  if (form.countryCode === "GB") {
    return "Council Tax Reduction schemes vary by local authority and are subject to change. QueueCutter provides document preparation support only — not legal, benefits, or financial advice. Check with your local council or gov.uk to confirm current eligibility rules before submitting.";
  }
  return "Requirements may vary. QueueCutter provides document preparation support only — not legal or benefits advice. Always check with your local office before submitting. QueueCutter is not affiliated with any government agency.";
}

function getSubmissionSteps(
  form: FormSchema,
  answers: Record<string, string>,
  persona?: Persona | null,
): SubmissionStep[] {
  const simple = persona?.comfort === "I find it confusing";

  if (form.id === "snap-benefits") {
    return [
      { step: 1, title: "Complete your application", description: simple ? "Use your prepared answers from QueueCutter to fill in the official SNAP form. You can often do this online at your state's benefits website." : "Use the field values from this QueueCutter document to fill in the official SNAP application form from your state agency." },
      { step: 2, title: "Gather all required documents", description: "Collect your ID, Social Security cards, income proof (last 30 days), proof of address, bank statements, and expense receipts." },
      { step: 3, title: "Submit your application", description: "Submit online, by mail, in person at your local SNAP/DHHS office, or by fax. Keep a copy of everything." },
      { step: 4, title: "Attend your interview", description: simple ? "Someone from the office will call you or ask you to come in. They just want to confirm your information — it is not scary." : "Most applicants must complete an interview (in person or by phone) within 30 days." },
      { step: 5, title: "Await your determination", description: `You should receive a decision within 30 days (${form.processingTime}). Expedited processing (7 days) may be available if your income is very low.` },
      { step: 6, title: "Receive your EBT card", description: "If approved, benefits are loaded monthly onto your Electronic Benefit Transfer (EBT) card, which works like a debit card at grocery stores." },
    ];
  }

  if (form.id === "change-of-address") {
    const steps: SubmissionStep[] = [
      { step: 1, title: "Review your prepared form", description: "Use your answers from QueueCutter to complete the official USPS Change of Address form (PS Form 3575). Submit online at moversguide.usps.com or at your post office." },
      { step: 2, title: "Submit the USPS Change of Address", description: `Go to moversguide.usps.com (there is a $1.10 identity verification fee) or visit your local post office. Fee: ${form.fee}.` },
      { step: 3, title: "Verify mail forwarding start date", description: "Forwarding begins 7-10 business days after submission. Your mail will be forwarded for 12 months." },
    ];
    if (answers["update_voter"] === "yes") {
      steps.push({ step: 4, title: "Update your voter registration address", description: "Visit vote.gov or your state's election website. You can also go to your County Clerk in person." });
    }
    steps.push({ step: steps.length + 1, title: "Update other important records", description: "Notify your bank, employer, insurance companies, the IRS (Form 8822), and your state DMV." });
    return steps;
  }

  if (form.id === "ss5-replacement") {
    return [
      { step: 1, title: "Gather original documents", description: "You MUST bring original documents — no photocopies. Bring at least one photo ID and proof of citizenship." },
      { step: 2, title: "Visit your local SSA office", description: "Find your nearest Social Security Administration office at ssa.gov/locator. Walk-in during business hours — no appointment needed for card replacements." },
      { step: 3, title: "Submit your application", description: "The clerk will review your originals and process the request. They will return all original documents to you." },
      { step: 4, title: "Receive your card by mail", description: `Your replacement card will arrive within ${form.processingTime}. It will be mailed to the address you provided.` },
    ];
  }

  if (form.id === "income-certificate-in") {
    return [
      { step: 1, title: "Prepare your documents", description: "Gather your Aadhaar card (original + photocopy), Ration Card, self-declaration affidavit, and any income proof." },
      { step: 2, title: "Visit the Tehsil or CSC", description: simple ? "Go to your local government office (Tehsil) or Common Service Centre. They will fill the form for you if you bring your papers." : "Visit your Tehsildar office, SDM office, or a Common Service Centre (CSC) in your district." },
      { step: 3, title: "Submit and pay the fee", description: `The fee is ${form.fee}. Keep the receipt.` },
      { step: 4, title: "Collect the certificate", description: `The certificate is usually ready within ${form.processingTime}. You may receive an SMS or need to return to collect it.` },
    ];
  }

  if (form.id === "domicile-certificate-in") {
    return [
      { step: 1, title: "Prepare your documents", description: "Gather your Aadhaar card, Ration Card, self-declaration affidavit on stamp paper, and any address proof." },
      { step: 2, title: "Visit the Tehsil or e-district portal", description: "Go to your Tehsildar office or submit online through your state's e-district portal if available." },
      { step: 3, title: "Submit application and pay fee", description: `Fee: ${form.fee}. Keep your application receipt.` },
      { step: 4, title: "Collect the certificate", description: `Processing takes ${form.processingTime}. You will be notified when it is ready.` },
    ];
  }

  if (form.id === "council-tax-reduction-gb") {
    return [
      { step: 1, title: "Submit your online application", description: "Go to your council's website and search for 'Council Tax Reduction application'. Most councils accept online applications." },
      { step: 2, title: "Provide supporting documents", description: "Upload or post copies of your proof of income, bank statements, and proof of address (dated within 3 months)." },
      { step: 3, title: "Await council decision", description: `Your council will process your application within ${form.processingTime}. They may contact you for additional information.` },
      { step: 4, title: "Receive revised Council Tax bill", description: "If approved, you will receive a revised Council Tax bill showing the reduced amount. Any overpayment will be credited to your account." },
    ];
  }

  if (form.id === "proof-of-address-gb") {
    return [
      { step: 1, title: "Gather your proof documents", description: "Collect a utility bill, bank statement, or council tax bill dated within the last 3 months, showing your name and address." },
      { step: 2, title: "Submit to DWP or Jobcentre", description: "Upload documents through your Universal Credit journal, or bring them to your local Jobcentre Plus office." },
      { step: 3, title: "Await verification", description: `DWP will review and verify your documents within ${form.processingTime}.` },
    ];
  }

  return [];
}
