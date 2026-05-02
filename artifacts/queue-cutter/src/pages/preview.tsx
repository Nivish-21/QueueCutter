import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetPreview, useGetWarnings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, FileText, ChevronRight, AlertCircle, Info, BarChart3, SplitSquareHorizontal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface RiskFactor {
  description: string;
  impact: number;
  category: string;
}

interface RiskScoreResult {
  sessionId: string;
  score: number;
  level: "low" | "medium" | "high";
  headline: string;
  factors: RiskFactor[];
  disclaimer: string;
}

export default function SessionPreview() {
  const params = useParams();
  const sessionId = params.sessionId!;

  const { data: preview, isLoading: previewLoading } = useGetPreview(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getPreview", sessionId] },
  });

  const { data: warningsData, isLoading: warningsLoading } = useGetWarnings(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getWarnings", sessionId] },
  });

  const { data: riskScore, isLoading: riskLoading } = useQuery<RiskScoreResult>({
    queryKey: ["riskScore", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}/risk-score`);
      return res.json() as Promise<RiskScoreResult>;
    },
    enabled: !!sessionId,
  });

  if (previewLoading || warningsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!preview || !warningsData) {
    return <div>Failed to load preview data.</div>;
  }

  const hasIssues = warningsData.errorCount > 0 || preview.missingCount > 0;

  const riskColor = riskScore
    ? riskScore.level === "low"
      ? "bg-green-500"
      : riskScore.level === "medium"
        ? "bg-amber-500"
        : "bg-red-500"
    : "bg-gray-300";

  const riskTextColor = riskScore
    ? riskScore.level === "low"
      ? "text-green-700 dark:text-green-400"
      : riskScore.level === "medium"
        ? "text-amber-700 dark:text-amber-400"
        : "text-red-700 dark:text-red-400"
    : "text-muted-foreground";

  const riskBg = riskScore
    ? riskScore.level === "low"
      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/40"
      : riskScore.level === "medium"
        ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40"
        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40"
    : "bg-muted border-border";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review your answers</h1>
          <p className="text-muted-foreground mt-2">
            Here's how your answers will appear on the official {preview.formName} form.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link href={`/session/${sessionId}/compare`}>
            <Button variant="outline" size="lg" className="h-12 px-5 gap-2">
              <SplitSquareHorizontal className="h-4 w-4" />
              Compare View
            </Button>
          </Link>
          <Link href={`/session/${sessionId}/checklist`}>
            <Button size="lg" className="h-12 px-6">
              Continue to Checklist
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {hasIssues && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Please review carefully</AlertTitle>
          <AlertDescription className="mt-2 text-base">
            You have {preview.missingCount} missing fields and {warningsData.errorCount} warnings.
            <div className="mt-4">
              <Link href={`/session/${sessionId}/warnings`}>
                <Button variant="destructive" size="sm">View all warnings</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          {/* Form Status */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Form Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium text-lg">{preview.completionPercent}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Missing</span>
                <Badge variant={preview.missingCount > 0 ? "destructive" : "secondary"}>
                  {preview.missingCount}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Warnings</span>
                <Badge
                  variant={warningsData.warningCount > 0 ? "default" : "secondary"}
                  className={warningsData.warningCount > 0 ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  {warningsData.warningCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Rejection Risk Score */}
          {riskLoading ? (
            <Card>
              <CardHeader className="pb-2"><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ) : riskScore ? (
            <Card className={`border ${riskBg}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className={`h-4 w-4 ${riskTextColor}`} />
                  <CardTitle className={`text-sm font-medium ${riskTextColor}`}>Rejection Risk</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Gauge */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Safe</span>
                    <span className={`font-bold text-sm ${riskTextColor}`}>{riskScore.score}/100</span>
                    <span>High risk</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${riskColor}`}
                      style={{ width: `${riskScore.score}%` }}
                    />
                  </div>
                </div>

                <p className={`text-sm font-medium leading-snug ${riskTextColor}`}>
                  {riskScore.headline}
                </p>

                {riskScore.factors.length > 0 && (
                  <div className="space-y-1.5">
                    {riskScore.factors.slice(0, 4).map((f, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className={`shrink-0 mt-0.5 ${riskTextColor}`}>•</span>
                        <span className="leading-snug">{f.description}</span>
                      </div>
                    ))}
                    {riskScore.factors.length > 4 && (
                      <p className="text-xs text-muted-foreground pl-3">
                        +{riskScore.factors.length - 4} more issues
                      </p>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/60 leading-snug border-t border-border/40 pt-2">
                  {riskScore.disclaimer}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {!hasIssues && riskScore?.level === "low" && (
            <Card className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <div className="font-medium">Looks great!</div>
                <p className="text-sm">All required fields are filled and risk is low.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader className="border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Field Mapping Preview</CardTitle>
              </div>
              <CardDescription>Official form fields mapped from your answers</CardDescription>
            </CardHeader>
            <div className="divide-y divide-border/40">
              {preview.mappedFields.map((field, i) => (
                <div
                  key={i}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${field.isEmpty ? "bg-destructive/5" : "hover:bg-muted/30"}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{field.officialLabel}</span>
                      {field.isEmpty && (
                        <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Missing</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-muted/50 inline-block px-1.5 rounded">
                      {field.fieldName}
                    </div>
                  </div>
                  <div className="flex-1 sm:text-right">
                    {field.isEmpty ? (
                      <span className="text-destructive text-sm font-medium flex items-center sm:justify-end gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Required field empty
                      </span>
                    ) : (
                      <span className="text-base text-foreground bg-background border border-border/50 px-3 py-1.5 rounded-md inline-block min-w-[200px] text-left break-all">
                        {field.value}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
