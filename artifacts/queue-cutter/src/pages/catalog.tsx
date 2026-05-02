import React from "react";
import { Link, useParams } from "wouter";
import { useListForms } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, FileText, ChevronLeft } from "lucide-react";

const COUNTRY_INFO: Record<string, { name: string; flag: string }> = {
  US: { name: "United States", flag: "🇺🇸" },
  IN: { name: "India", flag: "🇮🇳" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
};

export default function Catalog() {
  const params = useParams();
  const countryCode = (params.countryCode || "US").toUpperCase();
  const country = COUNTRY_INFO[countryCode] || { name: countryCode, flag: "🌐" };

  const { data, isLoading, isError } = useListForms();
  const forms = data?.forms.filter((f) => f.countryCode === countryCode) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{country.flag}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{country.name}</h1>
              <p className="text-muted-foreground">Available government forms</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">
          Failed to load forms. Please try again.
        </div>
      )}

      {!isLoading && !isError && forms.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          No forms available for this country yet.
        </div>
      )}

      {forms.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col hover:border-primary/50 transition-colors hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-xl leading-snug">{form.name}</CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap shrink-0">
                    {form.category}
                  </span>
                </div>
                <CardDescription className="text-base mt-2">
                  {form.shortDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>~{form.estimatedMinutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>{form.questionCount} questions</span>
                  </div>
                </div>
                <div className="text-sm bg-muted/50 p-3 rounded-md">
                  <span className="font-medium text-foreground">For: </span>
                  {form.whoItIsFor}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/forms/${form.id}`} className="w-full block">
                  <Button className="w-full text-lg h-12">Start this form</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground/70 pt-4">
        QueueCutter helps you prepare forms correctly. It is not affiliated with any government agency.
      </div>
    </div>
  );
}
