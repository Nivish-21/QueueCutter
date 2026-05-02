import React, { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetSession, useGetForm } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Download, Timer, ArrowRight } from "lucide-react";

export default function ComparePage() {
  const params = useParams();
  const sessionId = params.sessionId!;

  const { data: session, isLoading: sessionLoading } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getSession", sessionId] },
  });

  const formId = session?.formId;
  const { data: form, isLoading: formLoading } = useGetForm(formId || "", {
    query: { enabled: !!formId, queryKey: ["getForm", formId] },
  });

  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!session?.createdAt) return;
    const start = new Date(session.createdAt).getTime();
    const update = () => {
      const mins = Math.round((Date.now() - start) / 60000);
      setElapsed(mins);
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [session?.createdAt]);

  if (sessionLoading || formLoading || !session || !form) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const answers = session.answers as Record<string, string>;

  const filledQuestions = form.questions.filter((q) => {
    const val = answers[q.id];
    return val && val.trim() !== "";
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/session/${sessionId}/preview`} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Before vs After</h1>
            <p className="text-muted-foreground text-sm">See how QueueCutter transformed this form</p>
          </div>
        </div>
        <a href={`/api/sessions/${sessionId}/pdf/download`} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </a>
      </div>

      {/* Timer Banner */}
      <div className="bg-primary text-primary-foreground rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <Timer className="h-6 w-6 shrink-0" />
          <div>
            <p className="text-xl font-bold">
              What used to take 3 visits now starts correctly in{" "}
              <span className="underline underline-offset-2">
                {elapsed <= 1 ? "under 1 minute" : `${elapsed} minutes`}
              </span>
              .
            </p>
          </div>
        </div>
        <div className="shrink-0 text-sm text-primary-foreground/80 font-medium">
          {filledQuestions.length} of {form.questions.length} fields filled
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-2 gap-0 rounded-xl overflow-hidden border border-border shadow-lg">
        {/* LEFT — Bureaucratic */}
        <div className="bg-gray-900 text-gray-100">
          <div className="bg-gray-800 px-5 py-4 border-b border-gray-700">
            <div className="text-[10px] tracking-[0.25em] text-gray-400 uppercase font-mono mb-1">OFFICIAL GOVERNMENT FORM</div>
            <div className="font-mono text-sm font-semibold text-gray-100">{form.officialName}</div>
          </div>
          <div className="divide-y divide-gray-800">
            {filledQuestions.map((q) => (
              <div key={q.id} className="px-5 py-3 space-y-0.5">
                <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{q.fieldMapping}</div>
                <div className="text-xs text-gray-300 font-mono leading-snug">{q.officialLabel}:</div>
                <div className="text-[10px] text-gray-600 font-mono border-b border-gray-700 pb-1">
                  {"_".repeat(30)}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 bg-gray-800 border-t border-gray-700">
            <p className="text-[9px] font-mono text-gray-500 text-center">
              FORM REF: {form.id.toUpperCase()} • FOR OFFICIAL USE ONLY
            </p>
          </div>
        </div>

        {/* RIGHT — Clean */}
        <div className="bg-white dark:bg-card">
          <div className="bg-primary/5 px-5 py-4 border-b border-primary/10">
            <div className="text-[10px] tracking-[0.2em] text-primary uppercase font-medium mb-1">YOUR PREPARED INFORMATION</div>
            <div className="font-semibold text-base text-foreground">{form.name}</div>
          </div>
          <div className="divide-y divide-border/40">
            {filledQuestions.map((q) => {
              const val = answers[q.id] || "";
              return (
                <div key={q.id} className="px-5 py-3 space-y-0.5">
                  <div className="text-xs text-muted-foreground">{q.text}</div>
                  <div className="text-sm font-medium text-foreground">
                    {val || <span className="text-muted-foreground italic">—</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground text-center">
              Prepared with QueueCutter — verify with official sources before submitting
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link href={`/session/${sessionId}/checklist`}>
          <Button size="lg" className="gap-2">
            Continue to Submission Guide
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={`/session/${sessionId}/preview`}>
          <Button variant="outline" size="lg">
            Back to Preview
          </Button>
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground/60">
        DRAFT — Prepared with QueueCutter. Verify accuracy before submission. QueueCutter is not an official government service.
      </p>
    </div>
  );
}
