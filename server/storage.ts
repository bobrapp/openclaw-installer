import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";
import {
  installLogs,
  installState,
  hardeningChecks,
  type InsertInstallLog,
  type InsertInstallState,
  type InsertHardeningCheck,
  type InstallLog,
  type InstallState,
  type HardeningCheck,
} from "@shared/schema";

const sqlite = new Database("openclaw.db");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite);

export interface IStorage {
  // Logs
  addLog(log: InsertInstallLog): InstallLog;
  getLogs(host?: string): InstallLog[];
  clearLogs(): void;

  // Install state
  getOrCreateState(): InstallState;
  updateState(id: number, updates: Partial<InsertInstallState>): InstallState;
  resetState(): InstallState;

  // Hardening checks
  getHardeningChecks(hostTarget: string): HardeningCheck[];
  toggleHardeningCheck(id: number): HardeningCheck;
  seedHardeningChecks(): void;
}

export class SqliteStorage implements IStorage {
  addLog(log: InsertInstallLog): InstallLog {
    return db.insert(installLogs).values(log).returning().get();
  }

  getLogs(host?: string): InstallLog[] {
    if (host) {
      return db.select().from(installLogs).where(eq(installLogs.host, host)).orderBy(desc(installLogs.id)).all();
    }
    return db.select().from(installLogs).orderBy(desc(installLogs.id)).all();
  }

  clearLogs(): void {
    db.delete(installLogs).run();
  }

  getOrCreateState(): InstallState {
    const existing = db.select().from(installState).get();
    if (existing) return existing;
    return db.insert(installState).values({
      hostTarget: "macos",
      currentStep: 0,
      stepsCompleted: "[]",
      preflightResults: "{}",
      configValues: "{}",
      rollbackScripts: "[]",
      status: "pending",
    }).returning().get();
  }

  updateState(id: number, updates: Partial<InsertInstallState>): InstallState {
    return db.update(installState).set(updates).where(eq(installState.id, id)).returning().get();
  }

  resetState(): InstallState {
    db.delete(installState).run();
    return this.getOrCreateState();
  }

  getHardeningChecks(hostTarget: string): HardeningCheck[] {
    return db.select().from(hardeningChecks).where(eq(hardeningChecks.hostTarget, hostTarget)).all();
  }

  toggleHardeningCheck(id: number): HardeningCheck {
    const check = db.select().from(hardeningChecks).where(eq(hardeningChecks.id, id)).get();
    if (!check) throw new Error("Check not found");
    return db.update(hardeningChecks)
      .set({ isCompleted: check.isCompleted ? 0 : 1 })
      .where(eq(hardeningChecks.id, id))
      .returning()
      .get();
  }

