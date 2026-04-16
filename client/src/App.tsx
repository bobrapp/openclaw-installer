import { Suspense, lazy } from "react";
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

/* ─── Lazy-loaded pages (code splitting) ─── */
const Home = lazy(() => import("@/pages/home"));
const Wizard = lazy(() => import("@/pages/wizard"));
const Hardening = lazy(() => import("@/pages/hardening"));
const Logs = lazy(() => import("@/pages/logs"));
const Scripts = lazy(() => import("@/pages/scripts"));
const Compare = lazy(() => import("@/pages/compare"));
const PreflightRunner = lazy(() => import("@/pages/preflight-runner"));
const AuditLog = lazy(() => import("@/pages/audit-log"));
const Foundation = lazy(() => import("@/pages/foundation"));
const HowIBuiltThis = lazy(() => import("@/pages/how-i-built-this"));
const Releases = lazy(() => import("@/pages/releases"));
const HostingDeals = lazy(() => import("@/pages/hosting-deals"));
const Patterns = lazy(() => import("@/pages/patterns"));
const Marketplace = lazy(() => import("@/pages/marketplace"));
const Humans = lazy(() => import("@/pages/humans"));
const NotFound = lazy(() => import("@/pages/not-found"));

/* ─── Lazy-loaded ambient effects ─── */
const AmbientBackground = lazy(() =>
  import("@/components/ambient-background").then((m) => ({ default: m.AmbientBackground }))
);

/* ─── Loading fallback ─── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/wizard/:hostTarget" component={Wizard} />
          <Route path="/hardening/:hostTarget" component={Hardening} />
          <Route path="/logs" component={Logs} />
          <Route path="/scripts/:hostTarget" component={Scripts} />
          <Route path="/compare" component={Compare} />
          <Route path="/preflight" component={PreflightRunner} />
          <Route path="/audit" component={AuditLog} />
          <Route path="/foundation" component={Foundation} />
          <Route path="/how-i-built-this" component={HowIBuiltThis} />
          <Route path="/releases" component={Releases} />
          <Route path="/hosting" component={HostingDeals} />
          <Route path="/patterns" component={Patterns} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/humans" component={Humans} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
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
                        <SidebarTrigger data-testid="button-sidebar-toggle" />
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                          </svg>
                          <span className="font-semibold text-sm tracking-tight">OpenClaw Installer</span>
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
      </I18nProvider>
    </ThemeProvider>
  );
}
