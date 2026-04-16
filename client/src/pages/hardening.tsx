import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, ShieldAlert, ShieldCheck, Info, Terminal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { hostLabel } from "@/lib/host-utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface HardeningCheck {
  id: number;
  category: string;
  title: string;
  description: string;
  command: string | null;
  isCompleted: number;
  hostTarget: string;
  severity: string;
}

export default function Hardening() {
  const params = useParams<{ hostTarget: string }>();
  const hostTarget = params.hostTarget || "macos";
  const { toast } = useToast();
  const { copy } = useCopyToClipboard();

  const { data: checks, isLoading } = useQuery<HardeningCheck[]>({
    queryKey: [`/api/hardening/${hostTarget}`],
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/hardening/toggle/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/hardening/${hostTarget}`] });
    },
  });

  const categories = checks
    ? [...new Set(checks.map((c) => c.category))]
    : [];

  const completedCount = checks?.filter((c) => c.isCompleted).length || 0;
  const totalCount = checks?.length || 0;
  const criticalCount = checks?.filter((c) => c.severity === "critical").length || 0;
  const criticalCompleted = checks?.filter((c) => c.severity === "critical" && c.isCompleted).length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const severityColor = (s: string) => {
    switch (s) {
      case "critical": return "destructive";
      case "recommended": return "default";
      case "optional": return "secondary";
      default: return "secondary";
    }
  };

  const copyCommand = (cmd: string) => {
    copy(cmd);
    toast({ title: "Copied", description: "Command copied to clipboard." });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-hardening-title">
            Production Hardening — {hostLabel(hostTarget)}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Security, observability, and governance checklist. Complete all critical items before production use.
        </p>
      </div>

      {/* Progress summary */}
      <Card className="mb-6">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" data-testid="text-progress-completed">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive" data-testid="text-critical-remaining">
                  {criticalCount - criticalCompleted}
                </p>
                <p className="text-xs text-muted-foreground">Critical remaining</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {criticalCompleted === criticalCount ? (
                <Badge variant="outline" className="bg-chart-2/10 border-chart-2/30 text-chart-2">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  All critical items complete
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-destructive/10 border-destructive/30 text-destructive">
                  <ShieldAlert className="h-3 w-3 mr-1" />
                  {criticalCount - criticalCompleted} critical items remaining
                </Badge>
              )}
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Checklist by category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryChecks = checks?.filter((c) => c.category === category) || [];
          const catCompleted = categoryChecks.filter((c) => c.isCompleted).length;
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{category}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {catCompleted}/{categoryChecks.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {categoryChecks.map((check) => (
                  <div
                    key={check.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      check.isCompleted ? "bg-chart-2/5" : "hover:bg-muted/50"
                    }`}
                    data-testid={`check-item-${check.id}`}
                  >
                    <Checkbox
                      checked={!!check.isCompleted}
                      onCheckedChange={() => toggleMutation.mutate(check.id)}
                      className="mt-0.5"
                      data-testid={`checkbox-${check.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm font-medium ${check.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {check.title}
                        </span>
                        <Badge variant={severityColor(check.severity) as any} className="text-xs h-5">
                          {check.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {check.description}
                      </p>
                      {check.command && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate flex-1">
                            {check.command}
                          </code>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0"
                                onClick={() => copyCommand(check.command!)}
                                data-testid={`button-copy-cmd-${check.id}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy command</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