  seedHardeningChecks(): void {
    const existing = db.select().from(hardeningChecks).all();
    if (existing.length > 0) return;

    const checks: InsertHardeningCheck[] = [
      // macOS checks
      { category: "Network", title: "Bind gateway to localhost only", description: "Ensure com.clawdbot.gateway listens on 127.0.0.1 only. Never bind to 0.0.0.0.", command: "launchctl print system/com.clawdbot.gateway | grep SockNodeName", hostTarget: "macos", severity: "critical" },
      { category: "Network", title: "Enable Tailscale for remote access", description: "Use Tailscale or WireGuard VPN instead of exposing ports publicly. Install via brew install tailscale.", command: "tailscale status", hostTarget: "macos", severity: "critical" },
      { category: "Permissions", title: "Run under dedicated user account", description: "Create a separate macOS user (e.g., openclaw) with limited permissions. Never run as admin.", command: "whoami", hostTarget: "macos", severity: "critical" },
      { category: "Permissions", title: "Audit Privacy & Security grants", description: "Review System Settings → Privacy & Security. Minimize Accessibility, Full Disk Access, and Screen Recording grants.", command: null, hostTarget: "macos", severity: "critical" },
      { category: "Permissions", title: "Limit enabled skills/channels", description: "Start with fewer skills and messaging channels to reduce blast radius. Add incrementally.", command: null, hostTarget: "macos", severity: "recommended" },
      { category: "Secrets", title: "Store secrets in macOS Keychain", description: "Use security add-generic-password for API keys. Never store in .env files or shell history.", command: "security find-generic-password -s openclaw 2>/dev/null && echo 'found' || echo 'not found'", hostTarget: "macos", severity: "critical" },
      { category: "Logging", title: "Enable immutable structured logging", description: "Configure JSON log output with no PII. Use append-only log files with rotation.", command: null, hostTarget: "macos", severity: "critical" },
      { category: "Logging", title: "Configure log rotation", description: "Set up newsyslog or logrotate for /var/log/openclaw/ to prevent disk exhaustion.", command: "ls /etc/newsyslog.d/openclaw.conf 2>/dev/null || echo 'not configured'", hostTarget: "macos", severity: "recommended" },
      { category: "Observability", title: "Health check endpoint", description: "Ensure /health endpoint returns 200 with uptime, version, and memory usage.", command: "curl -s http://127.0.0.1:3000/health | head -1", hostTarget: "macos", severity: "recommended" },
      { category: "Observability", title: "Disk and memory alerts", description: "Configure threshold alerts for disk > 85% and memory > 80% usage.", command: "df -h / | tail -1", hostTarget: "macos", severity: "optional" },
      { category: "Updates", title: "Enable automatic security updates", description: "Keep macOS and Homebrew packages current with automatic security patches.", command: "softwareupdate --list 2>&1 | head -3", hostTarget: "macos", severity: "recommended" },
      { category: "Backup", title: "Configure state backup", description: "Back up SQLite state and config files to encrypted external storage on a schedule.", command: null, hostTarget: "macos", severity: "recommended" },

      // DigitalOcean checks
      { category: "Network", title: "Bind to loopback or Tailscale only", description: "Gateway must listen on 127.0.0.1 or Tailscale interface. Never expose to public internet.", command: "ss -tlnp | grep -E '(3000|8080)'", hostTarget: "digitalocean", severity: "critical" },
      { category: "Network", title: "Configure UFW firewall", description: "Allow only SSH (22) and intentional reverse proxy ports. Deny all other inbound traffic.", command: "ufw status verbose", hostTarget: "digitalocean", severity: "critical" },
      { category: "Network", title: "Install and configure Tailscale", description: "Use Tailscale for secure remote access instead of public port exposure.", command: "tailscale status", hostTarget: "digitalocean", severity: "critical" },
      { category: "Auth", title: "SSH key-only authentication", description: "Disable password authentication in /etc/ssh/sshd_config. Use SSH keys only.", command: "grep PasswordAuthentication /etc/ssh/sshd_config", hostTarget: "digitalocean", severity: "critical" },
      { category: "Auth", title: "Disable root login", description: "Set PermitRootLogin no in sshd_config. Use the openclaw user with sudo.", command: "grep PermitRootLogin /etc/ssh/sshd_config", hostTarget: "digitalocean", severity: "critical" },
      { category: "Secrets", title: "Store secrets as env vars or secret files", description: "Never store API keys in prompts, logs, or version control. Use /etc/openclaw/secrets.env with 600 permissions.", command: "stat -c '%a' /etc/openclaw/secrets.env 2>/dev/null || echo 'not found'", hostTarget: "digitalocean", severity: "critical" },
      { category: "Data", title: "No PII on droplet", description: "Never store customer PII on the agent droplet. Use sandbox-only connectors, no production CRM endpoints.", command: null, hostTarget: "digitalocean", severity: "critical" },
      { category: "Data", title: "Sandbox-only connectors", description: "Connect only to sandbox/staging APIs. Never point at production file systems or databases.", command: null, hostTarget: "digitalocean", severity: "critical" },
      { category: "Service", title: "Harden systemd unit", description: "Use ProtectSystem=strict, PrivateTmp=true, NoNewPrivileges=true in the systemd service file.", command: "systemctl cat openclaw.service | grep -E '(ProtectSystem|PrivateTmp|NoNewPrivileges)'", hostTarget: "digitalocean", severity: "critical" },
      { category: "Logging", title: "Structured JSON logging with no PII", description: "Configure JSON log output. Ensure no user data, emails, or tokens appear in logs.", command: "journalctl -u openclaw -n 5 --output=json-pretty | head -20", hostTarget: "digitalocean", severity: "critical" },
      { category: "Logging", title: "Configure logrotate", description: "Set up /etc/logrotate.d/openclaw for log rotation with 7-day retention.", command: "cat /etc/logrotate.d/openclaw 2>/dev/null || echo 'not configured'", hostTarget: "digitalocean", severity: "recommended" },
      { category: "Observability", title: "Health check endpoint", description: "Ensure /health endpoint returns 200. Use for uptime monitoring via DO Monitoring or external service.", command: "curl -s http://127.0.0.1:3000/health", hostTarget: "digitalocean", severity: "recommended" },
      { category: "Observability", title: "Enable DO Monitoring agent", description: "Install DigitalOcean monitoring agent for CPU, memory, and disk alerts.", command: "systemctl is-active do-agent", hostTarget: "digitalocean", severity: "recommended" },
      { category: "Observability", title: "Antfarm cron health check", description: "Verify Antfarm 2-minute cron is running and writing to antfarm.log.", command: "crontab -l | grep antfarm", hostTarget: "digitalocean", severity: "recommended" },
      { category: "Updates", title: "Enable unattended upgrades", description: "Install and configure unattended-upgrades for automatic security patches.", command: "dpkg -l | grep unattended-upgrades", hostTarget: "digitalocean", severity: "recommended" },

      // Azure VM checks
      { category: "Network", title: "NSG: Allow SSH and VPN only", description: "Configure Azure Network Security Group to allow only SSH (22) and Tailscale/WireGuard traffic.", command: "az network nsg rule list --nsg-name openclaw-nsg -o table 2>/dev/null || echo 'az cli not configured'", hostTarget: "azure", severity: "critical" },
      { category: "Network", title: "Bind gateway to loopback", description: "Same as DO — bind to 127.0.0.1 and use Tailscale for remote access.", command: "ss -tlnp | grep -E '(3000|8080)'", hostTarget: "azure", severity: "critical" },
      { category: "Auth", title: "SSH key-only via Azure", description: "Use Azure-managed SSH keys. Disable password auth.", command: "grep PasswordAuthentication /etc/ssh/sshd_config", hostTarget: "azure", severity: "critical" },
      { category: "Secrets", title: "Use Azure Key Vault", description: "Store API keys and secrets in Azure Key Vault. Reference via managed identity.", command: null, hostTarget: "azure", severity: "critical" },
      { category: "Service", title: "Harden systemd unit", description: "Same hardening as DO — ProtectSystem, PrivateTmp, NoNewPrivileges.", command: "systemctl cat openclaw.service | grep -E '(ProtectSystem|PrivateTmp|NoNewPrivileges)'", hostTarget: "azure", severity: "critical" },
      { category: "Logging", title: "Structured JSON logging, no PII", description: "Configure JSON log format. Ship logs to Azure Log Analytics if needed.", command: null, hostTarget: "azure", severity: "critical" },
      { category: "Observability", title: "Azure Monitor agent", description: "Install Azure Monitor agent for VM-level metrics and alerting.", command: "systemctl is-active azuremonitoragent", hostTarget: "azure", severity: "recommended" },
      { category: "Data", title: "No PII on VM", description: "Same data governance as DO — sandbox connectors only, no production data.", command: null, hostTarget: "azure", severity: "critical" },

      // Generic VPS checks
      { category: "Network", title: "Firewall: SSH + VPN only", description: "Configure iptables or ufw to allow only SSH and VPN. Deny all other inbound.", command: "ufw status verbose 2>/dev/null || iptables -L INPUT -n 2>/dev/null | head -10", hostTarget: "generic-vps", severity: "critical" },
      { category: "Network", title: "Bind to loopback + Tailscale", description: "Bind gateway to 127.0.0.1. Use Tailscale or WireGuard for access.", command: "ss -tlnp | grep -E '(3000|8080)'", hostTarget: "generic-vps", severity: "critical" },
      { category: "Auth", title: "SSH key-only, no root login", description: "Disable password auth and root login in sshd_config.", command: "grep -E '(PasswordAuthentication|PermitRootLogin)' /etc/ssh/sshd_config", hostTarget: "generic-vps", severity: "critical" },
      { category: "Secrets", title: "Env vars or secret files (600 perms)", description: "Store secrets in /etc/openclaw/secrets.env with mode 600. Never in logs or .env in repo.", command: null, hostTarget: "generic-vps", severity: "critical" },
      { category: "Service", title: "Hardened systemd unit", description: "ProtectSystem=strict, PrivateTmp=true, NoNewPrivileges=true in service file.", command: "systemctl cat openclaw.service | grep -E '(ProtectSystem|PrivateTmp|NoNewPrivileges)'", hostTarget: "generic-vps", severity: "critical" },
      { category: "Logging", title: "Structured JSON logging, no PII", description: "JSON log output with immutable append. No customer data in logs.", command: null, hostTarget: "generic-vps", severity: "critical" },
      { category: "Observability", title: "Health check endpoint", description: "Expose /health on localhost for monitoring.", command: "curl -s http://127.0.0.1:3000/health", hostTarget: "generic-vps", severity: "recommended" },
      { category: "Data", title: "No PII, sandbox connectors only", description: "Never store production customer data. Use sandbox API endpoints only.", command: null, hostTarget: "generic-vps", severity: "critical" },
    ];

    for (const check of checks) {
      db.insert(hardeningChecks).values(check).run();
    }
  }
}

export const storage = new SqliteStorage();
// Seed on startup
storage.seedHardeningChecks();
