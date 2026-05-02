import React from "react";
import { Link } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-16 flex items-center px-4 max-w-4xl">
          <Link href="/" className="font-semibold text-primary text-xl flex items-center gap-2">
            QueueCutter
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border/40 bg-muted/20 py-8 mt-auto">
        <div className="container mx-auto px-4 max-w-4xl text-center text-sm text-muted-foreground">
          QueueCutter is an AI assistant, not legal advice. Please verify your paperwork before submitting.
        </div>
      </footer>
    </div>
  );
}
