import React from "react";
import { Link } from "wouter";
import { useListForms } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, FileText } from "lucide-react";

export default function Home() {
  const { data, isLoading, isError } = useListForms();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4 text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Government paperwork, <span className="text-primary">simplified.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We turn confusing forms into a simple conversation. Answer a few questions, and we'll prepare everything you need to submit.
        </p>
      </section>

      <Alert className="bg-accent/10 border-accent/20 text-accent-foreground max-w-2xl mx-auto">
        <AlertTitle className="font-medium text-amber-800">Important Disclaimer</AlertTitle>
        <AlertDescription className="text-amber-800/80">
          QueueCutter is an independent AI tool to help you fill out forms. We are not affiliated with any government agency.
        </AlertDescription>
      </Alert>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-center">Available Forms</h2>
        
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
            Failed to load forms. Please try again later.
          </div>
        )}

        {data && (
          <div className="grid gap-6 sm:grid-cols-2">
            {data.forms.map((form) => (
              <Card key={form.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">{form.name}</CardTitle>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
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
                    <Button className="w-full text-lg h-12">Select this form</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
