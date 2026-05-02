import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetSession, useGetForm, useUpdateAnswers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SessionInterview() {
  const params = useParams();
  const sessionId = params.sessionId!;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useGetSession(sessionId, {
    query: { enabled: !!sessionId, queryKey: ["getSession", sessionId] }
  });

  const formId = session?.formId;
  const { data: form, isLoading: formLoading } = useGetForm(formId || "", {
    query: { enabled: !!formId, queryKey: ["getForm", formId] }
  });

  const updateAnswers = useUpdateAnswers();
  
  const [currentValue, setCurrentValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session && form) {
      const questions = form.questions;
      if (session.currentStep >= questions.length) {
        setLocation(`/session/${sessionId}/preview`);
        return;
      }
      
      const currentQuestion = questions[session.currentStep];
      if (currentQuestion) {
        setCurrentValue(session.answers[currentQuestion.id] || "");
        setError(null);
      }
    }
  }, [session, form, setLocation, sessionId]);

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

  // Handle redirect if complete
  if (currentStep >= questions.length) {
    return null;
  }

  const currentQuestion = questions[currentStep];
  
  // Skip conditional questions if condition is not met
  if (currentQuestion.conditionalOn) {
    const conditionMet = session.answers[currentQuestion.conditionalOn.questionId] === currentQuestion.conditionalOn.value;
    if (!conditionMet) {
      // Auto-skip this step
      updateAnswers.mutate({
        sessionId,
        data: { answers: session.answers, step: currentStep + 1 }
      }, {
        onSuccess: () => refetchSession()
      });
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
        setError("Please enter a valid format.");
        return;
      }
    }

    const newAnswers = { ...session.answers, [currentQuestion.id]: currentValue };
    
    updateAnswers.mutate({
      sessionId,
      data: { answers: newAnswers, step: currentStep + 1 }
    }, {
      onSuccess: () => refetchSession(),
      onError: () => toast({ title: "Error saving answer", variant: "destructive" })
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      updateAnswers.mutate({
        sessionId,
        data: { answers: session.answers, step: currentStep - 1 }
      }, {
        onSuccess: () => refetchSession()
      });
    }
  };

  const renderInput = () => {
    switch (currentQuestion.type) {
      case "text":
        return (
          <Input 
            autoFocus
            className="h-14 text-lg"
            value={currentValue}
            onChange={(e) => { setCurrentValue(e.target.value); setError(null); }}
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
            onChange={(e) => { setCurrentValue(e.target.value); setError(null); }}
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
            onChange={(e) => { setCurrentValue(e.target.value); setError(null); }}
            placeholder="Type your answer here..."
          />
        );
      case "yesno":
        return (
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={currentValue === "yes" ? "default" : "outline"}
              className="h-16 text-lg border-2"
              onClick={() => { setCurrentValue("yes"); setError(null); }}
            >
              Yes
            </Button>
            <Button
              variant={currentValue === "no" ? "default" : "outline"}
              className="h-16 text-lg border-2"
              onClick={() => { setCurrentValue("no"); setError(null); }}
            >
              No
            </Button>
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
    <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round((currentStep / questions.length) * 100)}% completed</span>
        </div>
        <Progress value={(currentStep / questions.length) * 100} className="h-2" />
      </div>

      <Card className="border-0 shadow-lg bg-card overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-8 pt-10 px-8">
          <h2 className="text-3xl font-semibold text-foreground leading-tight">
            {currentQuestion.text}
          </h2>
          {currentQuestion.hint && (
            <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
              {currentQuestion.hint}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="space-y-4">
            {renderInput()}
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
