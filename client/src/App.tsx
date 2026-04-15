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
import Home from "@/pages/home";
import Wizard from "@/pages/wizard";
import Hardening from "@/pages/hardening";
import Logs from "@/pages/logs";
import Scripts from "@/pages/scripts";
import Compare from "@/pages/compare";
import PreflightRunner from "@/pages/preflight-runner";
import AuditLog from "@/pages/audit-log";
import Foundation from "@/pages/foundation";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
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
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router hook={useHashLocation}>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
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
                    <ThemeToggle />
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
    </ThemeProvider>
  );
}
