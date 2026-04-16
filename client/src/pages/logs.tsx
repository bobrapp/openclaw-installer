import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Archive, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface InstallLog {
  id: number;
  timestamp: string;
  severity: string;
  step: string;
  message: string;
  host: string;
}

export default function Logs() {
  const { data: logs, isLoading, refetch } = useQuery<InstallLog[]>({
    queryKey: ["/api/logs"],
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/logs/archive"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
  });

  const severityColor = (s: string) => {
    switch (s) {
      case "error": return "text-destructive";
      case "warn": return "text-chart-4";
      case "success": return "text-chart-2";
      default: return "text-muted-foreground";
    }
  };

  const severityBadge = (s: string) => {
    switch (s) {
      case "error": return "destructive";
      case "warn": return "default";
      case "success": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-logs-title">
              Install Logs
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Immutable, append-only log of all installation actions. No PII stored.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-refresh-logs">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
            data-testid="button-archive-logs"
            aria-label="Archive log entries"
          >
            <Archive className="h-3 w-3 me-1" />
            Archive
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Log Entries</CardTitle>
            <span className="text-xs text-muted-foreground">{logs?.length || 0} entries</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 px-3 py-2 rounded-md text-xs font-mono hover:bg-muted/50"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <span className="text-muted-foreground whitespace-nowrap shrink-0">{log.timestamp}</span>
                    <Badge variant={severityBadge(log.severity) as any} className="text-xs h-5 shrink-0">
                      {log.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs h-5 shrink-0">{log.host}</Badge>
                    <span className="text-muted-foreground shrink-0">[{log.step}]</span>
                    <span className={severityColor(log.severity)}>{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No log entries yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Logs will appear here as you run installation steps.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
