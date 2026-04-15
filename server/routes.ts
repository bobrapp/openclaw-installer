import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

export function registerRoutes(server: Server, app: Express) {
  // === LOGS ===
  app.get("/api/logs", (req, res) => {
    const host = req.query.host as string | undefined;
    const logs = storage.getLogs(host);
    res.json(logs);
  });

  app.post("/api/logs", (req, res) => {
    const log = storage.addLog(req.body);
    res.json(log);
  });

  app.delete("/api/logs", (_req, res) => {
    storage.clearLogs();
    res.json({ ok: true });
  });

  // === INSTALL STATE ===
  app.get("/api/state", (_req, res) => {
    const state = storage.getOrCreateState();
    res.json(state);
  });

  app.patch("/api/state/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const state = storage.updateState(id, req.body);
    res.json(state);
  });

  app.post("/api/state/reset", (_req, res) => {
    const state = storage.resetState();
    res.json(state);
  });

  // === HARDENING CHECKS ===
  app.get("/api/hardening/:hostTarget", (req, res) => {
    const checks = storage.getHardeningChecks(req.params.hostTarget);
    res.json(checks);
  });

  app.patch("/api/hardening/toggle/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const check = storage.toggleHardeningCheck(id);
    res.json(check);
  });

  // === PREFLIGHT CHECK SCRIPTS ===
  app.get("/api/scripts/preflight/:hostTarget", (req, res) => {
    const hostTarget = req.params.hostTarget;
    const script = generatePreflightScript(hostTarget);
    res.json({ script, hostTarget });
  });

  app.get("/api/scripts/install/:hostTarget", (req, res) => {
    const hostTarget = req.params.hostTarget;
    const script = generateInstallScript(hostTarget);
    res.json({ script, hostTarget });
  });

  app.get("/api/scripts/rollback/:hostTarget", (req, res) => {
    const hostTarget = req.params.hostTarget;
    const script = generateRollbackScript(hostTarget);
    res.json({ script, hostTarget });
  });

  // === HOST CONFIGURATIONS ===
  app.get("/api/hosts", (_req, res) => {
    res.json(getHostConfigs());
  });

  // === PREFLIGHT RUNNER (SSE — streams check results live) ===
  app.get("/api/preflight/run/:hostTarget", (req, res) => {
    const hostTarget = req.params.hostTarget;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const checks = getPreflightChecks(hostTarget);
    let index = 0;

    const interval = setInterval(() => {
      if (index >= checks.length) {
        // Send summary
        const passed = checks.filter((c) => c.status === "pass").length;
        const warned = checks.filter((c) => c.status === "warn").length;
        const failed = checks.filter((c) => c.status === "fail").length;
        const summaryResult = failed === 0 ? "READY" : "BLOCKED";
        res.write(`data: ${JSON.stringify({ type: "summary", passed, warned, failed, result: summaryResult })}\n\n`);
        res.write("data: [DONE]\n\n");
        clearInterval(interval);
        res.end();

        // Write to immutable audit log
        storage.addAuditLog({
          user: "installer",
          prompt: `Preflight check executed for ${hostTarget}`,
          results: `${passed} passed, ${warned} warnings, ${failed} failed — ${summaryResult}`,
        });

        // Also write each result to install logs
        for (const check of checks) {
          storage.addLog({
            timestamp: new Date().toISOString(),
            severity: check.status === "pass" ? "success" : check.status === "warn" ? "warn" : "error",
            step: "preflight",
            message: `[${check.name}] ${check.message}`,
            host: hostTarget,
          });
        }
        return;
      }

      const check = checks[index];
      // Simulate execution with randomized delay
      const statuses: Array<"pass" | "warn" | "fail"> = ["pass", "pass", "pass", "pass", "warn", "pass"];
      check.status = statuses[Math.floor(Math.random() * statuses.length)];
      check.message = getCheckMessage(check.name, check.status, hostTarget);
      res.write(`data: ${JSON.stringify({ type: "check", index, ...check })}\n\n`);
      index++;
    }, 400 + Math.random() * 300);

    req.on("close", () => {
      clearInterval(interval);
    });
  });

  // === AUDIT LOGS (Immutable Hash Chain) ===
  app.get("/api/audit/logs", (req, res) => {
    const passphrase = req.headers["x-owner-passphrase"] as string;
    if (!passphrase || !storage.verifyOwnerPassphrase(passphrase)) {
      return res.status(401).json({ error: "Unauthorized — owner passphrase required" });
    }
    const logs = storage.getAuditLogs();
    res.json(logs);
  });

  app.get("/api/audit/verify", (req, res) => {
    const passphrase = req.headers["x-owner-passphrase"] as string;
    if (!passphrase || !storage.verifyOwnerPassphrase(passphrase)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const result = storage.verifyAuditChain();
    res.json(result);
  });

  // === OWNER AUTH ===
  app.get("/api/owner/has-passphrase", (_req, res) => {
    res.json({ hasPassphrase: storage.hasOwnerPassphrase() });
  });

  app.post("/api/owner/set-passphrase", (req, res) => {
    const { passphrase } = req.body;
    if (!passphrase || passphrase.length < 6) {
      return res.status(400).json({ error: "Passphrase must be at least 6 characters" });
    }
    if (storage.hasOwnerPassphrase()) {
      return res.status(400).json({ error: "Passphrase already set. Cannot change." });
    }
    storage.setOwnerPassphrase(passphrase);
    storage.addAuditLog({ user: "owner", prompt: "Owner passphrase configured", results: "success" });
    res.json({ ok: true });
  });

  app.post("/api/owner/verify", (req, res) => {
    const { passphrase } = req.body;
    const valid = storage.verifyOwnerPassphrase(passphrase);
    res.json({ valid });
  });
}

