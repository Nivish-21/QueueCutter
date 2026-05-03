import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSession } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertTriangle, ChevronRight, Shield } from "lucide-react";

interface EligibilityQuestion {
  id: string;
  text: string;
  hint?: string;
  disqualifyingAnswer?: "yes" | "no";
  disqualifyingReason?: string;
}

const ELIGIBILITY_CHECKS: Record<string, EligibilityQuestion[]> = {
  "snap-benefits": [
    {
      id: "has_ssn",
      text: "Does every adult in your household have a Social Security Number (SSN) or ITIN?",
      hint: "SSN/ITIN is required for all adults applying for SNAP. Household members not applying may not need one.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "All adults included in the SNAP application must have an SSN or ITIN. Mixed-status households may still qualify for other members.",
    },
    {
      id: "income_ok",
      text: "Is your monthly household income broadly within the income limits? (e.g., under ~$2,137 for a family of 2, ~$3,250 for a family of 4)",
      hint: "Exact limits depend on household size. Deductions for childcare, shelter, and medical expenses may reduce your countable income. A caseworker will calculate your exact amount.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "Income over the gross income limit typically disqualifies households. However, expense deductions may apply — discuss your specific situation with a caseworker.",
    },
    {
      id: "is_citizen",
      text: "Is at least one household member a U.S. citizen or qualified non-citizen (e.g., lawful permanent resident, refugee, asylee)?",
      hint: "Undocumented individuals cannot receive SNAP, but eligible household members can still apply for themselves.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "At least one household member must be a U.S. citizen or qualified non-citizen to receive SNAP.",
    },
  ],
  "council-tax-reduction-gb": [
    {
      id: "is_liable",
      text: "Are you the person named on the Council Tax bill as liable to pay for this property?",
      hint: "Usually the person whose name appears on the Council Tax bill. Exemptions exist for students and some other groups.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "Only the person liable for Council Tax on a property can apply for a reduction on that bill.",
    },
    {
      id: "savings_ok",
      text: "Are your total savings and investments below £16,000?",
      hint: "Capital over £16,000 usually disqualifies working-age applicants. Pension-age applicants may be assessed differently.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "Savings over £16,000 generally disqualify working-age applicants from Council Tax Reduction. Contact your council to confirm if you are pension-age.",
    },
    {
      id: "low_income",
      text: "Are you on a low income or receiving benefits such as Universal Credit, Income Support, or Pension Credit?",
      hint: "Council Tax Reduction is designed for people on low incomes or receiving means-tested benefits.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "CTR is means-tested. Higher earners without benefits are unlikely to qualify, but you can still apply and a caseworker will assess your situation.",
    },
  ],
  "income-certificate-in": [
    {
      id: "has_aadhaar",
      text: "Do you have a valid Aadhaar card?",
      hint: "Aadhaar is mandatory for income certificate applications in most states.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "An Aadhaar card is required in most states. Apply for Aadhaar first at your nearest Aadhaar Seva Kendra or online at uidai.gov.in.",
    },
    {
      id: "correct_state",
      text: "Are you a current resident of the state where you are applying?",
      hint: "You must apply through the Tehsil/SDM office in the district where you currently live.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "Income certificates must be applied for in your current state and district of residence.",
    },
  ],
  "domicile-certificate-in": [
    {
      id: "has_aadhaar",
      text: "Do you have a valid Aadhaar card that shows your current address in the state you are claiming domicile in?",
      hint: "Aadhaar address must match the state of domicile you are claiming. If your Aadhaar address is outdated, update it first.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "Aadhaar is required and your Aadhaar address should match the claimed domicile state. Update at a UIDAI centre if needed.",
    },
    {
      id: "years_resident",
      text: "Have you lived continuously in this state for at least 3 years? (Many states require longer — 5 to 15 years.)",
      hint: "Continuous residence requirements vary by state. Check your state's specific rule before applying.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "Most states require 3–15 years of continuous residence for a domicile certificate. Verify your state's specific requirement.",
    },
  ],
  "ss5-replacement": [
    {
      id: "has_originals",
      text: "Do you have original documents proving your identity and U.S. citizenship (or eligible immigration status)?",
      hint: "The SSA accepts only original documents — no photocopies. Originals are returned to you after review.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "Original documents are required for SSN card replacement. Gather your originals before visiting the SSA office.",
    },
    {
      id: "under_limit",
      text: "Have you received fewer than 3 replacement Social Security cards this year and fewer than 10 in your lifetime?",
      hint: "The SSA limits replacement cards to 3 per year and 10 per lifetime for most people.",
      disqualifyingAnswer: "no",
      disqualifyingReason: "If you have reached the annual or lifetime limit, you cannot receive another replacement card at this time. Contact the SSA for exceptions.",
    },
  ],
};

