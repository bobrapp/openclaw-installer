import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, CheckCircle2, AlertTriangle, XCircle, Loader2, RotateCcw } from "lucide-react";
import { apiRequest, API_BASE } from "@/lib/queryClient";
import { celebrate } from "@/lib/celebrations";
import { playSound } from "@/lib/sound-engine";
import { CelebrationToast, useCelebration } from "@/components/celebration-toast";
import { useI18n } from "@/lib/i18n";

interface CheckResult {
  name: string;
  category: string;
  status: "pending" | "pass" | "warn" | "fail" | "running";
  message: string;
}

interface Summary {
  passed: number;
  warned: number;
  failed: number;
  result: string;
}

export default function PreflightRunner() {
  const [hostTarget, setHostTarget] = useState("macos");
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast, celebrate: showToast, dismiss } = useCelebration();
  const { t } = useI18n();

  const runPreflight = useCallback(() => {
    setChecks([]);
    setSummary(null);
    setRunError(null);
    setIsRunning(true);

    const url = `${API_BASE}/api/preflight/run/${hostTarget}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        es.close();
        setIsRunning(false);
        return;
      }

      const data = JSON.parse(event.data);

      if (data.type === "summary") {
        setSummary(data);
        if (data.result === "PASS" || data.failed === 0) {
          const msgs = [t.celebPreflight1, t.celebPreflight2, t.celebPreflight3];
          const msg = msgs[Math.floor(Math.random() * msgs.length)];
          celebrate(msg, "normal");
          showToast(msg);
          playSound("success");
        } else {
          playSound("error");
        }
      } else if (data.type === "check") {
        setChecks((prev) => {
          const updated = [...prev];
          updated[data.index] = {
            name: data.name,
            category: data.category,
            status: data.status,
            message: data.message,
          };
          return updated;
        });
      }
    };

    es.onerror = () => {
      es.close();
      setIsRunning(false);
      setRunError("Connection to preflight service failed. Please try again.");
    };
  }, [hostTarget, t]);

  const reset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setChecks([]);
    setSummary(null);
    setRunError(null);
    setIsRunning(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />;
      case "fail":
        return <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" aria-label="Running" role="status" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" aria-hidden="true" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pass": return "text-emerald-600 dark:text-emerald-400";
      case "warn": return "text-amber-600 dark:text-amber-400";
      case "fail": return "text-red-600 dark:text-red-400";
      default: return "text-muted-foreground";
    }
  };

  const completedCount = checks.filter((c) => c.status !== "pending").length;
  const progressPercent = checks.length > 0
    ? (completedCount / Math.max(checks.length, 1)) * 100
    : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Play className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-runner-title">
              {t.preflightTitle}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {t.preflightSubtitle}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Run Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Select value={hostTarget} onValueChange={setHostTarget} disabled={isRunning}>
                <SelectTrigger data-testid="select-host-target" aria-label="Select host target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="macos">{t.hostMacOS}</SelectItem>
                  <SelectItem value="digitalocean">{t.hostDigitalOcean}</SelectItem>
                  <SelectItem value="azure">{t.hostAzureVM}</SelectItem>
                  <SelectItem value="generic-vps">{t.hostGenericVPS}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={runPreflight}
              disabled={isRunning}
              data-testid="button-run-preflight"
              aria-label={isRunning ? "Running preflight checks..." : t.preflightRun}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" aria-hidden="true" />
                  {t.preflightRun}...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 me-2" aria-hidden="true" />
                  {t.preflightRun}
                </>
              )}
            </Button>
            {(checks.length > 0 || summary) && (
              <Button variant="outline" size="sm" onClick={reset} data-testid="button-reset-runner" aria-label={t.preflightReset}>
                <RotateCcw className="h-3 w-3 me-1" aria-hidden="true" />
                {t.preflightReset}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {runError && (
        <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-sm" role="alert">
          {runError}
        </div>
      )}

      {checks.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Check Results</CardTitle>
              <span className="text-xs text-muted-foreground" aria-live="polite" role="status">
                {completedCount} / {checks.length} complete
              </span>
            </div>
            {/* Progress bar */}
            <div
              className="w-full bg-muted rounded-full h-1.5 mt-2"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={checks.length}
              aria-label="Preflight check progress"
            >
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]" ref={scrollRef}>
              <div className="space-y-1" aria-live="polite" aria-label="Check results">
                {checks.map((check, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors"
                    data-testid={`check-result-${i}`}
                  >
                    {statusIcon(check.status)}
                    <Badge variant="outline" className="text-xs h-5 shrink-0 font-normal">
                      {check.category}
                    </Badge>
                    <span className="text-sm font-medium min-w-[140px]">{check.name}</span>
                    <span className={`text-xs font-mono ${statusColor(check.status)}`}>
                      {check.message || "Waiting..."}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card data-testid="card-summary">
          <CardContent className="pt-6">
            <div
              className={`text-center py-6 rounded-lg ${summary.result === "READY" ? "bg-emerald-500/10" : "bg-red-500/10"}`}
              role={summary.result !== "READY" ? "alert" : "status"}
              aria-live="polite"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                {summary.result === "READY" ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden="true" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
                )}
                <span className={`text-xl font-bold ${summary.result === "READY" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {summary.result === "READY" ? "Ready to Proceed" : "Blocked \u2014 Fix Failures"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  {summary.passed} passed
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  {summary.warned} warnings
                </span>
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
                  {summary.failed} failed
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Results logged to immutable audit chain with SHA-256 hash verification.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {checks.length === 0 && !isRunning && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4" aria-hidden="true">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">{t.preflightNoRun}</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {t.preflightSelectHost}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      <CelebrationToast message={toast.message} visible={toast.visible} onDone={dismiss} />
    </div>
  );
}