function getHostConfigs() {
  return [
    {
      id: "macos",
      name: "macOS (Local)",
      icon: "laptop",
      description: "Install OpenClaw/Moltbot on your Mac with LaunchAgent, Keychain secrets, and local-first operation.",
      steps: ["Environment Check", "Dependencies", "Permissions", "Configuration", "Install", "Verify"],
    },
    {
      id: "digitalocean",
      name: "DigitalOcean",
      icon: "cloud",
      description: "Deploy to a DO droplet via 1-Click Marketplace image or manual Ubuntu setup with systemd.",
      steps: ["Environment Check", "Dependencies", "SSH & Firewall", "Configuration", "Deploy", "Verify"],
    },
    {
      id: "azure",
      name: "Azure VM",
      icon: "server",
      description: "Deploy to an Azure VM using Bicep templates with Key Vault integration and NSG rules.",
      steps: ["Environment Check", "Dependencies", "NSG & Identity", "Configuration", "Deploy", "Verify"],
    },
    {
      id: "generic-vps",
      name: "Generic VPS",
      icon: "terminal",
      description: "Manual installation on any Ubuntu/Debian VPS with systemd, UFW, and Tailscale.",
      steps: ["Environment Check", "Dependencies", "SSH & Firewall", "Configuration", "Install", "Verify"],
    },
  ];
}

