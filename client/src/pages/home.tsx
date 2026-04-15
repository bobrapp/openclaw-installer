import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Laptop, Cloud, Server, Terminal, ArrowRight, Shield, FileCode2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const iconMap: Record<string, typeof Laptop> = {
  laptop: Laptop,
  cloud: Cloud,
  server: Server,
  terminal: Terminal,
};

interface HostConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  steps: string[];
}

export default function Home() {
  const { data: hosts, isLoading } = useQuery<HostConfig[]>({
    queryKey: ["/api/hosts"],
    queryFn: () => apiRequest("/api/hosts"),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">
          OpenClaw / Moltbot Installer
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Guided setup with preflight checks, permissions auditing, dependency management, and rollback support.
          Choose your deployment target below.
        </p>
      </div>

      {/* Feature summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
          <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Preflight Checks</p>
            <p className="text-xs text-muted-foreground">Validates permissions, dependencies, disk space before changing anything</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
          <FileCode2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Dry Run Mode</p>
            <p className="text-xs text-muted-foreground">Preview every command. Rollback scripts generated alongside each step.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
          <Terminal className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Production Hardening</p>
            <p className="text-xs text-muted-foreground">Security checklist with observability defaults, no-PII logging, and firewall rules</p>
          </div>
        </div>
      </div>

      {/* Host cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hosts?.map((host) => {
            const Icon = iconMap[host.icon] || Terminal;
            return (
              <Card key={host.id} className="group hover:border-primary/40 transition-colors" data-testid={`card-host-${host.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{host.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-xs mt-2 leading-relaxed">
                    {host.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {host.steps.map((step, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {step}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/wizard/${host.id}`}>
                      <Button size="sm" data-testid={`button-start-${host.id}`}>
                        Start Setup
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                    <Link href={`/hardening/${host.id}`}>
                      <Button size="sm" variant="outline" data-testid={`button-harden-${host.id}`}>
                        <Shield className="mr-1 h-3 w-3" />
                        Hardening
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
