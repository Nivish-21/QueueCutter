import React from "react";
import { Link, useParams, useLocation } from "wouter";
import { useGetForm, useCreateSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Clock, MapPin, DollarSign, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FormDetail() {
  const params = useParams();
  const formId = params.formId!;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: form, isLoading, isError } = useGetForm(formId, { 
    query: { enabled: !!formId, queryKey: ["getForm", formId] } 
  });

  const createSession = useCreateSession();

  const handleStart = () => {
    createSession.mutate(
      { data: { formId } },
      {
        onSuccess: (session) => {
          setLocation(`/persona/${session.id}`);
        },
        onError: () => {
          toast({
            title: "Error starting session",
            description: "Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-2/3 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="text-center space-y-4 py-12">
        <h2 className="text-2xl font-semibold">Form not found</h2>
        <Link href="/">
          <Button variant="outline">Return home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to forms
      </Link>

      <Card className="border-primary/20 overflow-hidden shadow-sm">
        <div className="bg-primary/5 px-6 py-8 border-b border-primary/10">
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground mb-4">
                {form.officialName}
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{form.name}</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {form.longDescription}
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-8">
          <div className="grid sm:grid-cols-3 gap-6 pt-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-primary font-medium gap-2">
                <Clock className="h-5 w-5" />
                Time
              </div>
              <div className="text-sm text-muted-foreground">Takes ~{Math.ceil(form.questions.length * 1.5)} minutes to complete. Processing takes {form.processingTime}.</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-primary font-medium gap-2">
                <DollarSign className="h-5 w-5" />
                Fee
              </div>
              <div className="text-sm text-muted-foreground">{form.fee}</div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center text-primary font-medium gap-2">
                <MapPin className="h-5 w-5" />
                Submit to
              </div>
              <div className="text-sm text-muted-foreground">{form.submissionOffice}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">What you'll need</h3>
            <ul className="space-y-3 bg-muted/30 p-6 rounded-lg border border-border/50">
              {form.requiredDocuments.map((doc, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground leading-relaxed">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-6">
              {form.disclaimer}
            </p>
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-14 px-8 text-lg font-medium"
              onClick={handleStart}
              disabled={createSession.isPending}
            >
              {createSession.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Application"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