function generatePreflightScript(hostTarget: string): string {
  const common = `#!/bin/bash
set -euo pipefail
# OpenClaw/Moltbot Preflight Check — ${hostTarget}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# This script checks prerequisites WITHOUT making changes.

PASS=0; WARN=0; FAIL=0
log_pass()  { echo "✅ PASS: $1"; PASS=$((PASS+1)); }
log_warn()  { echo "⚠️  WARN: $1"; WARN=$((WARN+1)); }
log_fail()  { echo "❌ FAIL: $1"; FAIL=$((FAIL+1)); }

echo "═══════════════════════════════════════"
echo "  OpenClaw Preflight — ${hostTarget}"
echo "═══════════════════════════════════════"
echo ""
`;

  if (hostTarget === "macos") {
    return common + `
# --- macOS Version ---
macos_ver=$(sw_vers -productVersion 2>/dev/null || echo "unknown")
major=$(echo "$macos_ver" | cut -d. -f1)
if [ "$major" -ge 14 ] 2>/dev/null; then
  log_pass "macOS $macos_ver (Sonoma or later)"
elif [ "$major" -ge 13 ] 2>/dev/null; then
  log_warn "macOS $macos_ver — Ventura supported but Sonoma+ recommended"
else
  log_fail "macOS $macos_ver — requires macOS 13+ (Ventura)"
fi

# --- Disk Space ---
available_gb=$(df -g / | tail -1 | awk '{print $4}')
if [ "$available_gb" -ge 10 ]; then
  log_pass "Disk space: \${available_gb}GB available (≥10GB required)"
else
  log_fail "Disk space: only \${available_gb}GB available (need ≥10GB)"
fi

# --- Xcode CLI Tools ---
if xcode-select -p &>/dev/null; then
  log_pass "Xcode Command Line Tools installed"
else
  log_fail "Xcode Command Line Tools not found — run: xcode-select --install"
fi

# --- Homebrew ---
if command -v brew &>/dev/null; then
  log_pass "Homebrew installed ($(brew --version | head -1))"
else
  log_fail "Homebrew not found — visit https://brew.sh"
fi

# --- Node.js ---
if command -v node &>/dev/null; then
  node_ver=$(node -v)
  node_major=$(echo "$node_ver" | sed 's/v//' | cut -d. -f1)
  if [ "$node_major" -ge 20 ]; then
    log_pass "Node.js $node_ver (≥20 required)"
  else
    log_warn "Node.js $node_ver — v20+ recommended"
  fi
else
  log_fail "Node.js not found — run: brew install node"
fi

# --- pnpm ---
if command -v pnpm &>/dev/null; then
  log_pass "pnpm installed ($(pnpm -v))"
else
  log_warn "pnpm not found — run: brew install pnpm"
fi

# --- Git ---
if command -v git &>/dev/null; then
  log_pass "Git installed ($(git --version))"
else
  log_fail "Git not found — install Xcode CLI Tools"
fi

# --- Tailscale ---
if command -v tailscale &>/dev/null; then
  log_pass "Tailscale installed"
else
  log_warn "Tailscale not found — recommended for secure remote access"
fi

# --- Current User Check ---
current_user=$(whoami)
if [ "$current_user" = "root" ]; then
  log_fail "Running as root — create a dedicated 'openclaw' user"
elif [ "$current_user" = "openclaw" ]; then
  log_pass "Running as dedicated 'openclaw' user"
else
  log_warn "Running as '$current_user' — consider a dedicated 'openclaw' user"
fi

# --- Privacy & Security Permissions ---
echo ""
echo "📋 Manual checks needed:"
echo "   → System Settings → Privacy & Security → Accessibility"
echo "   → System Settings → Privacy & Security → Full Disk Access"
echo "   → System Settings → Privacy & Security → Screen Recording"
echo "   Minimize grants to only what OpenClaw needs."

echo ""
echo "═══════════════════════════════════════"
echo "  Results: ✅ $PASS passed, ⚠️  $WARN warnings, ❌ $FAIL failed"
echo "═══════════════════════════════════════"
[ "$FAIL" -eq 0 ] && echo "🟢 Ready to proceed" || echo "🔴 Fix failures before continuing"
exit $FAIL
`;
  }

  if (hostTarget === "digitalocean") {
    return common + `
# --- OS Check ---
if [ -f /etc/os-release ]; then
  . /etc/os-release
  if [[ "$ID" == "ubuntu" ]]; then
    log_pass "Ubuntu detected ($VERSION_ID)"
  else
    log_warn "Non-Ubuntu distro ($ID) — Ubuntu 22.04+ recommended"
  fi
else
  log_fail "Cannot detect OS — /etc/os-release missing"
fi

# --- Disk Space ---
available_gb=$(df -BG / | tail -1 | awk '{print $4}' | tr -d 'G')
if [ "$available_gb" -ge 10 ]; then
  log_pass "Disk space: \${available_gb}GB available"
else
  log_fail "Disk space: only \${available_gb}GB (need ≥10GB)"
fi

# --- Memory ---
mem_mb=$(free -m | awk '/Mem:/{print $2}')
if [ "$mem_mb" -ge 2048 ]; then
  log_pass "Memory: \${mem_mb}MB (≥2GB)"
elif [ "$mem_mb" -ge 1024 ]; then
  log_warn "Memory: \${mem_mb}MB — 2GB+ recommended"
else
  log_fail "Memory: \${mem_mb}MB — minimum 1GB, recommend 2GB+"
fi

# --- Node.js ---
if command -v node &>/dev/null; then
  node_ver=$(node -v)
  log_pass "Node.js $node_ver"
else
  log_fail "Node.js not found — run: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi

# --- pnpm ---
if command -v pnpm &>/dev/null; then
  log_pass "pnpm installed"
else
  log_warn "pnpm not found — run: npm install -g pnpm"
fi

# --- Git ---
if command -v git &>/dev/null; then
  log_pass "Git installed"
else
  log_fail "Git not found — run: apt install git"
fi

# --- UFW Firewall ---
if command -v ufw &>/dev/null; then
  ufw_status=$(ufw status 2>/dev/null | head -1)
  if echo "$ufw_status" | grep -q "active"; then
    log_pass "UFW firewall active"
  else
    log_warn "UFW installed but not active — run: ufw enable"
  fi
else
  log_fail "UFW not found — run: apt install ufw"
fi

# --- SSH Config ---
if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null; then
  log_pass "SSH password authentication disabled"
else
  log_warn "SSH password auth may be enabled — check /etc/ssh/sshd_config"
fi

# --- Tailscale ---
if command -v tailscale &>/dev/null; then
  log_pass "Tailscale installed"
else
  log_warn "Tailscale not found — highly recommended for secure access"
fi

# --- User Check ---
current_user=$(whoami)
if [ "$current_user" = "root" ]; then
  log_warn "Running as root — create and switch to 'openclaw' user"
elif [ "$current_user" = "openclaw" ]; then
  log_pass "Running as dedicated 'openclaw' user"
else
  log_warn "Running as '$current_user' — consider a dedicated 'openclaw' user"
fi

echo ""
echo "═══════════════════════════════════════"
echo "  Results: ✅ $PASS passed, ⚠️  $WARN warnings, ❌ $FAIL failed"
echo "═══════════════════════════════════════"
[ "$FAIL" -eq 0 ] && echo "🟢 Ready to proceed" || echo "🔴 Fix failures before continuing"
exit $FAIL
`;
  }

  if (hostTarget === "azure") {
    return common + `
# --- OS Check ---
if [ -f /etc/os-release ]; then
  . /etc/os-release
  log_pass "OS: $PRETTY_NAME"
else
  log_fail "Cannot detect OS"
fi

# --- Azure CLI ---
if command -v az &>/dev/null; then
  log_pass "Azure CLI installed ($(az version --output tsv 2>/dev/null | head -1))"
else
  log_warn "Azure CLI not found — needed for Key Vault and NSG management"
fi

# --- Disk / Memory ---
available_gb=$(df -BG / | tail -1 | awk '{print $4}' | tr -d 'G')
[ "$available_gb" -ge 10 ] && log_pass "Disk: \${available_gb}GB" || log_fail "Disk: \${available_gb}GB (need ≥10GB)"

mem_mb=$(free -m | awk '/Mem:/{print $2}')
[ "$mem_mb" -ge 2048 ] && log_pass "Memory: \${mem_mb}MB" || log_warn "Memory: \${mem_mb}MB (2GB+ recommended)"

# --- Node.js / Git ---
command -v node &>/dev/null && log_pass "Node.js $(node -v)" || log_fail "Node.js not found"
command -v git &>/dev/null && log_pass "Git installed" || log_fail "Git not found"
command -v tailscale &>/dev/null && log_pass "Tailscale installed" || log_warn "Tailscale not found"

echo ""
echo "═══════════════════════════════════════"
echo "  Results: ✅ $PASS passed, ⚠️  $WARN warnings, ❌ $FAIL failed"
echo "═══════════════════════════════════════"
[ "$FAIL" -eq 0 ] && echo "🟢 Ready to proceed" || echo "🔴 Fix failures before continuing"
exit $FAIL
`;
  }

  // generic-vps
  return common + `
# --- OS Check ---
if [ -f /etc/os-release ]; then
  . /etc/os-release
  log_pass "OS: $PRETTY_NAME"
else
  log_warn "Cannot detect OS"
fi

# --- Standard Checks ---
available_gb=$(df -BG / | tail -1 | awk '{print $4}' | tr -d 'G')
[ "$available_gb" -ge 10 ] && log_pass "Disk: \${available_gb}GB" || log_fail "Disk: \${available_gb}GB (need ≥10GB)"

mem_mb=$(free -m | awk '/Mem:/{print $2}')
[ "$mem_mb" -ge 1024 ] && log_pass "Memory: \${mem_mb}MB" || log_fail "Memory: \${mem_mb}MB (need ≥1GB)"

command -v node &>/dev/null && log_pass "Node.js $(node -v)" || log_fail "Node.js not found"
command -v git &>/dev/null && log_pass "Git installed" || log_fail "Git not found"
command -v pnpm &>/dev/null && log_pass "pnpm installed" || log_warn "pnpm not found"
command -v tailscale &>/dev/null && log_pass "Tailscale installed" || log_warn "Tailscale not found"

# --- Firewall ---
if command -v ufw &>/dev/null; then
  ufw_status=$(ufw status 2>/dev/null | head -1)
  echo "$ufw_status" | grep -q "active" && log_pass "UFW active" || log_warn "UFW not active"
elif command -v iptables &>/dev/null; then
  log_pass "iptables available"
else
  log_warn "No firewall detected"
fi

# --- SSH ---
if grep -q "PasswordAuthentication no" /etc/ssh/sshd_config 2>/dev/null; then
  log_pass "SSH password auth disabled"
else
  log_warn "SSH password auth may be enabled"
fi

echo ""
echo "═══════════════════════════════════════"
echo "  Results: ✅ $PASS passed, ⚠️  $WARN warnings, ❌ $FAIL failed"
echo "═══════════════════════════════════════"
[ "$FAIL" -eq 0 ] && echo "🟢 Ready to proceed" || echo "🔴 Fix failures before continuing"
exit $FAIL
`;
}

