import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetChecklist, useGeneratePdf } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Download, MapPin, DollarSign, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SessionChecklist() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const { toast } = useToast();

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const { data: checklist, isLoading } = useGetChecklist(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getChecklist", sessionId] },
  });

  const generatePdf = useGeneratePdf();

  const handleDownload = () => {
    generatePdf.mutate(
      { sessionId },
      {
        onSuccess: () => {
          window.open(`/api/sessions/${sessionId}/pdf/download`, "_blank");
          toast({ title: "Download started", description: "Your filled form is ready." });
        },
        onError: () => {
          toast({ title: "Generation failed", description: "Could not generate your PDF. Please try again.", variant: "destructive" });
        },
      },
    );
  };

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading || !checklist) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div><Skeleton className="h-96 w-full" /></div>
        </div>
      </div>
    );
  }

  const carryItems = checklist.items.filter((i) => i.category === "carry");
  const verifyItems = checklist.items.filter((i) => i.category === "verify");
  const nextItems = checklist.items.filter((i) => i.category === "do_next");
  const riskItems = checklist.items.filter((i) => i.rejectionRisk);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/session/${sessionId}/preview`} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm font-medium text-primary">Final Steps</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Your Submission Guide</h1>
          <p className="text-muted-foreground mt-2">
            Follow these steps to submit your {checklist.formName} form successfully.
          </p>
        </div>
      </div>

      {checklist.warnings.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200">
          <AlertTitle className="font-semibold">Important Notes</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {checklist.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {riskItems.length > 0 && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-300 font-semibold">
            {riskItems.length} high-rejection-risk item{riskItems.length !== 1 ? "s" : ""} — pay close attention
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400 mt-1">
            Items marked <Badge className="bg-red-100 text-red-800 border border-red-300 text-[10px] h-4 px-1 mx-1">Rejection Risk</Badge> are commonly missed and frequently cause applications to be rejected.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">

          {/* Step 1: Download */}
          <Card className="border-primary/20 shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex items-center gap-3">
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-8 h-8 font-bold shrink-0">1</div>
              <CardTitle className="text-xl">Download and print your prepared form</CardTitle>
            </div>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4 text-sm">
                Your answers have been mapped to the official form fields. Download, review carefully, and sign where indicated.
              </p>
              <p className="text-xs text-muted-foreground mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded p-2">
                DRAFT — Prepared with QueueCutter. Verify accuracy before submission. QueueCutter is not an official government service.
              </p>
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg shadow-md"
                onClick={handleDownload}
                disabled={generatePdf.isPending}
              >
                <Download className="mr-2 h-5 w-5" />
                {generatePdf.isPending ? "Generating PDF..." : "Download Completed Form"}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Gather Documents */}
          {carryItems.length > 0 && (
            <Card className="shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex items-center gap-3">
                <div className="flex items-center justify-center bg-muted-foreground text-background rounded-full w-8 h-8 font-bold shrink-0">2</div>
                <CardTitle className="text-xl">Bring on the day — required documents</CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {carryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 flex items-start gap-4 transition-colors ${checkedItems[item.id] ? "bg-primary/5" : item.rejectionRisk ? "bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50" : "hover:bg-muted/20"}`}
                    >
                      <Checkbox
                        id={item.id}
                        checked={!!checkedItems[item.id]}
                        onCheckedChange={() => toggleCheck(item.id)}
                        className="mt-1 h-5 w-5"
                      />
                      <div className="grid gap-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label
                            htmlFor={item.id}
                            className={`text-base leading-snug cursor-pointer ${checkedItems[item.id] ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}
                          >
                            {item.text}
                          </Label>
                          {item.rejectionRisk && !checkedItems[item.id] && (
                            <Badge className="bg-red-100 text-red-800 border border-red-300 text-[10px] h-4 px-1 shrink-0">
                              Rejection Risk
                            </Badge>
                          )}
                        </div>
                        {item.note && (
                          <p className={`text-sm ${checkedItems[item.id] ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Verify */}
          {verifyItems.length > 0 && (
            <Card className="shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex items-center gap-3">
                <div className="flex items-center justify-center bg-muted-foreground text-background rounded-full w-8 h-8 font-bold shrink-0">3</div>
                <CardTitle className="text-xl">Prepare in advance — verify these</CardTitle>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {verifyItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 flex items-start gap-4 transition-colors ${checkedItems[item.id] ? "bg-primary/5" : item.rejectionRisk ? "bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50" : "hover:bg-muted/20"}`}
                    >
                      <Checkbox
                        id={item.id}
                        checked={!!checkedItems[item.id]}
                        onCheckedChange={() => toggleCheck(item.id)}
                        className="mt-1 h-5 w-5"
                      />
                      <div className="grid gap-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Label
                            htmlFor={item.id}
                            className={`text-base leading-snug cursor-pointer ${checkedItems[item.id] ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}
                          >
                            {item.text}
                          </Label>
                          {item.rejectionRisk && !checkedItems[item.id] && (
                            <Badge className="bg-red-100 text-red-800 border border-red-300 text-[10px] h-4 px-1 shrink-0">
                              Rejection Risk
                            </Badge>
                          )}
                        </div>
                        {item.note && (
                          <p className={`text-sm ${checkedItems[item.id] ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Submission Steps */}
          {checklist.submissionSteps.length > 0 && (
            <Card className="shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex items-center gap-3">
                <div className="flex items-center justify-center bg-muted-foreground text-background rounded-full w-8 h-8 font-bold shrink-0">4</div>
                <CardTitle className="text-xl">What happens next</CardTitle>
              </div>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {checklist.submissionSteps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center bg-primary/10 text-primary rounded-full w-8 h-8 font-semibold shrink-0">
                          {step.step}
                        </div>
                        {i < checklist.submissionSteps.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="pb-6">
                        <h4 className="text-lg font-medium text-foreground">{step.title}</h4>
                        <p className="mt-1 text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Key Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <DollarSign className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Filing Fee</p>
                  <p className="text-sm text-muted-foreground">{checklist.fee}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Processing Time</p>
                  <p className="text-sm text-muted-foreground">{checklist.processingTime}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Submission Office</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{checklist.submissionOffice}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex flex-col gap-2">
              {nextItems.some((i) => i.id === "next_escalation_guide") && (
                <Link href={`/session/${sessionId}/escalation`} className="w-full">
                  <Button variant="outline" className="w-full text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30 gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Escalation Guide
                  </Button>
                </Link>
              )}
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">Return Home</Button>
              </Link>
            </CardFooter>
          </Card>

          {checklist.disclaimer && (
            <div className="bg-muted/40 border border-border/50 rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1">Important</p>
              {checklist.disclaimer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
