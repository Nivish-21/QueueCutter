import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronRight, Clock, PlayCircle, CheckCircle2, Trash2, Eye } from "lucide-react";
import { useListSessions } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    description: "Social Security, SNAP benefits, address changes, and federal forms",
    color: "from-blue-50 to-red-50 dark:from-blue-950/20 dark:to-red-950/20",
    border: "hover:border-blue-400",
  },
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    description: "Income certificates, domicile certificates, and state government forms",
    color: "from-orange-50 to-green-50 dark:from-orange-950/20 dark:to-green-950/20",
    border: "hover:border-orange-400",
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    description: "Council Tax Reduction, DWP proof of address, and benefits forms",
    color: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
    border: "hover:border-indigo-400",
  },
];

const COUNTRY_FLAGS: Record<string, string> = { US: "🇺🇸", IN: "🇮🇳", GB: "🇬🇧" };

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessionsData } = useListSessions({
    query: { queryKey: ["listSessions"], staleTime: 15000 },
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listSessions"] });
      toast({ title: "Session removed" });
    },
    onError: () => {
      toast({ title: "Could not remove session", variant: "destructive" });
    },
  });

  const allSessions = sessionsData?.sessions ?? [];
  const inProgress = allSessions
    .filter((s) => s.status === "in_progress")
    .slice(0, 3);

  const recentlyCompleted = allSessions
    .filter((s) => {
      if (s.status !== "completed") return false;
      const age = Date.now() - new Date(s.updatedAt).getTime();
      return age < 7 * 24 * 60 * 60 * 1000;
    })
    .slice(0, 3);

  const hasResume = inProgress.length > 0 || recentlyCompleted.length > 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4 text-center py-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Government paperwork, <span className="text-primary">simplified.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We turn confusing government forms into a simple step-by-step conversation. Choose your country to get started.
        </p>
        <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto">
          QueueCutter provides document preparation support — not legal or benefits advice. Always verify requirements with your local office.
        </p>
      </section>

      {hasResume && (
        <section className="space-y-5 max-w-4xl mx-auto">
          {inProgress.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">Continue where you left off</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {inProgress.map((s) => (
                  <Card key={s.id} className="border-primary/20 hover:border-primary/40 transition-all duration-200 bg-primary/3 group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">{COUNTRY_FLAGS[s.countryCode] ?? ""}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 h-4 border-primary/30 text-primary">
                              In progress
                            </Badge>
                          </div>
                          <p className="font-medium text-sm text-foreground leading-snug line-clamp-2">{s.formName}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              title="Remove session"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove this session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your progress for <strong>{s.formName}</strong>. Your answers will be lost and cannot be recovered.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep it</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteSession.mutate(s.id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{s.completionPercent}% complete</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(s.updatedAt)}
                          </span>
                        </div>
                        <Progress value={s.completionPercent} className="h-1.5" />
                      </div>
                      <Link href={`/session/${s.id}`}>
                        <Button size="sm" className="w-full h-8 text-xs gap-1">
                          Continue
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recentlyCompleted.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">Recently completed</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {recentlyCompleted.map((s) => (
                  <Card key={s.id} className="border-green-200/50 dark:border-green-900/30 bg-green-50/30 dark:bg-green-950/10 group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">{COUNTRY_FLAGS[s.countryCode] ?? ""}</span>
                            <Badge className="text-[10px] px-1.5 h-4 bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300">
                              Complete
                            </Badge>
                          </div>
                          <p className="font-medium text-sm text-foreground leading-snug line-clamp-2">{s.formName}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              title="Remove session"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove this completed session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete your completed session for <strong>{s.formName}</strong>. Make sure you have already downloaded your PDF before removing.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep it</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteSession.mutate(s.id)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Completed {formatRelativeTime(s.updatedAt)}
                      </p>
                      <div className="flex gap-2">
                        <Link href={`/session/${s.id}/checklist`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1 border-green-300 dark:border-green-800">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/session/${s.id}/preview`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full h-8 text-xs gap-1">
                            Review
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
          )}
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-center">Choose your country</h2>
        <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
          {COUNTRIES.map((country) => (
            <Link key={country.code} href={`/catalog/${country.code}`} className="block">
              <Card className={`flex flex-col cursor-pointer border-2 transition-all duration-200 ${country.border} hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br ${country.color}`}>
                <CardHeader className="pb-3 text-center">
                  <div className="text-6xl mb-3">{country.flag}</div>
                  <CardTitle className="text-2xl">{country.name}</CardTitle>
                  <CardDescription className="text-sm mt-1">{country.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-6 flex justify-center">
                  <Button variant="outline" className="gap-2">
                    View forms
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="text-center py-6">
        <div className="inline-block bg-muted/50 border border-border/50 rounded-lg px-6 py-4 max-w-2xl text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">About QueueCutter</p>
          <p>
            QueueCutter is an independent document preparation tool. We help you organise information and understand what government forms require — we are not affiliated with any government agency, and we do not provide legal or benefits advice. Always verify requirements with your local office before submitting.
          </p>
        </div>
      </section>
    </div>
  );
}