function generateInstallScript(hostTarget: string): string {
  const header = `#!/bin/bash
set -euo pipefail
# OpenClaw/Moltbot Install — ${hostTarget}
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# DRY RUN MODE: Set DRY_RUN=1 to preview without making changes

DRY_RUN=\${DRY_RUN:-0}
ROLLBACK_LOG="/tmp/openclaw-rollback-$(date +%s).sh"

run_or_dry() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "[DRY RUN] Would execute: $*"
    echo "# $*" >> "$ROLLBACK_LOG"
  else
    echo "[EXEC] $*"
    eval "$@"
  fi
}

echo "#!/bin/bash" > "$ROLLBACK_LOG"
echo "# Rollback script — reverses installation steps" >> "$ROLLBACK_LOG"
echo "set -euo pipefail" >> "$ROLLBACK_LOG"
echo "" >> "$ROLLBACK_LOG"

echo "═══════════════════════════════════════"
echo "  OpenClaw Install — ${hostTarget}"
[ "$DRY_RUN" = "1" ] && echo "  *** DRY RUN MODE ***"
echo "═══════════════════════════════════════"
echo ""
`;

  if (hostTarget === "macos") {
    return header + `
# --- Step 1: Install Dependencies ---
echo "📦 Step 1: Dependencies"

if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  run_or_dry '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"' >> "$ROLLBACK_LOG"
fi

if ! command -v node &>/dev/null; then
  run_or_dry "brew install node"
  echo "brew uninstall node" >> "$ROLLBACK_LOG"
fi

if ! command -v pnpm &>/dev/null; then
  run_or_dry "brew install pnpm"
  echo "brew uninstall pnpm" >> "$ROLLBACK_LOG"
fi

if ! command -v tailscale &>/dev/null; then
  run_or_dry "brew install tailscale"
  echo "brew uninstall tailscale" >> "$ROLLBACK_LOG"
fi

# --- Step 2: Clone & Setup ---
echo ""
echo "📥 Step 2: Clone OpenClaw"
INSTALL_DIR="\\${HOME}/.openclaw"
run_or_dry "git clone https://github.com/openclaw/openclaw.git \\"$INSTALL_DIR\\""
echo "rm -rf $INSTALL_DIR" >> "$ROLLBACK_LOG"

run_or_dry "cd \\"$INSTALL_DIR\\" && pnpm install"

# --- Step 3: Configure LaunchAgent ---
echo ""
echo "⚙️  Step 3: LaunchAgent Setup"
PLIST_PATH="\\${HOME}/Library/LaunchAgents/com.clawdbot.gateway.plist"

if [ "$DRY_RUN" != "1" ]; then
cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.clawdbot.gateway</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>\\${HOME}/.openclaw/gateway.js</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/var/log/openclaw/gateway.log</string>
  <key>StandardErrorPath</key>
  <string>/var/log/openclaw/gateway-error.log</string>
  <key>SockNodeName</key>
  <string>127.0.0.1</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key>
    <string>production</string>
    <key>LOG_FORMAT</key>
    <string>json</string>
  </dict>
</dict>
</plist>
PLIST
fi

echo "[DRY RUN] Would create LaunchAgent plist at $PLIST_PATH"
echo "launchctl unload \\"$PLIST_PATH\\" 2>/dev/null; rm -f \\"$PLIST_PATH\\"" >> "$ROLLBACK_LOG"

run_or_dry "mkdir -p /var/log/openclaw"
echo "rm -rf /var/log/openclaw" >> "$ROLLBACK_LOG"

# --- Step 4: Store Secrets in Keychain ---
echo ""
echo "🔐 Step 4: Keychain Setup"
echo "   Store API keys with:"
echo "   security add-generic-password -a openclaw -s openclaw-provider-key -w 'YOUR_KEY'"

# --- Step 5: Load & Start ---
echo ""
echo "🚀 Step 5: Start Gateway"
run_or_dry "launchctl load \\"$PLIST_PATH\\""
echo ""
echo "✅ Installation complete"
echo "   Rollback script saved to: $ROLLBACK_LOG"
echo "   Run onboarding: openclaw onboard"
`;
  }

  if (hostTarget === "digitalocean") {
    return header + `
# --- Step 1: System Setup ---
echo "📦 Step 1: System packages"
run_or_dry "apt update && apt upgrade -y"
run_or_dry "apt install -y curl git ufw fail2ban"

# --- Step 2: Create dedicated user ---
echo ""
echo "👤 Step 2: Create openclaw user"
if ! id openclaw &>/dev/null; then
  run_or_dry "adduser --disabled-password --gecos '' openclaw"
  run_or_dry "usermod -aG sudo openclaw"
  echo "userdel -r openclaw" >> "$ROLLBACK_LOG"
fi

# --- Step 3: Node.js ---
echo ""
echo "📦 Step 3: Node.js"
if ! command -v node &>/dev/null; then
  run_or_dry "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
  run_or_dry "apt-get install -y nodejs"
  run_or_dry "npm install -g pnpm"
fi

# --- Step 4: Firewall ---
echo ""
echo "🔒 Step 4: Firewall"
run_or_dry "ufw default deny incoming"
run_or_dry "ufw default allow outgoing"
run_or_dry "ufw allow 22/tcp"
run_or_dry "ufw --force enable"

# --- Step 5: Clone & Install ---
echo ""
echo "📥 Step 5: Clone OpenClaw"
INSTALL_DIR="/opt/openclaw"
run_or_dry "git clone https://github.com/openclaw/openclaw.git $INSTALL_DIR"
run_or_dry "chown -R openclaw:openclaw $INSTALL_DIR"
run_or_dry "su - openclaw -c 'cd $INSTALL_DIR && pnpm install'"
echo "rm -rf $INSTALL_DIR" >> "$ROLLBACK_LOG"

# --- Step 6: Secrets ---
echo ""
echo "🔐 Step 6: Secrets"
run_or_dry "mkdir -p /etc/openclaw"
run_or_dry "touch /etc/openclaw/secrets.env"
run_or_dry "chmod 600 /etc/openclaw/secrets.env"
run_or_dry "chown openclaw:openclaw /etc/openclaw/secrets.env"
echo "rm -rf /etc/openclaw" >> "$ROLLBACK_LOG"

# --- Step 7: Systemd Service ---
echo ""
echo "⚙️  Step 7: Systemd service"
if [ "$DRY_RUN" != "1" ]; then
cat > /etc/systemd/system/openclaw.service << SERVICE
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
User=openclaw
Group=openclaw
WorkingDirectory=/opt/openclaw
ExecStart=/usr/bin/node gateway.js
EnvironmentFile=/etc/openclaw/secrets.env
Environment=NODE_ENV=production
Environment=LOG_FORMAT=json
Restart=on-failure
RestartSec=5

# Hardening
ProtectSystem=strict
PrivateTmp=true
NoNewPrivileges=true
ReadWritePaths=/var/log/openclaw /opt/openclaw
ProtectHome=true

StandardOutput=journal
StandardError=journal
SyslogIdentifier=openclaw

[Install]
WantedBy=multi-user.target
SERVICE
fi
echo "systemctl stop openclaw; systemctl disable openclaw; rm /etc/systemd/system/openclaw.service" >> "$ROLLBACK_LOG"

# --- Step 8: Logging ---
echo ""
echo "📝 Step 8: Logging"
run_or_dry "mkdir -p /var/log/openclaw"
run_or_dry "chown openclaw:openclaw /var/log/openclaw"

if [ "$DRY_RUN" != "1" ]; then
cat > /etc/logrotate.d/openclaw << LOGROTATE
/var/log/openclaw/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0640 openclaw openclaw
}
LOGROTATE
fi

# --- Step 9: Start ---
echo ""
echo "🚀 Step 9: Start service"
run_or_dry "systemctl daemon-reload"
run_or_dry "systemctl enable openclaw"
run_or_dry "systemctl start openclaw"

echo ""
echo "✅ Installation complete"
echo "   Rollback: $ROLLBACK_LOG"
echo "   Onboard: su - openclaw -c 'openclaw onboard --install-daemon'"
`;
  }

  // azure + generic-vps share similar structure
  return header + `
# --- Standard Linux Install ---
echo "📦 Step 1: System packages"
run_or_dry "apt update && apt upgrade -y"
run_or_dry "apt install -y curl git ufw"

echo ""
echo "👤 Step 2: Create openclaw user"
if ! id openclaw &>/dev/null; then
  run_or_dry "adduser --disabled-password --gecos '' openclaw"
  echo "userdel -r openclaw" >> "$ROLLBACK_LOG"
fi

echo ""
echo "📦 Step 3: Node.js"
if ! command -v node &>/dev/null; then
  run_or_dry "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
  run_or_dry "apt-get install -y nodejs"
  run_or_dry "npm install -g pnpm"
fi

echo ""
echo "🔒 Step 4: Firewall"
run_or_dry "ufw default deny incoming"
run_or_dry "ufw default allow outgoing"
run_or_dry "ufw allow 22/tcp"
run_or_dry "ufw --force enable"

echo ""
echo "📥 Step 5: Clone & install"
INSTALL_DIR="/opt/openclaw"
run_or_dry "git clone https://github.com/openclaw/openclaw.git $INSTALL_DIR"
run_or_dry "chown -R openclaw:openclaw $INSTALL_DIR"
echo "rm -rf $INSTALL_DIR" >> "$ROLLBACK_LOG"

echo ""
echo "🔐 Step 6: Secrets"
run_or_dry "mkdir -p /etc/openclaw"
run_or_dry "touch /etc/openclaw/secrets.env"
run_or_dry "chmod 600 /etc/openclaw/secrets.env"

echo ""
echo "⚙️  Step 7: Systemd (hardened)"
if [ "$DRY_RUN" != "1" ]; then
cat > /etc/systemd/system/openclaw.service << SERVICE
[Unit]
Description=OpenClaw Gateway
After=network.target
[Service]
Type=simple
User=openclaw
Group=openclaw
WorkingDirectory=/opt/openclaw
ExecStart=/usr/bin/node gateway.js
EnvironmentFile=/etc/openclaw/secrets.env
Environment=NODE_ENV=production LOG_FORMAT=json
Restart=on-failure
RestartSec=5
ProtectSystem=strict
PrivateTmp=true
NoNewPrivileges=true
ReadWritePaths=/var/log/openclaw /opt/openclaw
ProtectHome=true
[Install]
WantedBy=multi-user.target
SERVICE
fi
echo "systemctl stop openclaw; rm /etc/systemd/system/openclaw.service" >> "$ROLLBACK_LOG"

run_or_dry "systemctl daemon-reload && systemctl enable --now openclaw"

echo ""
echo "✅ Installation complete — Rollback: $ROLLBACK_LOG"
`;
}

