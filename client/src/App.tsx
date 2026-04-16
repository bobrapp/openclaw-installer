import React, { Suspense, lazy } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ErrorBoundary } from "@/components/error-boundary";
import { I18nProvider } from "@/lib/i18n";
import { LanguagePicker } from "@/components/language-picker";
import { OwnerAuthProvider } from "@/lib/owner-auth";

if (import.meta.env.DEV) {
  import("@/data/validate-data");
}
import { allRoutes } from "@/lib/routes";

/* ─── Precomputed lazy page components (hoisted to module scope) ─── */
const lazyPages: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};
allRoutes.forEach((route) => {
  lazyPages[route.path] = lazy(route.lazy);
});

/* ─── Lazy-loaded ambient effects ─── */
const AmbientBackground = lazy(() =>
  import("@/components/ambient-background").then((m) => ({ default: m.AmbientBackground }))
);

/* ─── NotFound page (catch-all) ─── */
const NotFound = lazy(() => import("@/pages/not-found"));

/* ─── Loading fallback ─── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full py-20">
      <div className="flex flex-col items-center gap-3" role="status" aria-label="Loading page">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      {allRoutes.map((route) => (
        <Route key={route.path} path={route.path}>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {React.createElement(lazyPages[route.path])}
            </Suspense>
          </ErrorBoundary>
        </Route>
      ))}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <ThemeProvider>
      <I18nProvider>
        <OwnerAuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router hook={useHashLocation}>
              <SidebarProvider style={style as React.CSSProperties}>
                <Suspense fallback={null}>
                  <AmbientBackground />
                </Suspense>
                <div className="flex h-screen w-full relative">
                  <AppSidebar />
                  <div className="flex flex-col flex-1 min-w-0">
                    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <SidebarTrigger data-testid="button-sidebar-toggle" aria-label="Toggle sidebar" />
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" aria-hidden="true">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                          </svg>
                          <span className="font-semibold text-sm tracking-tight">OpenClaw Guided Install</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <LanguagePicker />
                        <ThemeToggle />
                      </div>
                    </header>
                    <main className="flex-1 overflow-auto">
                      <AppRouter />
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </Router>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
        </OwnerAuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
