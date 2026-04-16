import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCode2, Copy, Download, Shield, Undo2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { hostLabel } from "@/lib/host-utils";
import type { ScriptResponse } from "@/lib/host-utils";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export default function Scripts() {
  const params = useParams<{ hostTarget: string }>();
  const hostTarget = params.hostTarget || "macos";
  const { toast } = useToast();
  const { copy } = useCopyToClipboard();

  const { data: preflight, isLoading: preLoading } = useQuery<ScriptResponse>({
    queryKey: [`/api/scripts/preflight/${hostTarget}`],
  });

  const { data: install, isLoading: instLoading } = useQuery<ScriptResponse>({
    queryKey: [`/api/scripts/install/${hostTarget}`],
  });

  const { data: rollback, isLoading: rollLoading } = useQuery<ScriptResponse>({
    queryKey: [`/api/scripts/rollback/${hostTarget}`],
  });

  const handleCopy = (text: string) => {
    copy(text);
    toast({ title: "Copied", description: "Script copied to clipboard." });
  };

  const download = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = preLoading || instLoading || rollLoading;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileCode2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-scripts-title">
            Generated Scripts — {hostLabel(hostTarget)}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Complete shell scripts for each phase. Copy or download, then run in your terminal.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="preflight" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preflight" className="text-xs" data-testid="tab-preflight">
              <Shield className="h-3 w-3 mr-1.5" />
              Preflight
            </TabsTrigger>
            <TabsTrigger value="install" className="text-xs" data-testid="tab-install">
              <Zap className="h-3 w-3 mr-1.5" />
              Install
            </TabsTrigger>
            <TabsTrigger value="rollback" className="text-xs" data-testid="tab-rollback">
              <Undo2 className="h-3 w-3 mr-1.5" />
              Rollback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preflight">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Preflight Check Script</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Validates environment without making any changes. Safe to run anytime.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">Read-only</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="terminal-block bg-background mb-4">
                  <pre className="text-xs leading-relaxed"><code>{preflight?.script}</code></pre>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCopy(preflight?.script || "")} data-testid="button-copy-preflight">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(preflight?.script || "", `openclaw-preflight-${hostTarget}.sh`)} data-testid="button-download-preflight">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="install">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Install Script</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Full installation with DRY_RUN support. Set DRY_RUN=1 to preview all commands.
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="text-xs">Modifies system</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="terminal-block bg-background mb-4">
                  <pre className="text-xs leading-relaxed"><code>{install?.script}</code></pre>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCopy(install?.script || "")} data-testid="button-copy-install">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(install?.script || "", `openclaw-install-${hostTarget}.sh`)} data-testid="button-download-install">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rollback">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Rollback Script</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Reverses all installation steps. Run this to cleanly uninstall OpenClaw.
                    </CardDescription>
                  </div>
                  <Badge variant="destructive" className="text-xs">Destructive</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="terminal-block bg-background mb-4">
                  <pre className="text-xs leading-relaxed"><code>{rollback?.script}</code></pre>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleCopy(rollback?.script || "")} data-testid="button-copy-rollback">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download(rollback?.script || "", `openclaw-rollback-${hostTarget}.sh`)} data-testid="button-download-rollback">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