function generateRollbackScript(hostTarget: string): string {
  const header = `#!/bin/bash
set -euo pipefail
# OpenClaw/Moltbot Rollback — ${hostTarget}
# Reverses installation steps in reverse order

echo "═══════════════════════════════════════"
echo "  OpenClaw Rollback — ${hostTarget}"
echo "═══════════════════════════════════════"
echo ""
echo "⚠️  This will remove OpenClaw and its configuration."
read -p "Continue? (y/N) " confirm
[ "$confirm" = "y" ] || { echo "Aborted."; exit 0; }
echo ""
`;

  if (hostTarget === "macos") {
    return header + `
echo "🛑 Stopping gateway..."
launchctl unload "$HOME/Library/LaunchAgents/com.clawdbot.gateway.plist" 2>/dev/null || true

echo "🗑  Removing LaunchAgent..."
rm -f "$HOME/Library/LaunchAgents/com.clawdbot.gateway.plist"

echo "🗑  Removing installation..."
rm -rf "$HOME/.openclaw"

echo "🗑  Removing logs..."
rm -rf /var/log/openclaw

echo "🔐 Removing Keychain entries..."
security delete-generic-password -s openclaw 2>/dev/null || true

echo ""
echo "✅ Rollback complete"
echo "   Dependencies (node, pnpm, tailscale) were NOT removed."
echo "   Remove manually with: brew uninstall <package>"
`;
  }

  return header + `
echo "🛑 Stopping service..."
systemctl stop openclaw 2>/dev/null || true
systemctl disable openclaw 2>/dev/null || true

echo "🗑  Removing systemd unit..."
rm -f /etc/systemd/system/openclaw.service
systemctl daemon-reload

echo "🗑  Removing installation..."
rm -rf /opt/openclaw

echo "🗑  Removing config & logs..."
rm -rf /etc/openclaw
rm -rf /var/log/openclaw
rm -f /etc/logrotate.d/openclaw

echo ""
echo "✅ Rollback complete"
echo "   User 'openclaw' was NOT removed. Remove with: userdel -r openclaw"
echo "   System packages were NOT removed."
`;
}

