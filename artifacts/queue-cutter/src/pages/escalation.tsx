import React from "react";
import { useParams, Link } from "wouter";
import { useGetSession } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Clock, AlertTriangle, Scale } from "lucide-react";

interface EscalationStep {
  title: string;
  detail: string;
  links?: { label: string; url: string }[];
}

interface EscalationInfo {
  processingWindow: string;
  legalBasis: string;
  steps: EscalationStep[];
}

const ESCALATION_DATA: Record<string, EscalationInfo> = {
  "snap-benefits": {
    processingWindow: "30 days (7 days for expedited cases)",
    legalBasis: "7 C.F.R. § 273.2 requires the state agency to process SNAP applications within 30 days of filing. Expedited service must be provided within 7 days for eligible households.",
    steps: [
      {
        title: "Request a status update from your local SNAP office",
        detail: "Contact your state or county SNAP office by phone or in person. Bring your case number and the date you applied. Ask for the reason if your application is delayed beyond 30 days.",
      },
      {
        title: "File an appeal or request a fair hearing",
        detail: "If your application is denied or benefits are reduced, you have the right to a fair hearing. You must request it within 90 days of the notice. Your benefits may continue while the hearing is pending.",
        links: [{ label: "USDA SNAP complaints", url: "https://www.usda.gov/oig/hotline.htm" }],
      },
      {
        title: "Contact your state's legal aid office",
        detail: "Many states have free legal aid organizations that specialize in public benefits. They can help you prepare for a hearing or file a complaint on your behalf.",
        links: [{ label: "Find legal aid near you", url: "https://www.lawhelp.org" }],
      },
      {
        title: "File a complaint with the USDA Food and Nutrition Service",
        detail: "If you believe your state agency is systematically mishandling SNAP applications, you can file a complaint directly with the USDA FNS regional office in your state.",
      },
    ],
  },
  "ss5-replacement": {
    processingWindow: "2–4 weeks after verification is complete",
    legalBasis: "Social Security Act § 205(c)(2) requires SSA to issue replacement cards. Processing times may extend if additional identity verification is required.",
    steps: [
      {
        title: "Check your application status with SSA",
        detail: "Call the SSA at 1-800-772-1213 or visit your local Social Security office. Have your receipt number if you applied online, or the date and office where you applied in person.",
      },
      {
        title: "Visit your local Social Security office",
        detail: "If your replacement card is delayed beyond 4 weeks, visit your nearest SSA office in person. Bring additional identity documents in case further verification is needed.",
      },
      {
        title: "File a complaint with the SSA Office of the Inspector General",
        detail: "If you believe SSA staff acted improperly or your case was mishandled, you can report it to the SSA OIG hotline.",
        links: [{ label: "SSA OIG Hotline", url: "https://oig.ssa.gov/report" }],
      },
      {
        title: "Contact your congressional representative's office",
        detail: "Your U.S. Senator or Representative can submit a congressional inquiry on your behalf, which often accelerates resolution of delayed federal agency cases.",
        links: [{ label: "Find your representative", url: "https://www.congress.gov/members/find-your-member" }],
      },
    ],
  },
  "change-of-address": {
    processingWindow: "7–10 business days for mail forwarding to begin",
    legalBasis: "USPS regulations require mail forwarding to begin within 7–10 business days of a confirmed Change of Address request.",
    steps: [
      {
        title: "Verify your change of address was submitted correctly",
        detail: "Check that you received a confirmation email or letter from USPS. If you applied online, log in to usps.com to view your request status.",
      },
      {
        title: "Contact USPS Consumer Affairs",
        detail: "If forwarding has not started after 10 business days, call 1-800-275-8777 (1-800-ASK-USPS) or visit your local post office and ask to speak with a supervisor.",
      },
      {
        title: "File a formal complaint with USPS",
        detail: "Submit a written complaint through the USPS website. Keep a copy of your complaint confirmation number for follow-up.",
        links: [{ label: "USPS complaint form", url: "https://postalinspectors.uspis.gov" }],
      },
      {
        title: "Update your address with your state's election board",
        detail: "A Change of Address with USPS does not automatically update your voter registration. Contact your state or county election office to update your registration separately.",
      },
    ],
  },
  "income-certificate-in": {
    processingWindow: "7–30 days (varies by state)",
    legalBasis: "State Citizens' Charter and Right to Public Services Acts mandate specific processing timelines for income certificates.",
    steps: [
      {
        title: "Follow up in person or by phone",
        detail: "Visit the Tehsil / SDM office or Common Service Centre (CSC) where you submitted. Bring your acknowledgement receipt and note down the officer's name and designation.",
      },
      {
        title: "File an online grievance",
        detail: "Use your state's CM Helpline or online grievance portal. File a complaint with your application number, submission date, and office name.",
        links: [
          { label: "National Grievance Portal", url: "https://pgportal.gov.in" },
          { label: "CPGRAMS", url: "https://cpgrams.gov.in" },
        ],
      },
      {
        title: "Escalate to the District Magistrate / Collector",
        detail: "Write a formal complaint letter to the District Magistrate (DM) or District Collector's office. Include your application number, submission date, and the specific issue.",
      },
      {
        title: "File an RTI request",
        detail: "Under the Right to Information Act, 2005, you can formally request information on the status of your application. The department must respond within 30 days.",
        links: [{ label: "RTI Online", url: "https://rtionline.gov.in" }],
      },
      {
        title: "Seek free legal help from DLSA",
        detail: "The District Legal Services Authority (DLSA) provides free legal assistance to eligible citizens. They can advise on further steps including approaching the courts.",
        links: [{ label: "NALSA", url: "https://nalsa.gov.in" }],
      },
    ],
  },
  "domicile-certificate-in": {
    processingWindow: "7–30 days (varies by state)",
    legalBasis: "State Citizens' Charter and Right to Services Acts mandate processing timelines for domicile certificates.",
    steps: [
      {
        title: "Follow up in person or by phone",
        detail: "Visit the Tehsil / SDM office or Common Service Centre (CSC) where you submitted. Bring your acknowledgement receipt and note down the officer's name and designation.",
      },
      {
        title: "File an online grievance",
        detail: "Use your state's CM Helpline or online grievance portal. File a complaint with your application number, submission date, and office name.",
        links: [
          { label: "National Grievance Portal", url: "https://pgportal.gov.in" },
          { label: "CPGRAMS", url: "https://cpgrams.gov.in" },
        ],
      },
      {
        title: "Escalate to the District Magistrate / Collector",
        detail: "Write a formal complaint letter to the District Magistrate (DM) or District Collector's office. Include your application number, submission date, and the specific issue.",
      },
      {
        title: "File an RTI request",
        detail: "Under the Right to Information Act, 2005, you can formally request information on the status of your application. The department must respond within 30 days.",
        links: [{ label: "RTI Online", url: "https://rtionline.gov.in" }],
      },
      {
        title: "Seek free legal help from DLSA",
        detail: "The District Legal Services Authority (DLSA) provides free legal assistance to eligible citizens. They can advise on further steps including approaching the courts.",
        links: [{ label: "NALSA", url: "https://nalsa.gov.in" }],
      },
    ],
  },
  "council-tax-reduction-gb": {
    processingWindow: "Up to 14 days for a decision after all information is received",
    legalBasis: "Under the Council Tax Reduction Schemes (Prescribed Requirements) (England) Regulations 2012, local councils must process applications promptly. You have the right to appeal a decision.",
    steps: [
      {
        title: "Contact your local council's benefits team",
        detail: "Phone or visit your local council to ask for a status update. Reference your application date and any reference number you received. Ask why your application has not been decided.",
      },
      {
        title: "Request a mandatory reconsideration",
        detail: "If your application is refused or you receive a lower reduction than expected, you can ask your council to reconsider its decision. Do this within one month of the decision letter.",
      },
      {
        title: "Appeal to the Valuation Tribunal",
        detail: "If the council upholds its decision after reconsideration, you can appeal to the independent Valuation Tribunal for England (or equivalent in Wales/Scotland). This is free.",
        links: [{ label: "Valuation Tribunal England", url: "https://www.valuationtribunal.gov.uk" }],
      },
      {
        title: "Complain to the Local Government Ombudsman",
        detail: "If you believe the council has acted with maladministration (e.g., unreasonable delays, poor communication), you can complain to the Local Government and Social Care Ombudsman after exhausting local complaints.",
        links: [{ label: "LGO Complaints", url: "https://www.lgo.org.uk/make-a-complaint" }],
      },
    ],
  },
  "proof-of-address-gb": {
    processingWindow: "Varies by issuing authority; DWP decisions typically within 8 weeks",
    legalBasis: "DWP is required to process benefit claims promptly and to communicate decisions in writing. The Social Security Act 1998 provides a right of appeal against most benefit decisions.",
    steps: [
      {
        title: "Contact DWP directly",
        detail: "Call the relevant DWP benefit line (e.g., Universal Credit helpline at 0800 328 5644) to ask about your claim status. Note the date, time, and name of the agent you speak to.",
      },
      {
        title: "Submit a formal complaint to DWP",
        detail: "If you are unhappy with how your case has been handled, submit a formal complaint in writing or through GOV.UK. DWP must respond within a set timeframe.",
        links: [{ label: "DWP complaints", url: "https://www.gov.uk/complain-about-dwp" }],
      },
      {
        title: "Contact the Independent Case Examiner (ICE)",
        detail: "If DWP does not resolve your complaint satisfactorily, escalate to the Independent Case Examiner, who will review whether DWP followed its own rules.",
        links: [{ label: "Independent Case Examiner", url: "https://www.gov.uk/government/organisations/independent-case-examiner" }],
      },
      {
        title: "Contact your MP or the Parliamentary Ombudsman",
        detail: "Your MP can refer your complaint to the Parliamentary and Health Service Ombudsman (PHSO), who investigates serious maladministration by government departments including DWP.",
        links: [{ label: "Find your MP", url: "https://members.parliament.uk/FindYourMP" }],
      },
    ],
  },
};

