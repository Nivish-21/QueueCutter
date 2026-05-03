import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetSession,
  useGetForm,
  useUpdateAnswers,
  useAiExplain,
  useAiInterpret,
  useListSessions,
} from "@workspace/api-client-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  HelpCircle,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  ClipboardCopy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AiExplainResult {
  explanation: string;
  whyWeAsk: string;
  commonMistakes: string[];
  example?: string;
}

interface AiInterpretResult {
  interpretedValue: string;
  confidence: "high" | "medium" | "low";
  explanation: string;
  needsClarification: boolean;
  clarificationPrompt?: string;
}

interface SimplifyResult {
  questionId: string;
  simplifiedText: string;
  simplifiedHint: string | null;
}

function getValidationError(pattern: string, label: string): string {
  if (pattern.includes("\\d{12}")) return "Must be exactly 12 digits (no spaces or dashes)";
  if (pattern.includes("[A-Z]{2}\\d{6}[A-Z]")) return "Format: two letters, six digits, one letter — e.g. AB123456C";
  if (pattern.includes("[6-9]\\d{9}")) return "Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9";
  if (pattern.includes("\\d{5}")) return "Must be a 5-digit ZIP code";
  if (pattern.includes("\\d{10}")) return "Must be a valid 10-digit phone number (digits only)";
  return `Please check the format for "${label}"`;
}

