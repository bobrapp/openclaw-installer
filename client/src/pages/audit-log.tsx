import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Hash,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound,
  FileDown,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useOwnerAuth } from "@/lib/owner-auth";

interface AuditLog {
  id: number;
  timestamp: string;
  date: string;
  user: string;
  prompt: string;
  results: string;
  previousHash: string;
  currentHash: string;
}

export default function AuditLogViewer() {
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [authError, setAuthError] = useState("");
  const [setupPassphrase, setSetupPassphrase] = useState("");
  const [showHashes, setShowHashes] = useState(false);
  const { lang } = useI18n();
  const { passphrase: storedPassphrase, setPassphrase: storePassphrase, clearPassphrase, isAuthenticated } = useOwnerAuth();

  // Check if owner passphrase has been set
  const { data: ownerStatus, isLoading: isCheckingOwner } = useQuery<{ hasPassphrase: boolean }>({
    queryKey: ["/api/owner/has-passphrase"],
  });

  // Set passphrase mutation
  const setPassphraseMutation = useMutation({
    mutationFn: (pass: string) => apiRequest("POST", "/api/owner/set-passphrase", { passphrase: pass }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/has-passphrase"] });
      setSetupPassphrase("");
    },
  });

  // Verify passphrase mutation
  const verifyMutation = useMutation({
    mutationFn: async (pass: string) => {
      const res = await apiRequest("POST", "/api/owner/verify", { passphrase: pass });
      return res.json();
    },
    onSuccess: (data: { valid: boolean }) => {
      if (data.valid) {
        storePassphrase(passphrase);
        setAuthError("");
      } else {
        setAuthError("Invalid passphrase");
      }
    },
  });

  // Fetch audit logs (only when authenticated)
  const { data: logs, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit/logs"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/audit/logs", undefined, {
        "x-owner-passphrase": storedPassphrase || "",
      });
      return res.json();
    },
  });

  // Verify chain integrity
  const { data: chainStatus, refetch: verifyChain } = useQuery<{ valid: boolean; brokenAt?: number }>({
    queryKey: ["/api/audit/verify"],
    enabled: false,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/audit/verify", undefined, {
        "x-owner-passphrase": storedPassphrase || "",
      });
      return res.json();
    },
  });

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate(passphrase);
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassphrase.length >= 6) {
      setPassphraseMutation.mutate(setupPassphrase);
    }
  };

  const lockAndExit = () => {
    clearPassphrase();
    setPassphrase("");
    queryClient.removeQueries({ queryKey: ["/api/audit/logs"] });
    queryClient.removeQueries({ queryKey: ["/api/audit/verify"] });
  };

  // Setup screen (no passphrase configured yet)
  if (isCheckingOwner) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ownerStatus?.hasPassphrase) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <KeyRound className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Setup Owner Access</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Create Owner Passphrase</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set a passphrase to secure the immutable audit log. This cannot be changed once set.
              Only the owner can view the crypto-verified audit chain.
            </p>
            <form onSubmit={handleSetup} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter passphrase (min 6 characters)"
                value={setupPassphrase}
                onChange={(e) => setSetupPassphrase(e.target.value)}
                data-testid="input-setup-passphrase"
              />
              <Button
                type="submit"
                disabled={setupPassphrase.length < 6 || setPassphraseMutation.isPending}
                className="w-full"
                data-testid="button-set-passphrase"
              >
                <Lock className="h-4 w-4 mr-2" />
                {setPassphraseMutation.isPending ? "Setting..." : "Set Owner Passphrase"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auth screen
  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Audit Log Access</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Owner Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The immutable audit log is secured with cryptographic hash verification.
              Enter the owner passphrase to access.
            </p>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassphrase ? "text" : "password"}
                  placeholder="Owner passphrase"
                  value={passphrase}
                  onChange={(e) => { setPassphrase(e.target.value); setAuthError(""); }}
                  data-testid="input-passphrase"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
                >
                  {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authError && (
                <p className="text-xs text-destructive">{authError}</p>
              )}
              <Button
                type="submit"
                disabled={!passphrase || verifyMutation.isPending}
                className="w-full"
                data-testid="button-authenticate"
              >
                <Unlock className="h-4 w-4 mr-2" />
                {verifyMutation.isPending ? "Verifying..." : "Authenticate"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-audit-title">
              Immutable Audit Log
            </h1>
            <Badge variant="secondary" className="text-xs">SHA-256 Chain</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Cryptographically secured, tamper-evident log. AiGovOps Foundation standard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHashes(!showHashes)}
            aria-pressed={showHashes}
            aria-label={showHashes ? "Hide hash values" : "Show hash values"}
            data-testid="button-toggle-hashes"
          >
            <Hash className="h-3 w-3 mr-1" />
            {showHashes ? "Hide" : "Show"} Hashes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => verifyChain()}
            aria-label="Verify chain integrity"
            data-testid="button-verify-chain"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verify Chain
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const res = await apiRequest("GET", `/api/audit/export-pdf?lang=${lang}`, undefined, {
                  "x-owner-passphrase": storedPassphrase,
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `aigovops-audit-report-${new Date().toISOString().slice(0, 10)}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error("PDF export failed", e);
              }
            }}
            aria-label="Export audit log as PDF"
            data-testid="button-export-pdf"
          >
            <FileDown className="h-3 w-3 mr-1" />
            Export PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchLogs()}
            aria-label="Refresh audit log"
            data-testid="button-refresh-audit"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={lockAndExit}
            aria-label="Lock and exit audit log viewer"
            data-testid="button-lock-audit"
          >
            <Lock className="h-3 w-3 mr-1" />
            Lock
          </Button>
        </div>
      </div>

      {/* Chain verification banner */}
      {chainStatus && (
        <div className={`rounded-lg p-3 mb-4 flex items-center gap-2 ${chainStatus.valid ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
          {chainStatus.valid ? (
            <>
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Chain integrity verified &mdash; all hashes valid</span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-5 w-5" />
              <span className="text-sm font-medium">
                Chain broken at entry #{chainStatus.brokenAt} \u2014 possible tampering detected
              </span>
            </>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Audit Entries</CardTitle>
            <span className="text-xs text-muted-foreground">{logs?.length || 0} entries</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-border rounded-md p-3 hover:bg-muted/30 transition-colors"
                    data-testid={`audit-entry-${log.id}`}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs font-mono text-muted-foreground">{log.timestamp}</span>
                      <Badge variant="outline" className="text-xs h-5">{log.user}</Badge>
                      <Badge variant="secondary" className="text-xs h-5">#{log.id}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Prompt:</span>
                        <p className="text-sm">{log.prompt}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Results:</span>
                        <p className="text-sm">{log.results}</p>
                      </div>
                    </div>
                    {showHashes && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">Prev Hash:</span>
                          <code className="text-xs font-mono text-muted-foreground break-all">
                            {log.previousHash === "0" ? "GENESIS" : log.previousHash}
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-20 shrink-0">Hash:</span>
                          <code className="text-xs font-mono text-primary break-all">{log.currentHash}</code>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No audit entries yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Entries are created automatically when preflight checks run or actions are taken.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