const DEFAULT_CHECKS: EligibilityQuestion[] = [
  {
    id: "has_docs",
    text: "Do you have the key documents listed on the previous screen available?",
    hint: "Having your documents ready before starting helps you answer all questions accurately.",
    disqualifyingAnswer: "no",
    disqualifyingReason: "Gather your documents before starting — incomplete documentation is one of the most common causes of rejection.",
  },
];

const COUNTRY_FLAGS: Record<string, string> = { US: "🇺🇸", IN: "🇮🇳", GB: "🇬🇧" };

export default function EligibilityPage() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const [, setLocation] = useLocation();

  const { data: session, isLoading } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getSession", sessionId] },
  });

  const [answers, setAnswers] = useState<Record<string, "yes" | "no">>({});
  const [checked, setChecked] = useState(false);

  const checks = session ? (ELIGIBILITY_CHECKS[session.formId] ?? DEFAULT_CHECKS) : [];
  const allAnswered = checks.every((q) => answers[q.id]);

  const disqualifying = checked
    ? checks.filter((q) => q.disqualifyingAnswer && answers[q.id] === q.disqualifyingAnswer)
    : [];

  const eligibilityStatus = !checked
    ? null
    : disqualifying.length === 0
      ? "likely_eligible"
      : "may_face_challenges";

  const handleContinue = () => {
    setLocation(`/persona/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto pt-12 space-y-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-medium">Quick eligibility check</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {session
            ? `${COUNTRY_FLAGS[session.countryCode] ?? ""} ${session.formName}`
            : "Eligibility Check"}
        </h1>
        <p className="text-sm text-muted-foreground">
          A few quick questions to flag common issues before you start. You can proceed regardless of the result — eligibility is always determined by the government authority.
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-lg">Basic eligibility questions</CardTitle>
          <CardDescription>Based on the most common disqualifying factors for this form.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-7">
          {checks.map((q) => (
            <div key={q.id} className="space-y-3">
              <div>
                <p className="font-medium text-foreground leading-snug">{q.text}</p>
                {q.hint && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{q.hint}</p>
                )}
              </div>
              <RadioGroup
                value={answers[q.id] ?? ""}
                onValueChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: val as "yes" | "no" }))
                }
                className="flex gap-3"
              >
                {(["yes", "no"] as const).map((opt) => (
                  <div
                    key={opt}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-colors flex-1 ${
                      answers[q.id] === opt
                        ? opt === "yes"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : "border-red-400 bg-red-50 dark:bg-red-950/20"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40"
                    }`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                  >
                    <RadioGroupItem value={opt} id={`${q.id}-${opt}`} className="w-4 h-4" />
                    <Label htmlFor={`${q.id}-${opt}`} className="text-base cursor-pointer font-medium">
                      {opt === "yes" ? "Yes" : "No"}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {checked && answers[q.id] === q.disqualifyingAnswer && q.disqualifyingReason && (
                <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{q.disqualifyingReason}</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!checked && (
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => setChecked(true)}
          disabled={!allAnswered}
        >
          Check eligibility
        </Button>
      )}

      {checked && eligibilityStatus && (
        <Card
          className={
            eligibilityStatus === "likely_eligible"
              ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/40"
              : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40"
          }
        >
          <CardContent className="p-5 flex items-start gap-4">
            {eligibilityStatus === "likely_eligible" ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                {eligibilityStatus === "likely_eligible"
                  ? "You likely meet the basic eligibility criteria"
                  : `${disqualifying.length} potential issue${disqualifying.length !== 1 ? "s" : ""} found`}
              </p>
              <p className="text-sm text-muted-foreground">
                {eligibilityStatus === "likely_eligible"
                  ? "Your answers suggest you meet the primary requirements. Continue to start your application."
                  : "You can still complete the form and discuss your situation with a caseworker. Eligibility is determined by the government authority, not by this check."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2 gap-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This quick check does not determine eligibility — it is for preparation only. QueueCutter provides document preparation support, not legal or benefits advice.
        </p>
        <Button size="lg" onClick={handleContinue} className="px-8 shrink-0">
          Continue
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
