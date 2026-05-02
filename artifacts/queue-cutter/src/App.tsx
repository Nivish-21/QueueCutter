import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Catalog from "@/pages/catalog";
import FormDetail from "@/pages/form-detail";
import PersonaPage from "@/pages/persona";
import SessionInterview from "@/pages/session";
import SessionPreview from "@/pages/preview";
import SessionCompare from "@/pages/compare";
import SessionChecklist from "@/pages/checklist";
import SessionWarnings from "@/pages/warnings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalog/:countryCode" component={Catalog} />
      <Route path="/forms/:formId" component={FormDetail} />
      <Route path="/persona/:sessionId" component={PersonaPage} />
      <Route path="/session/:sessionId" component={SessionInterview} />
      <Route path="/session/:sessionId/preview" component={SessionPreview} />
      <Route path="/session/:sessionId/compare" component={SessionCompare} />
      <Route path="/session/:sessionId/checklist" component={SessionChecklist} />
      <Route path="/session/:sessionId/warnings" component={SessionWarnings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
