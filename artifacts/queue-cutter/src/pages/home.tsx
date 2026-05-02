import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

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

export default function Home() {
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
          QueueCutter helps you prepare forms correctly. It is not an official government service.
          Always verify requirements with your local office.
        </p>
      </section>

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
          <p>QueueCutter is an independent AI tool to help you prepare government forms correctly. We are not affiliated with any government agency. Always verify requirements with your local office before submitting.</p>
        </div>
      </section>
    </div>
  );
}
