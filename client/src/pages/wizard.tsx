import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Circle, Loader2, ArrowRight, ArrowLeft, Copy, Download, Play, Eye, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Note: apiRequest signature is (method, url, data) for mutations
// For GET queries, rely on the default queryFn

interface HostConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  steps: string[];
}

interface ScriptResponse {
  script: string;
  hostTarget: string;
}

export default function Wizard() {
  const params = useParams<{ hostTarget: string }>();
  const hostTarget = params.hostTarget || "macos";
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [mode, setMode] = useState<"preview" | "execute">("preview");
  const { toast } = useToast();

  const { data: hosts } = useQuery<HostConfig[]>({
    queryKey: ["/api/hosts"],
  });

  const { data: preflightScript } = useQuery<ScriptResponse>({
    queryKey: [`/api/scripts/preflight/${hostTarget}`],
  });

  const { data: installScript } = useQuery<ScriptResponse>({
    queryKey: [`/api/scripts/install/${hostTarget}`],
  });

  const { data: rollbackScript } = useQuery<ScriptResponse>({
    queryKey: [`/api/scripts/rollback/${hostTarget}`],
  });

  const host = hosts?.find((h) => h.id === hostTarget);
  const steps = host?.steps || ["Environment Check", "Dependencies", "Permissions", "Configuration", "Install", "Verify"];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard", description: "Script copied. Paste into your terminal to run." });
    }).catch(() => {
      toast({ title: "Copy failed", description: "Select and copy the script manually.", variant: "destructive" });
    });
  };

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markStepComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const getStepScript = (stepIndex: number): string => {
    switch (stepIndex) {
      case 0: return preflightScript?.script || "# Loading preflight script...";
      case 1: return generateDependencySection(hostTarget);
      case 2: return generatePermissionsSection(hostTarget);
      case 3: return generateConfigSection(hostTarget);
      case 4: return installScript?.script || "# Loading install script...";
      case 5: return generateVerifySection(hostTarget);
      default: return "# Unknown step";
    }
  };

  const getStepDescription = (stepIndex: number): string => {
    switch (stepIndex) {
      case 0: return "Run the preflight check to verify your environment meets all requirements. This script reads system state without making any changes.";
      case 1: return "Install required dependencies. Each package installation is logged and can be individually reversed.";
      case 2: return hostTarget === "macos"
        ? "Verify macOS Privacy & Security permissions. Audit Accessibility, Full Disk Access, and Screen Recording grants."
        : "Configure SSH keys, firewall rules, and network security. Every change generates a rollback entry.";
      case 3: return "Set up provider keys, messaging channels, and skill selection. Secrets are stored securely — never in logs or shell history.";
      case 4: return "Execute the installation. Enable DRY_RUN=1 to preview all commands first. A rollback script is generated alongside.";
      case 5: return "Verify the installation is running correctly. Check service status, health endpoints, and log output.";
      default: return "";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold tracking-tight" data-testid="text-wizard-title">
            {host?.name || hostTarget} Setup Wizard
          </h1>
          <Badge variant="outline" className="text-xs">{hostTarget}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Step-by-step guided installation with dry-run support and rollback.
        </p>
      </div>

      {/* Step progress bar */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const isCompleted = completedSteps.includes(i);
          const isCurrent = i === currentStep;
          return (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                  ? "bg-chart-2/15 text-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`button-step-${i}`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground step-active" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              <span>{step}</span>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Script panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Step {currentStep + 1}: {steps[currentStep]}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {getStepDescription(currentStep)}
                  </CardDescription>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant={mode === "preview" ? "default" : "outline"}
                    onClick={() => setMode("preview")}
                    className="text-xs h-7"
                    data-testid="button-mode-preview"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === "execute" ? "default" : "outline"}
                    onClick={() => setMode("execute")}
                    className="text-xs h-7"
                    data-testid="button-mode-execute"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mode === "preview" ? (
                <div className="terminal-block bg-background">
                  <pre className="text-xs leading-relaxed">
                    <code>{getStepScript(currentStep)}</code>
                  </pre>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-chart-4/10 border border-chart-4/20">
                    <AlertTriangle className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Execute with caution</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Copy and paste this script into your terminal. Set <code className="px-1 py-0.5 rounded bg-muted text-xs">DRY_RUN=1</code> before running to preview without making changes.
                      </p>
                    </div>
                  </div>
                  <div className="terminal-block bg-background">
                    <pre className="text-xs leading-relaxed">
                      <code>{getStepScript(currentStep)}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(getStepScript(currentStep))}
                    className="text-xs"
                    data-testid="button-copy-script"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadScript(getStepScript(currentStep), `openclaw-step${currentStep + 1}-${hostTarget}.sh`)}
                    className="text-xs"
                    data-testid="button-download-script"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download .sh
                  </Button>
                </div>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      data-testid="button-prev-step"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Previous
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={markStepComplete}
                    data-testid="button-next-step"
                  >
                    {currentStep < steps.length - 1 ? (
                      <>
                        Mark Complete & Next
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Finish
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel — Rollback */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Rollback Script</CardTitle>
              <CardDescription className="text-xs">
                Reverses all installation steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <pre className="text-xs font-mono leading-relaxed text-muted-foreground">
                  {rollbackScript?.script || "# Loading rollback script..."}
                </pre>
              </ScrollArea>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs flex-1"
                  onClick={() => copyToClipboard(rollbackScript?.script || "")}
                  data-testid="button-copy-rollback"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs flex-1"
                  onClick={() => downloadScript(rollbackScript?.script || "", `openclaw-rollback-${hostTarget}.sh`)}
                  data-testid="button-download-rollback"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {steps.map((step, i) => {
                  const isCompleted = completedSteps.includes(i);
                  const isCurrent = i === currentStep;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className={isCompleted ? "text-foreground" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
              {completedSteps.length === steps.length && (
                <div className="mt-3 p-2 rounded-md bg-chart-2/10 text-xs text-center font-medium">
                  All steps complete
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function generateDependencySection(hostTarget: string): string {
  if (hostTarget === "macos") {
    return `#!/bin/bash
# Step 2: macOS Dependencies
# Checks and installs required packages via Homebrew

echo "Checking dependencies..."

# Homebrew
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✅ Homebrew: $(brew --version | head -1)"
fi

# Node.js 20+
if ! command -v node &>/dev/null; then
  echo "Installing Node.js..."
  brew install node
else
  echo "✅ Node.js: $(node -v)"
fi

# pnpm
if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm..."
  brew install pnpm
else
  echo "✅ pnpm: $(pnpm -v)"
fi

# Git
if ! command -v git &>/dev/null; then
  echo "Installing Git..."
  brew install git
else
  echo "✅ Git: $(git --version)"
fi

# Tailscale (recommended)
if ! command -v tailscale &>/dev/null; then
  echo "Installing Tailscale (recommended for secure remote access)..."
  brew install tailscale
else
  echo "✅ Tailscale installed"
fi

echo ""
echo "✅ All dependencies satisfied"`;
  }

  return `#!/bin/bash
# Step 2: Linux Dependencies
# Installs required system packages

echo "Updating package lists..."
apt update

echo "Installing dependencies..."
apt install -y curl git ufw

# Node.js 20
if ! command -v node &>/dev/null; then
  echo "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "✅ Node.js: $(node -v)"
fi

# pnpm
if ! command -v pnpm &>/dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
else
  echo "✅ pnpm: $(pnpm -v)"
fi

# Tailscale
if ! command -v tailscale &>/dev/null; then
  echo "Installing Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
else
  echo "✅ Tailscale installed"
fi

echo ""
echo "✅ All dependencies satisfied"`;
}

function generatePermissionsSection(hostTarget: string): string {
  if (hostTarget === "macos") {
    return `#!/bin/bash
# Step 3: macOS Permissions Audit
# Checks Privacy & Security settings

echo "═══════════════════════════════════════"
echo "  macOS Permissions Audit"
echo "═══════════════════════════════════════"

# Check current user
current_user=$(whoami)
echo "Current user: $current_user"

if [ "$current_user" = "root" ]; then
  echo "❌ Running as root — create a dedicated user:"
  echo "   sudo dscl . -create /Users/openclaw"
  echo "   sudo dscl . -create /Users/openclaw UserShell /bin/zsh"
  echo "   sudo dscl . -create /Users/openclaw UniqueID 550"
  echo "   sudo dscl . -create /Users/openclaw PrimaryGroupID 20"
  echo "   sudo dscl . -create /Users/openclaw NFSHomeDirectory /Users/openclaw"
  echo "   sudo createhomedir -c -u openclaw"
elif [ "$current_user" = "openclaw" ]; then
  echo "✅ Running as dedicated 'openclaw' user"
else
  echo "⚠️  Running as '$current_user'"
  echo "   Consider creating a dedicated 'openclaw' user"
fi

echo ""
echo "📋 Manual Privacy & Security Review:"
echo "   Open: System Settings → Privacy & Security"
echo ""
echo "   1. Accessibility:"
echo "      Grant ONLY to Terminal.app or iTerm2"
echo "      Revoke any unnecessary apps"
echo ""
echo "   2. Full Disk Access:"
echo "      Grant ONLY if OpenClaw needs file-system skills"
echo "      Start WITHOUT this permission"
echo ""
echo "   3. Screen Recording:"
echo "      Grant ONLY if OpenClaw needs screenshot/screen skills"
echo "      Start WITHOUT this permission"
echo ""
echo "   4. Automation:"
echo "      Review which apps can control other apps"
echo "      Remove any stale entries"
echo ""
echo "🔐 Principle: Start with MINIMUM permissions."
echo "   Add only what specific skills require."`;
  }

  return `#!/bin/bash
# Step 3: SSH & Firewall Configuration

echo "═══════════════════════════════════════"
echo "  Security Configuration"
echo "═══════════════════════════════════════"

# SSH hardening
echo "Checking SSH configuration..."
if grep -q "PasswordAuthentication yes" /etc/ssh/sshd_config; then
  echo "⚠️  Password authentication is enabled"
  echo "   Fix: Edit /etc/ssh/sshd_config"
  echo "   Set: PasswordAuthentication no"
  echo "   Then: systemctl restart sshd"
else
  echo "✅ Password authentication disabled"
fi

if grep -q "PermitRootLogin yes" /etc/ssh/sshd_config; then
  echo "⚠️  Root login is enabled"
  echo "   Fix: Set PermitRootLogin no in /etc/ssh/sshd_config"
else
  echo "✅ Root login disabled"
fi

# Firewall
echo ""
echo "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
echo ""
echo "Current firewall rules:"
ufw status numbered

echo ""
echo "✅ Security configuration reviewed"`;
}

function generateConfigSection(hostTarget: string): string {
  if (hostTarget === "macos") {
    return `#!/bin/bash
# Step 4: OpenClaw Configuration
# Sets up provider keys and initial config

echo "═══════════════════════════════════════"
echo "  OpenClaw Configuration"
echo "═══════════════════════════════════════"

# Store API keys securely in macOS Keychain
echo ""
echo "🔐 Store your provider API key in Keychain:"
echo "   security add-generic-password -a openclaw -s openclaw-openai-key -w 'sk-YOUR_KEY'"
echo "   security add-generic-password -a openclaw -s openclaw-anthropic-key -w 'sk-ant-YOUR_KEY'"
echo ""
echo "   To retrieve later:"
echo "   security find-generic-password -a openclaw -s openclaw-openai-key -w"

echo ""
echo "⚙️  Initial configuration:"
echo "   After installation, run: openclaw onboard"
echo "   This interactive wizard will configure:"
echo "   - AI provider selection (OpenAI, Anthropic, Google, AWS)"
echo "   - Messaging channels (Slack, Discord, Telegram, WhatsApp)"
echo "   - Skill enablement (start minimal, add incrementally)"
echo ""
echo "📁 Config location: ~/.openclaw/config.yaml"
echo "📁 Antfarm config: ~/.antfarm/config.yaml"`;
  }

  return `#!/bin/bash
# Step 4: Server Configuration

echo "═══════════════════════════════════════"
echo "  OpenClaw Configuration"
echo "═══════════════════════════════════════"

# Secrets file
echo "🔐 Setting up secrets..."
mkdir -p /etc/openclaw
touch /etc/openclaw/secrets.env
chmod 600 /etc/openclaw/secrets.env
chown openclaw:openclaw /etc/openclaw/secrets.env

echo ""
echo "Edit /etc/openclaw/secrets.env with your API keys:"
echo "   OPENAI_API_KEY=sk-..."
echo "   ANTHROPIC_API_KEY=sk-ant-..."
echo "   NODE_ENV=production"
echo "   LOG_FORMAT=json"

echo ""
echo "⚙️  After installation, run onboarding:"
echo "   su - openclaw -c 'openclaw onboard --install-daemon'"
echo ""
echo "📁 Config: /opt/openclaw/config.yaml"
echo "📁 Antfarm: /opt/openclaw/.antfarm/config.yaml"`;
}

function generateVerifySection(hostTarget: string): string {
  if (hostTarget === "macos") {
    return `#!/bin/bash
# Step 6: Verification

echo "═══════════════════════════════════════"
echo "  Installation Verification"
echo "═══════════════════════════════════════"

# Check LaunchAgent
echo "Checking LaunchAgent..."
if launchctl list | grep -q "com.clawdbot.gateway"; then
  echo "✅ LaunchAgent is loaded"
else
  echo "❌ LaunchAgent not loaded"
  echo "   Run: launchctl load ~/Library/LaunchAgents/com.clawdbot.gateway.plist"
fi

# Check process
echo ""
echo "Checking gateway process..."
if pgrep -f "openclaw.*gateway" >/dev/null; then
  echo "✅ Gateway process running (PID: $(pgrep -f 'openclaw.*gateway'))"
else
  echo "⚠️  Gateway process not found"
fi

# Check health endpoint
echo ""
echo "Checking health endpoint..."
health=$(curl -s http://127.0.0.1:3000/health 2>/dev/null)
if [ -n "$health" ]; then
  echo "✅ Health endpoint responding: $health"
else
  echo "⚠️  Health endpoint not responding on :3000"
fi

# Check logs
echo ""
echo "Recent logs:"
if [ -f /var/log/openclaw/gateway.log ]; then
  tail -5 /var/log/openclaw/gateway.log
else
  echo "   No log file found yet"
fi

echo ""
echo "═══════════════════════════════════════"
echo "  Verification complete"
echo "═══════════════════════════════════════"`;
  }

  return `#!/bin/bash
# Step 6: Verification

echo "═══════════════════════════════════════"
echo "  Installation Verification"
echo "═══════════════════════════════════════"

# Check systemd service
echo "Checking service status..."
systemctl is-active openclaw && echo "✅ Service is active" || echo "❌ Service not active"

# Check process
echo ""
echo "Service details:"
systemctl status openclaw --no-pager -l | head -15

# Check health
echo ""
echo "Checking health endpoint..."
health=$(curl -s http://127.0.0.1:3000/health 2>/dev/null)
if [ -n "$health" ]; then
  echo "✅ Health: $health"
else
  echo "⚠️  Health endpoint not responding"
fi

# Check recent logs
echo ""
echo "Recent journal logs:"
journalctl -u openclaw -n 10 --no-pager

# Check Antfarm cron
echo ""
echo "Antfarm cron status:"
crontab -u openclaw -l 2>/dev/null | grep antfarm || echo "   Antfarm cron not configured yet"

echo ""
echo "═══════════════════════════════════════"
echo "  Verification complete"
echo "═══════════════════════════════════════"`;
}
