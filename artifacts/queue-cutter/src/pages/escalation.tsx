import React from "react";
import { useParams, Link } from "wouter";
import { useGetSession } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Clock, AlertTriangle, Scale, ExternalLink } from "lucide-react";

const STATUTORY_WINDOWS: Record<string, { days: string; law: string }> = {
  "income-certificate-in": {
    days: "7–30 days (varies by state)",
    law: "State Citizens' Charter and Right to Public Services Acts mandate specific processing timelines.",
  },
  "domicile-certificate-in": {
    days: "7–30 days (varies by state)",
    law: "State Citizens' Charter and Right to Services Acts mandate processing timelines for domicile certificates.",
  },
};

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
  const statutory = STATUTORY_WINDOWS[formId];

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

      {statutory && (
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
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">{statutory.days}</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">{statutory.law}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Step-by-step escalation path</h2>

        <div className="space-y-3">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-5 flex gap-4">
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-8 h-8 font-bold shrink-0 text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Follow up in person or by phone</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Visit the Tehsil / SDM office or Common Service Centre (CSC) where you submitted. Bring your acknowledgement receipt and note down the officer's name and designation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-5 flex gap-4">
              <div className="flex items-center justify-center bg-amber-500 text-white rounded-full w-8 h-8 font-bold shrink-0 text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground">File an online grievance</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Use your state's CM Helpline or online grievance portal. File a complaint with your application number, submission date, and office name.
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                  <p className="font-medium text-foreground mb-1">Useful portals:</p>
                  <p>• National: <span className="font-mono">pgportal.gov.in</span></p>
                  <p>• Centralised Public Grievances: <span className="font-mono">cpgrams.gov.in</span></p>
                  <p>• Search: "[your state] CM helpline" or "[your state] e-grievance"</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-5 flex gap-4">
              <div className="flex items-center justify-center bg-orange-500 text-white rounded-full w-8 h-8 font-bold shrink-0 text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Escalate to the District Magistrate / Collector
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Write a formal complaint letter to the District Magistrate (DM) or District Collector's office. Include your application number, submission date, and the specific issue. This is a formal escalation that officers treat seriously.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-5 flex gap-4">
              <div className="flex items-center justify-center bg-red-500 text-white rounded-full w-8 h-8 font-bold shrink-0 text-sm">
                4
              </div>
              <div>
                <h3 className="font-semibold text-foreground">File an RTI request</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Under the <strong>Right to Information Act, 2005</strong>, you can formally request information on the status of your application. The department must respond within 30 days.
                </p>
                <div className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 space-y-1.5">
                  <p>File online at: <span className="font-mono">rtionline.gov.in</span></p>
                  <p className="text-foreground font-medium">Sample RTI subject:</p>
                  <p className="italic">
                    "Status of {session?.formName ?? "certificate"} application submitted on [date] at [office name]. Application reference number: [your number]."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardContent className="p-5 flex gap-4">
              <div className="flex items-center justify-center bg-purple-500 text-white rounded-full w-8 h-8 font-bold shrink-0 text-sm">
                5
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Seek free legal help from DLSA
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  The District Legal Services Authority (DLSA) provides free legal assistance to eligible citizens. They can advise on further steps, including approaching the courts if needed.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Find your DLSA: <span className="font-mono">nalsa.gov.in</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Scale className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Important disclaimer</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                QueueCutter provides document preparation support and general procedural information only. This escalation guide is not legal advice. For legal representation or complex disputes, consult a qualified legal professional or contact your District Legal Services Authority (DLSA) for free legal aid.
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
