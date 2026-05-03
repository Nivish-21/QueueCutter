import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, PlayCircle } from "lucide-react";
import { useListSessions } from "@workspace/api-client-react";

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
    color: "from-blue-50 to-red-50 dark:from-blue-950/20 dark:to-red-950/20",
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
  if (mins < 60) return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function Home() {
  const { data: sessionsData } = useListSessions({
    query: { queryKey: ["listSessions"], staleTime: 30000 },
  });

  const inProgress = (sessionsData?.sessions ?? [])
    .filter((s) => s.status === "in_progress")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4 text-center py-10">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Government paperwork, <span className="text-primary">simplified.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We turn confusing government forms into a simple conversation. Choose your country to get started.
        </p>
        <p className="text-sm text-muted-foreground/70 max-w-xl mx-auto">
          QueueCutter provides document preparation support — not legal or benefits advice. Always verify requirements with your local office.
        </p>
      </section>

      {inProgress.length > 0 && (
        <section className="space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Continue where you left off</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {inProgress.map((s) => (
              <Link key={s.id} href={`/session/${s.id}`} className="block">
                <Card className="border-primary/20 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer bg-primary/3">
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
                    <Button size="sm" className="w-full h-8 text-xs gap-1">
                      Continue
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
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
                  <CardDescription className="text-sm mt-1">
                    {country.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-6 flex justify-center">
                  <Button variant="outline" className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground">
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
          <p>QueueCutter is an independent document preparation tool. We help you organize information and understand what government forms require — we are not affiliated with any government agency, and we do not provide legal or benefits advice. Always verify requirements with your local office before submitting.</p>
        </div>
      </section>
    </div>
  );
}