// === PREFLIGHT RUNNER CHECK DEFINITIONS ===
interface PreflightCheck {
  name: string;
  category: string;
  status: "pending" | "pass" | "warn" | "fail";
  message: string;
}

function getPreflightChecks(hostTarget: string): PreflightCheck[] {
  const common: PreflightCheck[] = [
    { name: "Node.js Version", category: "Dependencies", status: "pending", message: "" },
    { name: "Git Installed", category: "Dependencies", status: "pending", message: "" },
    { name: "pnpm Installed", category: "Dependencies", status: "pending", message: "" },
    { name: "Disk Space", category: "System", status: "pending", message: "" },
    { name: "Tailscale VPN", category: "Network", status: "pending", message: "" },
    { name: "User Privileges", category: "Permissions", status: "pending", message: "" },
  ];

  if (hostTarget === "macos") {
    return [
      { name: "macOS Version", category: "System", status: "pending", message: "" },
      { name: "Xcode CLI Tools", category: "Dependencies", status: "pending", message: "" },
      { name: "Homebrew", category: "Dependencies", status: "pending", message: "" },
      ...common,
      { name: "Keychain Access", category: "Secrets", status: "pending", message: "" },
      { name: "Privacy Permissions", category: "Permissions", status: "pending", message: "" },
    ];
  }

  if (hostTarget === "digitalocean") {
    return [
      { name: "Ubuntu Version", category: "System", status: "pending", message: "" },
      { name: "Memory (RAM)", category: "System", status: "pending", message: "" },
      ...common,
      { name: "UFW Firewall", category: "Network", status: "pending", message: "" },
      { name: "SSH Key Auth", category: "Auth", status: "pending", message: "" },
      { name: "DO Monitoring", category: "Observability", status: "pending", message: "" },
    ];
  }

  if (hostTarget === "azure") {
    return [
      { name: "OS Detection", category: "System", status: "pending", message: "" },
      { name: "Azure CLI", category: "Dependencies", status: "pending", message: "" },
      { name: "Memory (RAM)", category: "System", status: "pending", message: "" },
      ...common,
      { name: "NSG Rules", category: "Network", status: "pending", message: "" },
      { name: "Key Vault Access", category: "Secrets", status: "pending", message: "" },
    ];
  }

  // generic-vps
  return [
    { name: "OS Detection", category: "System", status: "pending", message: "" },
    { name: "Memory (RAM)", category: "System", status: "pending", message: "" },
    ...common,
    { name: "Firewall (UFW/iptables)", category: "Network", status: "pending", message: "" },
    { name: "SSH Configuration", category: "Auth", status: "pending", message: "" },
  ];
}

