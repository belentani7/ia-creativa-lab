import { Toaster } from "@/components/ui/sonner";
import { Suspense, lazy } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
const Home = lazy(() => import("@/pages/Home"));

function Router() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
            Cargando control room…
          </div>
        }
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/content" component={Home} />
          <Route path="/review" component={Home} />
          <Route path="/schedule" component={Home} />
          <Route path="/publications" component={Home} />
          <Route path="/activity" component={Home} />
          <Route path="/integrations" component={Home} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
