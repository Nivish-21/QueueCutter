import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSession } from "@workspace/api-client-react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Loader2, UserCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Persona {
  role: string;
  priorExperience: string;
  comfort: string;
}

const QUESTIONS = [
  {
    key: "role" as const,
    title: "What describes you best?",
    subtitle: "We'll adjust the experience to suit you.",
    options: [
      "Student",
      "Working Professional",
      "Self-Employed",
      "Senior Citizen",
      "Unemployed",
      "Other",
    ],
  },
  {
    key: "priorExperience" as const,
    title: "Have you applied for this type of form before?",
    subtitle: "This helps us warn you about common mistakes.",
    options: [
      "First time",
      "Applied before but it was rejected",
      "Applied before and got it",
      "Not sure",
    ],
  },
  {
    key: "comfort" as const,
    title: "How comfortable are you with paperwork?",
    subtitle: "No wrong answer — we'll adjust how we explain things.",
    options: [
      "I find it confusing",
      "I manage okay",
      "I'm comfortable with it",
    ],
  },
];

export default function PersonaPage() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const [, setLocation] = useLocation();

  const { data: session, isLoading } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getSession", sessionId] },
  });

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Persona>>({});
  const [current, setCurrent] = useState("");

  const savePersona = useMutation({
    mutationFn: async (persona: Persona) => {
      const res = await fetch(`/api/sessions/${sessionId}/persona`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persona),
      });
      return res.json();
    },
    onSuccess: () => {
      setLocation(`/session/${sessionId}`);
    },
  });

  const handleNext = () => {
    if (!current) return;
    const q = QUESTIONS[step];
    const updated = { ...answers, [q.key]: current };
    setAnswers(updated);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      setCurrent("");
    } else {
      savePersona.mutate(updated as Persona);
    }
  };

  const handleSkip = () => {
    setLocation(`/session/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto pt-12 space-y-6">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const q = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <UserCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Quick setup — just 3 questions</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {step + 1} of {QUESTIONS.length}</span>
          <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground underline underline-offset-2 text-xs">
            Skip setup →
          </button>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {session && (
        <p className="text-sm text-muted-foreground text-center">
          Getting ready for: <span className="font-medium text-foreground">{session.formName}</span>
        </p>
      )}

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6 pt-8 px-8">
          <CardTitle className="text-2xl font-semibold leading-snug">{q.title}</CardTitle>
          <CardDescription className="text-base mt-2">{q.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <RadioGroup value={current} onValueChange={setCurrent} className="space-y-3">
            {q.options.map((opt) => (
              <div
                key={opt}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  current === opt
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40"
                }`}
                onClick={() => setCurrent(opt)}
              >
                <RadioGroupItem value={opt} id={`opt-${opt}`} className="w-4 h-4" />
                <Label htmlFor={`opt-${opt}`} className="text-base cursor-pointer flex-1">
                  {opt}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={handleSkip}
        >
          Skip for now
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!current || savePersona.isPending}
          className="px-8"
        >
          {savePersona.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          {step < QUESTIONS.length - 1 ? "Next" : "Start filling the form"}
          {step < QUESTIONS.length - 1 && !savePersona.isPending && (
            <ChevronRight className="ml-2 h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