const STEP_COLORS = [
  { border: "border-l-primary", bg: "bg-primary", text: "text-primary-foreground" },
  { border: "border-l-amber-500", bg: "bg-amber-500", text: "text-white" },
  { border: "border-l-orange-500", bg: "bg-orange-500", text: "text-white" },
  { border: "border-l-red-500", bg: "bg-red-500", text: "text-white" },
  { border: "border-l-purple-500", bg: "bg-purple-500", text: "text-white" },
];

export default function EscalationPage() {
  const params = useParams();
  const sessionId = params.sessionId!;

  const { data: session, isLoading } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getSession", sessionId] },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const formId = session?.formId ?? "";
  const escalation = ESCALATION_DATA[formId];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <Link
          href={`/session/${sessionId}/checklist`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to submission guide
        </Link>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">Escalation Guide</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          What to do if your application is delayed or rejected
        </h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          This guide explains your rights and the steps to take if your{" "}
          <strong>{session?.formName}</strong> is not processed on time or is rejected without a clear reason.
        </p>
      </div>

      {escalation ? (
        <>
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base text-blue-800 dark:text-blue-300">
                  Your statutory processing window
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{escalation.processingWindow}</p>
              <p className="text-sm text-blue-700 dark:text-blue-400">{escalation.legalBasis}</p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step-by-step escalation path</h2>
            <div className="space-y-3">
              {escalation.steps.map((step, i) => {
                const color = STEP_COLORS[i % STEP_COLORS.length]!;
                return (
                  <Card key={i} className={`border-l-4 ${color.border} shadow-sm`}>
                    <CardContent className="p-5 flex gap-4">
                      <div className={`flex items-center justify-center ${color.bg} ${color.text} rounded-full w-8 h-8 font-bold shrink-0 text-sm`}>
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.detail}</p>
                        {step.links && step.links.length > 0 && (
                          <div className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1">
                            {step.links.map((link) => (
                              <p key={link.url}>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  {link.label}
                                </a>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="font-medium text-foreground">Escalation guide not available</p>
            <p className="text-sm text-muted-foreground">
              We don't have a specific escalation guide for this form yet. Contact the relevant government agency directly or seek advice from a local legal aid service.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Scale className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Important disclaimer</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                QueueCutter provides document preparation support and general procedural information only. This escalation guide is not legal advice. For legal representation or complex disputes, consult a qualified legal professional or seek free legal aid in your area.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-between">
        <Link href={`/session/${sessionId}/checklist`}>
          <Button variant="outline">Back to submission guide</Button>
        </Link>
        <Link href="/">
          <Button variant="ghost">Start a new form</Button>
        </Link>
      </div>
    </div>
  );
}
