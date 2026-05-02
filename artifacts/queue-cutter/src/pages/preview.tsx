import React from "react";
import { useParams, Link } from "wouter";
import { useGetPreview, useGetWarnings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, FileText, ChevronRight, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function SessionPreview() {
  const params = useParams();
  const sessionId = params.sessionId!;

  const { data: preview, isLoading: previewLoading } = useGetPreview(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getPreview", sessionId] }
  });

  const { data: warningsData, isLoading: warningsLoading } = useGetWarnings(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getWarnings", sessionId] }
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review your answers</h1>
          <p className="text-muted-foreground mt-2">
            Here's how your answers will appear on the official {preview.formName} form.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
        <div className="md:col-span-1 space-y-6">
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
                <Badge variant={warningsData.warningCount > 0 ? "default" : "secondary"} className={warningsData.warningCount > 0 ? "bg-amber-500 hover:bg-amber-600" : ""}>
                  {warningsData.warningCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {!hasIssues && (
            <Card className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
              <CardContent className="pt-6 flex flex-col items-center text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <div className="font-medium">Looks good!</div>
                <p className="text-sm">All required fields are filled out and no warnings were found.</p>
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
                <div key={i} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${field.isEmpty ? 'bg-destructive/5' : 'hover:bg-muted/30'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{field.officialLabel}</span>
                      {field.isEmpty && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Missing</Badge>}
                      {field.source === "inferred" && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Inferred</Badge>}
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
