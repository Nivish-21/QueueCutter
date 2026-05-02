import React from "react";
import { useParams, Link } from "wouter";
import { useGetWarnings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, AlertCircle, Info, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SessionWarnings() {
  const params = useParams();
  const sessionId = params.sessionId!;

  const { data: warningsData, isLoading } = useGetWarnings(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getWarnings", sessionId] }
  });

  if (isLoading || !warningsData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <Card><CardContent className="h-32 mt-6" /></Card>
        <Card><CardContent className="h-32 mt-6" /></Card>
      </div>
    );
  }

  const { warnings, errorCount, warningCount, infoCount } = warningsData;

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "error":
        return { 
          icon: AlertCircle, 
          color: "text-destructive", 
          bg: "bg-destructive/10", 
          border: "border-destructive/20",
          label: "Error" 
        };
      case "warning":
        return { 
          icon: AlertTriangle, 
          color: "text-amber-600 dark:text-amber-500", 
          bg: "bg-amber-50 dark:bg-amber-950/30", 
          border: "border-amber-200 dark:border-amber-900/50",
          label: "Warning" 
        };
      case "info":
      default:
        return { 
          icon: Info, 
          color: "text-blue-600 dark:text-blue-500", 
          bg: "bg-blue-50 dark:bg-blue-950/30", 
          border: "border-blue-200 dark:border-blue-900/50",
          label: "Info" 
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/session/${sessionId}/preview`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center text-sm font-medium">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Preview
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Review Warnings</h1>
          <p className="text-muted-foreground mt-2">
            We found {warnings.length} potential issues with your answers.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {errorCount > 0 && (
          <Badge variant="destructive" className="px-3 py-1 text-sm">
            {errorCount} Errors
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="outline" className="px-3 py-1 text-sm bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            {warningCount} Warnings
          </Badge>
        )}
        {infoCount > 0 && (
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            {infoCount} Info
          </Badge>
        )}
      </div>

      {warnings.length === 0 ? (
        <Card className="bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30">
          <CardContent className="p-12 text-center text-green-800 dark:text-green-400">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Everything looks correct!</h2>
            <p>We didn't find any issues with your application data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {warnings.map((warning) => {
            const config = getSeverityConfig(warning.severity);
            const Icon = config.icon;
            
            return (
              <Card key={warning.id} className={`${config.border} overflow-hidden`}>
                <div className={`${config.bg} px-4 py-3 border-b ${config.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <span className={`font-semibold ${config.color}`}>{config.label}</span>
                  </div>
                  <Badge variant="outline" className="capitalize bg-background/50">{warning.category}</Badge>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium text-foreground mb-1">{warning.message}</h4>
                      {warning.field && (
                        <p className="text-sm font-mono text-muted-foreground bg-muted/50 inline-block px-1.5 rounded">
                          Field: {warning.field}
                        </p>
                      )}
                    </div>
                    <div className="bg-muted/30 p-4 rounded-md border border-border/50">
                      <p className="text-sm font-medium text-foreground mb-1">Suggestion</p>
                      <p className="text-sm text-muted-foreground">{warning.suggestion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <Link href={`/session/${sessionId}/session`}>
          <Button variant="outline" className="mr-4">Fix Answers</Button>
        </Link>
        <Link href={`/session/${sessionId}/checklist`}>
          <Button>Proceed Anyway</Button>
        </Link>
      </div>
    </div>
  );
}