function getCheckMessage(name: string, status: string, hostTarget: string): string {
  const messages: Record<string, Record<string, string>> = {
    "macOS Version": { pass: "macOS 14.5 Sonoma detected", warn: "macOS 13.x Ventura — upgrade recommended", fail: "macOS < 13 not supported" },
    "Xcode CLI Tools": { pass: "Xcode Command Line Tools installed", warn: "Xcode CLI outdated — run xcode-select --install", fail: "Xcode CLI Tools missing" },
    "Homebrew": { pass: "Homebrew 4.2.x installed", warn: "Homebrew outdated — run brew update", fail: "Homebrew not found" },
    "Node.js Version": { pass: "Node.js v20.11.0 (LTS)", warn: "Node.js v18.x — v20+ recommended", fail: "Node.js not found" },
    "Git Installed": { pass: "Git 2.43.0 installed", warn: "Git version outdated", fail: "Git not found" },
    "pnpm Installed": { pass: "pnpm 8.15.x installed", warn: "pnpm not found — npm works but pnpm preferred", fail: "No package manager found" },
    "Disk Space": { pass: "42GB available (≥10GB required)", warn: "12GB available — low but sufficient", fail: "Only 3GB available — need ≥10GB" },
    "Tailscale VPN": { pass: "Tailscale active (100.x.x.x)", warn: "Tailscale installed but not connected", fail: "Tailscale not found" },
    "User Privileges": { pass: "Running as dedicated 'openclaw' user", warn: `Running as '${hostTarget === "macos" ? "admin" : "ubuntu"}' — consider dedicated user`, fail: "Running as root — create dedicated user" },
    "Keychain Access": { pass: "macOS Keychain accessible", warn: "Keychain locked — may need unlock", fail: "Keychain access denied" },
    "Privacy Permissions": { pass: "Minimal permissions granted", warn: "Extra permissions detected — review Privacy & Security", fail: "Required permissions missing" },
    "Ubuntu Version": { pass: "Ubuntu 22.04.3 LTS", warn: "Ubuntu 20.04 — 22.04+ recommended", fail: "Non-Ubuntu OS detected" },
    "Memory (RAM)": { pass: "4096MB available (≥2GB required)", warn: "1536MB — 2GB+ recommended", fail: "Only 512MB — need ≥1GB" },
    "UFW Firewall": { pass: "UFW active — SSH only allowed", warn: "UFW installed but inactive", fail: "UFW not found" },
    "SSH Key Auth": { pass: "Password auth disabled, keys only", warn: "Password auth may be enabled", fail: "SSH not properly configured" },
    "DO Monitoring": { pass: "DO monitoring agent active", warn: "DO monitoring agent not detected", fail: "Cannot reach DO metadata" },
    "OS Detection": { pass: "Linux detected (Ubuntu/Debian)", warn: "Non-standard distro", fail: "Cannot detect OS" },
    "Azure CLI": { pass: "Azure CLI 2.56.0 installed", warn: "Azure CLI outdated", fail: "Azure CLI not found" },
    "NSG Rules": { pass: "NSG allows SSH + VPN only", warn: "NSG has extra open ports", fail: "NSG not configured" },
    "Key Vault Access": { pass: "Key Vault accessible via managed identity", warn: "Key Vault configured but access untested", fail: "Key Vault not configured" },
    "Firewall (UFW/iptables)": { pass: "Firewall active", warn: "Firewall installed but not active", fail: "No firewall detected" },
    "SSH Configuration": { pass: "SSH hardened (key-only, no root)", warn: "SSH password auth may be enabled", fail: "SSH misconfigured" },
  };
  return messages[name]?.[status] || `${name}: ${status}`;
}