export default function SessionInterview() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getSession", sessionId] },
  });

  const formId = session?.formId;
  const { data: form, isLoading: formLoading } = useGetForm(formId || "", {
    query: { enabled: !!formId, queryKey: ["getForm", formId] },
  });

  const updateAnswers = useUpdateAnswers();
  const aiExplain = useAiExplain();
  const aiInterpret = useAiInterpret();

  const { data: sessionsData } = useListSessions({
    query: { queryKey: ["listSessions"], staleTime: 30000 },
  });

  const [autofillSourceId, setAutofillSourceId] = useState<string | null>(null);
  const [autofillApplied, setAutofillApplied] = useState(false);
  const [autofillDismissed, setAutofillDismissed] = useState(() => {
    try { return localStorage.getItem(`qc_af_${sessionId}`) === "1"; } catch { return false; }
  });
  const { data: autofillSessionData } = useGetSession(autofillSourceId ?? "", {
    query: { enabled: !!autofillSourceId, queryKey: ["getSession", autofillSourceId] },
  });
  const autofillSource = autofillSourceId && autofillSessionData
    ? (autofillSessionData.answers as Record<string, string>)
    : null;

  const aiSimplify = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/ai/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json() as Promise<SimplifyResult>;
    },
  });

  const [currentValue, setCurrentValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const [showExplain, setShowExplain] = useState(false);
  const [explainResult, setExplainResult] = useState<AiExplainResult | null>(null);
  const [interpretResult, setInterpretResult] = useState<AiInterpretResult | null>(null);
  const [interpretedInput, setInterpretedInput] = useState<string>("");

  const [showHindi, setShowHindi] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState<string | null>(null);
  const [simplifiedHint, setSimplifiedHint] = useState<string | null>(null);
  const simplifyCache = useRef<Map<string, SimplifyResult>>(new Map());

  useEffect(() => {
    if (!session || !form) return undefined;
    if (session.currentStep >= form.questions.length) {
      setShowCompletion(true);
      const timer = setTimeout(() => setLocation(`/session/${sessionId}/preview`), 2200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [session?.currentStep, form?.questions.length, sessionId, setLocation]);

  useEffect(() => {
    if (session && form) {
      const questions = form.questions;
      if (session.currentStep >= questions.length) return;
      const currentQuestion = questions[session.currentStep];
      if (currentQuestion) {
        setCurrentValue((session.answers as Record<string, string>)[currentQuestion.id] || "");
        setError(null);
        setShowExplain(false);
        setExplainResult(null);
        setInterpretResult(null);
        setInterpretedInput("");
        setSimplifiedText(null);
        setSimplifiedHint(null);
        setShowHindi(false);

        const persona = session.persona as unknown as Record<string, string> | null;
        const isConfused = persona?.comfort === "I find it confusing";
        const isOkay = persona?.comfort === "I manage okay";

        if ((isConfused || isOkay) && persona) {
          const cached = simplifyCache.current.get(currentQuestion.id);
          if (cached) {
            setSimplifiedText(cached.simplifiedText);
            setSimplifiedHint(cached.simplifiedHint);
          } else {
            aiSimplify.mutate(
              {
                questionId: currentQuestion.id,
                questionText: currentQuestion.text,
                hint: currentQuestion.hint,
                officialLabel: currentQuestion.officialLabel,
                formName: form.name,
                countryCode: form.countryCode,
                persona,
              },
              {
                onSuccess: (result) => {
                  simplifyCache.current.set(currentQuestion.id, result);
                  setSimplifiedText(result.simplifiedText);
                  setSimplifiedHint(result.simplifiedHint);
                },
              },
            );
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.currentStep, form?.id]);

  useEffect(() => {
    if (!session || !sessionsData?.sessions || autofillDismissed || autofillApplied) return;
    if (session.currentStep !== 0) return;
    const currentAnswers = session.answers as Record<string, string>;
    if (Object.keys(currentAnswers).length > 0) return;
    const source = sessionsData.sessions.find(
      (s) => s.formId === session.formId && s.status === "completed" && s.id !== session.id,
    );
    if (source) setAutofillSourceId(source.id);
  }, [session?.id, session?.formId, session?.currentStep, sessionsData?.sessions, autofillDismissed, autofillApplied]);

  if (sessionLoading || formLoading || !session || !form) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pt-12">
        <Skeleton className="h-2 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = form.questions;
  const currentStep = session.currentStep;

  if (currentStep >= questions.length || showCompletion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-700">
        <CheckCircle2 className="h-20 w-20 text-green-500 animate-in zoom-in duration-500" />
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">All questions complete!</h2>
          <p className="text-muted-foreground text-lg">Preparing your form review…</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const answers = session.answers as Record<string, string>;
  const isIndiaForm = form.countryCode === "IN";
  const hasHindi = isIndiaForm && !!(currentQuestion as unknown as Record<string, unknown>).hintHi;
  const hintHi = (currentQuestion as unknown as Record<string, unknown>).hintHi as string | undefined;

  if (currentQuestion.conditionalOn) {
    const conditionMet = answers[currentQuestion.conditionalOn.questionId] === currentQuestion.conditionalOn.value;
    if (!conditionMet) {
      updateAnswers.mutate(
        { sessionId, data: { answers, step: currentStep + 1 } },
        { onSuccess: () => refetchSession() },
      );
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  }

  const handleNext = () => {
    if (currentQuestion.required && !currentValue) {
      setError("This question is required.");
      return;
    }
    if (currentQuestion.validationPattern && currentValue) {
      const regex = new RegExp(currentQuestion.validationPattern);
      if (!regex.test(currentValue)) {
        setError(getValidationError(currentQuestion.validationPattern, currentQuestion.officialLabel));
        return;
      }
    }
    const newAnswers = { ...answers, [currentQuestion.id]: currentValue };
    updateAnswers.mutate(
      { sessionId, data: { answers: newAnswers, step: currentStep + 1 } },
      {
        onSuccess: () => refetchSession(),
        onError: () => toast({ title: "Error saving answer", variant: "destructive" }),
      },
    );
  };

  const handleBack = () => {
    if (currentStep > 0) {
      updateAnswers.mutate(
        { sessionId, data: { answers, step: currentStep - 1 } },
        { onSuccess: () => refetchSession() },
      );
    }
  };

  const handleJumpTo = (targetStep: number) => {
    if (targetStep === currentStep) return;
    const newAnswers = currentValue.trim()
      ? { ...answers, [currentQuestion.id]: currentValue }
      : answers;
    updateAnswers.mutate(
      { sessionId, data: { answers: newAnswers, step: targetStep } },
      { onSuccess: () => refetchSession() },
    );
  };

  const handleExplain = () => {
    if (showExplain && explainResult) {
      setShowExplain(false);
      return;
    }
    setShowExplain(true);
    if (explainResult) return;
    aiExplain.mutate(
      {
        data: {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          hint: currentQuestion.hint,
          formName: form.name,
          officialLabel: currentQuestion.officialLabel,
        },
      },
      {
        onSuccess: (result) => setExplainResult(result),
        onError: () => toast({ title: "Couldn't load explanation", variant: "destructive" }),
      },
    );
  };

  const handleInterpret = () => {
    if (!currentValue.trim()) {
      toast({ title: "Type something first, then I'll help interpret it." });
      return;
    }
    setInterpretedInput(currentValue);
    aiInterpret.mutate(
      {
        data: {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          questionType: currentQuestion.type,
          rawInput: currentValue,
          options: currentQuestion.options,
        },
      },
      {
        onSuccess: (result) => {
          setInterpretResult(result);
          if (!result.needsClarification) {
            setCurrentValue(result.interpretedValue);
          }
        },
        onError: () => toast({ title: "Couldn't interpret answer", variant: "destructive" }),
      },
    );
  };

  const handleAcceptInterpretation = () => {
    if (interpretResult) {
      setCurrentValue(interpretResult.interpretedValue);
      setInterpretResult(null);
    }
  };

  const confidenceColor = {
    high: "text-green-600 dark:text-green-400",
    medium: "text-amber-600 dark:text-amber-400",
    low: "text-red-600 dark:text-red-400",
  };
  const confidenceIcon = { high: CheckCircle2, medium: AlertCircle, low: AlertCircle };

  const canInterpret = ["text", "number", "textarea"].includes(currentQuestion.type);
  const displayText = simplifiedText || currentQuestion.text;
  const displayHint = showHindi && hintHi ? hintHi : (simplifiedHint || currentQuestion.hint);

  const renderInput = () => {
    switch (currentQuestion.type) {
      case "text":
        return (
          <Input
            autoFocus
            className="h-14 text-lg"
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); setError(null); setInterpretResult(null); }}
            placeholder="Type your answer here..."
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            className="h-14 text-lg"
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            className="h-14 text-lg"
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); setError(null); setInterpretResult(null); }}
            placeholder="0"
            onKeyDown={(e) => e.key === "Enter" && handleNext()}
          />
        );
      case "textarea":
        return (
          <Textarea
            autoFocus
            className="min-h-[120px] text-lg resize-none"
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); setError(null); setInterpretResult(null); }}
            placeholder="Type your answer here..."
          />
        );
      case "yesno":
        return (
          <div className="grid grid-cols-2 gap-4">
            <Button variant={currentValue === "yes" ? "default" : "outline"} className="h-16 text-lg border-2" onClick={() => { setCurrentValue("yes"); setError(null); }}>Yes</Button>
            <Button variant={currentValue === "no" ? "default" : "outline"} className="h-16 text-lg border-2" onClick={() => { setCurrentValue("no"); setError(null); }}>No</Button>
          </div>
        );
      case "radio":
        return (
          <RadioGroup value={currentValue} onValueChange={(v) => { setCurrentValue(v); setError(null); }} className="space-y-3">
            {currentQuestion.options?.map((opt) => (
              <div key={opt} className="flex items-center space-x-3 bg-muted/30 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={opt} id={`opt-${opt}`} className="w-5 h-5" />
                <Label htmlFor={`opt-${opt}`} className="text-base flex-1 cursor-pointer">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "select":
        return (
          <Select value={currentValue} onValueChange={(v) => { setCurrentValue(v); setError(null); }}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {currentQuestion.options?.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-base py-3">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round((currentStep / questions.length) * 100)}% completed</span>
        </div>
        <Progress value={(currentStep / questions.length) * 100} className="h-2" />

        {/* Question navigator */}
        <div className="flex gap-1 flex-wrap justify-center pt-1">
          {questions.map((q, i) => {
            const isAnswered = !!(answers[q.id] && (answers[q.id] as string).trim());
            const isCurrent = i === currentStep;
            return (
              <button
                key={i}
                onClick={() => handleJumpTo(i)}
                disabled={updateAnswers.isPending}
                title={`${i + 1}. ${q.officialLabel}`}
                aria-label={`Go to question ${i + 1}: ${q.officialLabel}`}
                className={`w-6 h-6 rounded-full text-[10px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-110"
                    : isAnswered
                      ? "bg-green-500 text-white hover:scale-110 cursor-pointer"
                      : "bg-muted text-muted-foreground/40 cursor-default"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {autofillSource && !autofillDismissed && (
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <ClipboardCopy className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Previous answers found</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                Copy {Object.keys(autofillSource).length} answers from your last {form.name} — you can review and edit each one before submitting.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                disabled={updateAnswers.isPending}
                onClick={() => {
                  updateAnswers.mutate(
                    { sessionId, data: { answers: autofillSource, step: 0 } },
                    {
                      onSuccess: () => {
                        setAutofillApplied(true);
                        setAutofillSourceId(null);
                        refetchSession();
                        toast({ title: "Answers copied — review each question and edit as needed." });
                      },
                    },
                  );
                }}
              >
                {updateAnswers.isPending
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <ClipboardCopy className="h-3 w-3" />}
                Copy previous answers
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                onClick={() => {
                  setAutofillDismissed(true);
                  setAutofillSourceId(null);
                  try { localStorage.setItem(`qc_af_${sessionId}`, "1"); } catch { /* ignore */ }
                }}
              >
                Start fresh
              </Button>
            </div>
          </div>
          <button
            className="shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors"
            onClick={() => {
              setAutofillDismissed(true);
              setAutofillSourceId(null);
              try { localStorage.setItem(`qc_af_${sessionId}`, "1"); } catch { /* ignore */ }
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Card className="border-0 shadow-lg bg-card overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-8 pt-10 px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              {simplifiedText && simplifiedText !== currentQuestion.text && (
                <div className="text-xs text-primary/70 flex items-center gap-1 mb-2">
                  <Sparkles className="h-3 w-3" />
                  <span>Simplified for you</span>
                </div>
              )}
              <h2 className="text-3xl font-semibold text-foreground leading-tight">
                {displayText}
              </h2>
              {simplifiedText && simplifiedText !== currentQuestion.text && (
                <div className="text-xs text-muted-foreground mt-1">
                  Official: <span className="font-mono">{currentQuestion.officialLabel}</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-muted-foreground hover:text-primary gap-1.5 -mt-1"
              onClick={handleExplain}
              disabled={aiExplain.isPending}
            >
              {aiExplain.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <HelpCircle className="h-4 w-4" />}
              Help
            </Button>
          </div>

          {displayHint && (
            <div className="flex items-center justify-between gap-2 mt-4">
              <p className="text-lg text-muted-foreground leading-relaxed flex-1">
                {displayHint}
              </p>
              {hasHindi && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs gap-1 text-muted-foreground"
                  onClick={() => setShowHindi(!showHindi)}
                >
                  {showHindi ? "EN" : "हि"}
                </Button>
              )}
            </div>
          )}
          {!displayHint && hasHindi && (
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs gap-1 text-muted-foreground"
                onClick={() => setShowHindi(!showHindi)}
              >
                {showHindi ? "🇺🇸 EN" : "🇮🇳 हि"}
              </Button>
            </div>
          )}
        </CardHeader>

        {showExplain && (
          <div className="border-b border-border/60 bg-blue-50/60 dark:bg-blue-950/20 px-8 py-5 animate-in slide-in-from-top-2 duration-300">
            {aiExplain.isPending ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm">Getting AI explanation...</span>
              </div>
            ) : explainResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-medium text-sm">
                    <Sparkles className="h-4 w-4" />
                    AI Copilot
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowExplain(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{explainResult.explanation}</p>
                <div className="bg-background/70 rounded-md p-3 border border-border/50">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{explainResult.whyWeAsk}</p>
                  </div>
                </div>
                {explainResult.commonMistakes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Common mistakes to avoid</p>
                    <ul className="space-y-1">
                      {explainResult.commonMistakes.map((m, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 shrink-0">•</span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {explainResult.example && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 font-medium text-foreground">Example:</span>
                    <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded">{explainResult.example}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        <CardContent className="p-8">
          <div className="space-y-4">
            {renderInput()}

            {canInterpret && (
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary gap-1.5 px-0"
                  onClick={handleInterpret}
                  disabled={aiInterpret.isPending || !currentValue.trim()}
                >
                  {aiInterpret.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {aiInterpret.isPending ? "Interpreting..." : "Clean up my answer with AI"}
                </Button>
              </div>
            )}

            {interpretResult && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3 animate-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI Interpretation</span>
                    {(() => {
                      const Icon = confidenceIcon[interpretResult.confidence];
                      return (
                        <Badge variant="outline" className={`text-xs gap-1 ${confidenceColor[interpretResult.confidence]}`}>
                          <Icon className="h-3 w-3" />
                          {interpretResult.confidence} confidence
                        </Badge>
                      );
                    })()}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setInterpretResult(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">You typed:</p>
                  <p className="text-sm font-mono bg-background/70 border border-border/50 px-2 py-1 rounded">{interpretedInput}</p>
                </div>

                {!interpretResult.needsClarification ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cleaned up to:</p>
                    <p className="text-sm font-mono font-medium bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 px-2 py-1 rounded text-green-800 dark:text-green-300">
                      {interpretResult.interpretedValue}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">{interpretResult.explanation}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="default" className="gap-1.5 text-xs h-8" onClick={handleAcceptInterpretation}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Use this value
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => setInterpretResult(null)}>
                        Keep my original
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Needs clarification</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{interpretResult.clarificationPrompt}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-destructive font-medium text-sm animate-in slide-in-from-top-1">{error}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-8 py-6 bg-muted/20 border-t border-border/40 flex justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBack}
            disabled={currentStep === 0 || updateAnswers.isPending}
            className="text-muted-foreground"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>

          <Button
            size="lg"
            onClick={handleNext}
            disabled={updateAnswers.isPending}
            className="px-8 text-base h-12"
          >
            {updateAnswers.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {currentStep === questions.length - 1 ? "Review Answers" : "Next"}
            {!updateAnswers.isPending && currentStep !== questions.length - 1 && <ChevronRight className="ml-2 h-5 w-5" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
