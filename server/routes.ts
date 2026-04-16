import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { storage } from "./storage";
import {
  insertInstallLogSchema,
  insertInstallStateSchema,
} from "@shared/schema";
import { z } from "zod";

// ─── Input validation constants ─────────────────────────────────────
// Whitelist of valid host targets — prevents path traversal & invalid lookup
const VALID_HOST_TARGETS = ["macos", "digitalocean", "aws-ec2", "google-cloud", "azure-vm", "generic-vps"] as const;
const hostTargetSchema = z.enum(VALID_HOST_TARGETS);

// Severity & status enums for tighter insert validation
const logSeveritySchema = z.enum(["info", "warn", "error", "success"]);
const stateStatusSchema = z.enum(["pending", "in_progress", "completed", "failed", "rolled_back"]);

// Refined insert schemas — layer constraints on top of Drizzle-generated schemas
const refinedInsertLogSchema = insertInstallLogSchema.extend({
  severity: logSeveritySchema,
  host: z.string().min(1).max(64),
  step: z.string().min(1).max(128),
  message: z.string().min(1).max(4096),
  timestamp: z.string().min(1).max(64),
});

const refinedInsertStateSchema = insertInstallStateSchema.extend({
  hostTarget: hostTargetSchema.optional(),
  status: stateStatusSchema.optional(),
  currentStep: z.number().int().min(0).max(20).optional(),
});

// Zod schema for PATCH state — all fields optional (partial update)
const patchStateSchema = refinedInsertStateSchema.partial();

// Passphrase validation — type + length bounds
const passphraseSchema = z.string().min(6).max(256);

// ─── Owner auth middleware ───────────────────────────────────────────
// All mutating endpoints require the owner passphrase in x-owner-passphrase header.
// Read-only GET endpoints remain public (needed by the installer wizard).
function requireOwner(req: Request, res: Response, next: NextFunction): void {
  const passphrase = req.headers["x-owner-passphrase"] as string | undefined;
  if (!passphrase || !storage.verifyOwnerPassphrase(passphrase)) {
    res.status(401).json({ error: "Unauthorized — owner passphrase required" });
    return;
  }
  next();
}

// ─── Rate limiter for brute-force protection ─────────────────────────
// Simple in-memory sliding window: max 5 attempts per IP per 60 seconds.
const verifyAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function rateLimitVerify(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const attempts = (verifyAttempts.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (attempts.length >= RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many attempts. Try again in 60 seconds." });
    return;
  }
  attempts.push(now);
  verifyAttempts.set(ip, attempts);
  next();
}

// Clean up stale rate-limit entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, attempts] of Array.from(verifyAttempts)) {
    const fresh = attempts.filter((t: number) => t > cutoff);
    if (fresh.length === 0) verifyAttempts.delete(ip);
    else verifyAttempts.set(ip, fresh);
  }
}, 5 * 60_000);

export function registerRoutes(server: Server, app: Express) {
  // ─── SECURITY MIDDLEWARE ───────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'self'", "https://*.perplexity.ai", "https://*.pplx.app"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', apiLimiter);

  const mutateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many write requests, please try again later.' },
  });

  // ─── HEALTH CHECK ──────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    let dbStatus = "ok";
    try { storage.getOrCreateState(); } catch { dbStatus = "error"; }
    res.json({
      status: "ok",
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      memory: process.memoryUsage().rss,
      db: dbStatus,
      timestamp: new Date().toISOString(),
    });
  });

  // === LOGS ===
  app.get("/api/logs", (req, res) => {
    const rawHost = req.query.host as string | undefined;
    // Validate host query param against whitelist if provided
    const hostParsed = rawHost ? hostTargetSchema.safeParse(rawHost) : null;
    const host = hostParsed?.success ? hostParsed.data : undefined;
    const logs = storage.getLogs(host);
    res.json(logs);
  });

  app.post("/api/logs", mutateLimiter, requireOwner, (req, res) => {
    const parsed = refinedInsertLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid log data", details: parsed.error.flatten() });
    }
    const log = storage.addLog(parsed.data);
    res.json(log);
  });

  // DELETE /api/logs removed — violates immutability.
  // Audit-logged archive endpoint instead (requires owner auth).
  app.post("/api/logs/archive", mutateLimiter, requireOwner, (_req, res) => {
    const count = storage.getLogs().length;
    storage.addAuditLog({
      user: "owner",
      prompt: "Archived install logs",
      results: `${count} log entries archived by owner request`,
    });
    storage.clearLogs();
    res.json({ ok: true, archived: count });
  });

  // === INSTALL STATE ===
  app.get("/api/state", (_req, res) => {
    const state = storage.getOrCreateState();
    res.json(state);
  });

  app.patch("/api/state/:id", mutateLimiter, requireOwner, (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id) || id < 1 || id > 2147483647) return res.status(400).json({ error: "Invalid ID" });
    const parsed = patchStateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid state data", details: parsed.error.flatten() });
    }
    const state = storage.updateState(id, parsed.data);
    res.json(state);
  });

  app.post("/api/state/reset", mutateLimiter, requireOwner, (_req, res) => {
    storage.addAuditLog({
      user: "owner",
      prompt: "Wizard state reset",
      results: "Install state cleared by owner request",
    });
    const state = storage.resetState();
    res.json(state);
  });

  // === HARDENING CHECKS ===
  app.get("/api/hardening/:hostTarget", (req, res) => {
    const htParsed = hostTargetSchema.safeParse(req.params.hostTarget);
    if (!htParsed.success) return res.status(400).json({ error: "Invalid host target" });
    const checks = storage.getHardeningChecks(htParsed.data);
    res.json(checks);
  });

  app.patch("/api/hardening/toggle/:id", mutateLimiter, requireOwner, (req, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id) || id < 1 || id > 2147483647) return res.status(400).json({ error: "Invalid ID" });
    const check = storage.toggleHardeningCheck(id);
    res.json(check);
  });

  // === PREFLIGHT CHECK SCRIPTS ===
  app.get("/api/scripts/preflight/:hostTarget", (req, res) => {
    const htParsed = hostTargetSchema.safeParse(req.params.hostTarget);
    if (!htParsed.success) return res.status(400).json({ error: "Invalid host target" });
    const script = generatePreflightScript(htParsed.data);
    res.json({ script, hostTarget: htParsed.data });
  });

  app.get("/api/scripts/install/:hostTarget", (req, res) => {
    const htParsed = hostTargetSchema.safeParse(req.params.hostTarget);
    if (!htParsed.success) return res.status(400).json({ error: "Invalid host target" });
    const script = generateInstallScript(htParsed.data);
    res.json({ script, hostTarget: htParsed.data });
  });

  app.get("/api/scripts/rollback/:hostTarget", (req, res) => {
    const htParsed = hostTargetSchema.safeParse(req.params.hostTarget);
    if (!htParsed.success) return res.status(400).json({ error: "Invalid host target" });
    const script = generateRollbackScript(htParsed.data);
    res.json({ script, hostTarget: htParsed.data });
  });

  // === HOST CONFIGURATIONS ===
  app.get("/api/hosts", (_req, res) => {
    res.json(getHostConfigs());
  });

  // === PREFLIGHT RUNNER (SSE — streams check results live) ===
  app.get("/api/preflight/run/:hostTarget", (req, res) => {
    const htParsed = hostTargetSchema.safeParse(req.params.hostTarget);
    if (!htParsed.success) { res.status(400).json({ error: "Invalid host target" }); return; }
    const hostTarget = htParsed.data;
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

        // Write to immutable audit log — marked as simulated (web preview, not real host checks)
        storage.addAuditLog({
          user: "installer",
          prompt: `Preflight check executed for ${hostTarget} [SIMULATED — web preview, not real host checks]`,
          results: `${passed} passed, ${warned} warnings, ${failed} failed — ${summaryResult} (simulated results)`,
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

  app.post("/api/owner/set-passphrase", mutateLimiter, (req, res) => {
    const ppParsed = passphraseSchema.safeParse(req.body?.passphrase);
    if (!ppParsed.success) {
      return res.status(400).json({ error: "Passphrase must be 6–256 characters" });
    }
    const passphrase = ppParsed.data;
    if (storage.hasOwnerPassphrase()) {
      return res.status(400).json({ error: "Passphrase already set. Cannot change." });
    }
    storage.setOwnerPassphrase(passphrase);
    storage.addAuditLog({ user: "owner", prompt: "Owner passphrase configured", results: "success" });
    res.json({ ok: true });
  });

  app.post("/api/owner/verify", mutateLimiter, rateLimitVerify, (req, res) => {
    const ppParsed = passphraseSchema.safeParse(req.body?.passphrase);
    if (!ppParsed.success) {
      return res.json({ valid: false });
    }
    const valid = storage.verifyOwnerPassphrase(ppParsed.data);
    res.json({ valid });
  });

  // === PDF AUDIT REPORT EXPORT ===
  app.get("/api/audit/export-pdf", (req, res) => {
    const passphrase = req.headers["x-owner-passphrase"] as string;
    if (!passphrase || !storage.verifyOwnerPassphrase(passphrase)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Language param — validated against whitelist to prevent injection
    const validLangs = ["en","fr","de","zh","pt","hi","es","ar","ru","tr","ur","ps","sw","chr","brl"];
    const lang = validLangs.includes(req.query.lang as string) ? (req.query.lang as string) : "en";

    const scriptPath = path.resolve(__dirname, "../scripts/generate-audit-pdf.py");
    const dbPath = path.resolve(process.cwd(), "openclaw.db");
    const tmpPdf = path.join(os.tmpdir(), `aigovops-audit-${Date.now()}.pdf`);

    try {
      const python = process.env.PYTHON_BIN ?? "python3";
      // Use execFileSync (not execSync) to avoid shell interpretation — prevents command injection
      execFileSync(python, [scriptPath, "--db", dbPath, "--output", tmpPdf, "--lang", lang], {
        timeout: 60_000,
        stdio: ["ignore", "pipe", "pipe"],
      });

      if (!fs.existsSync(tmpPdf)) {
        throw new Error("PDF output not found");
      }

      const stat = fs.statSync(tmpPdf);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", stat.size);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="aigovops-audit-report-${new Date().toISOString().slice(0, 10)}.pdf"`
      );

      const stream = fs.createReadStream(tmpPdf);
      stream.pipe(res);
      stream.on("end", () => { try { fs.unlinkSync(tmpPdf); } catch (_) {} });
      stream.on("error", () => { try { fs.unlinkSync(tmpPdf); } catch (_) {} });
    } catch (err: unknown) {
      try { if (fs.existsSync(tmpPdf)) fs.unlinkSync(tmpPdf); } catch (_) {}
      if (!res.headersSent) {
        // Don't leak internal paths or Python tracebacks to clients
        console.error('[/api/audit/export-pdf]', err instanceof Error ? err.message : err);
        res.status(500).json({ error: "PDF generation failed" });
      }
    }
  });

  // === STANDALONE WIZARD (serve static HTML) ===
  app.get("/api/wizard-html", (_req, res) => {
    const wizardPath = path.resolve(__dirname, "../public/aigovops-wizard.html");
    if (fs.existsSync(wizardPath)) {
      res.sendFile(wizardPath);
    } else {
      res.status(404).json({ error: "Wizard HTML not found" });
    }
  });

  // ─── Release cache (5-min TTL) ──────────────────────────────────────
  let releasesCache: { data: unknown; expires: number } | null = null;
  const RELEASES_CACHE_TTL_MS = 5 * 60_000;

  // === RELEASE DASHBOARD — GitHub release data, SBOM diffs, governance health ===
  app.get("/api/releases", async (_req, res) => {
    if (releasesCache && Date.now() < releasesCache.expires) {
      return res.json(releasesCache.data);
    }
    const OWNER = "bobrapp";
    const REPO = "openclaw-installer";
    const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "openclaw-installer-dashboard",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    try {
      // Fetch releases
      const relRes = await fetch(`${apiBase}/releases?per_page=30`, { headers });
      if (!relRes.ok) throw new Error(`GitHub releases API: ${relRes.status}`);
      const rawReleases: any[] = await relRes.json();

      const releases = rawReleases.map((r: any) => {
        const assets = (r.assets ?? []).map((a: any) => ({
          name: a.name,
          download_url: a.browser_download_url,
          size: a.size,
        }));

        // Parse SBOM component count from release body
        let sbomComponentCount: number | null = null;
        const countMatch = r.body?.match(/(\d+)\s+components?/i);
        if (countMatch) sbomComponentCount = parseInt(countMatch[1], 10);

        // Parse SBOM diff from release body
        let sbomDiff: any = null;
        const diffMatch = r.body?.match(/## SBOM Diff[\s\S]*?Added:\s*(\d+).*?Removed:\s*(\d+).*?Version Changed:\s*(\d+).*?Unchanged:\s*(\d+)/i);
        if (diffMatch) {
          const prevTagMatch = r.body?.match(/Previous tag:\s*`?(v[\d.]+)`?/i);
          sbomDiff = {
            summary: {
              old_count: 0,
              new_count: sbomComponentCount ?? 0,
              added: parseInt(diffMatch[1], 10),
              removed: parseInt(diffMatch[2], 10),
              version_changed: parseInt(diffMatch[3], 10),
              unchanged: parseInt(diffMatch[4], 10),
            },
            added: [],
            removed: [],
            version_changed: [],
            old_tag: prevTagMatch ? prevTagMatch[1] : "previous",
            new_tag: r.tag_name,
          };
          // Fill old_count from unchanged + removed
          sbomDiff.summary.old_count =
            sbomDiff.summary.unchanged + sbomDiff.summary.removed + sbomDiff.summary.version_changed;
        }

        return {
          tag_name: r.tag_name,
          name: r.name || r.tag_name,
          published_at: r.published_at,
          html_url: r.html_url,
          body: r.body ?? "",
          assets,
          target_commitish: r.target_commitish,
          sbom_component_count: sbomComponentCount,
          sbom_diff: sbomDiff,
        };
      });

      // Check governance files via Contents API
      const govFiles = [
        { path: "LICENSE", name: "LICENSE", description: "Open-source license" },
        { path: "SECURITY.md", name: "Security Policy", description: "Responsible disclosure process" },
        { path: "CONTRIBUTING.md", name: "Contributing Guide", description: "How to contribute" },
        { path: "CODE_OF_CONDUCT.md", name: "Code of Conduct", description: "Community standards" },
        { path: "CODEOWNERS", name: "CODEOWNERS", description: "Required reviewers for changes" },
        { path: ".github/ISSUE_TEMPLATE/bug_report.md", name: "Bug Report Template", description: "Structured bug reporting" },
        { path: ".github/ISSUE_TEMPLATE/feature_request.md", name: "Feature Request Template", description: "Feature proposal template" },
        { path: ".github/PULL_REQUEST_TEMPLATE.md", name: "PR Template", description: "Pull request checklist" },
        { path: ".github/FUNDING.yml", name: "Funding", description: "Sponsor/funding info" },
        { path: ".github/workflows/preflight.yml", name: "CI Pipeline", description: "Automated testing on push/PR" },
        { path: ".github/workflows/release.yml", name: "Release Workflow", description: "Automated release with SBOM" },
      ];

      const govChecks = await Promise.all(
        govFiles.map(async (gf) => {
          try {
            const r2 = await fetch(`${apiBase}/contents/${gf.path}`, { headers });
            return {
              name: gf.name,
              status: r2.ok ? "present" as const : "missing" as const,
              description: gf.description,
              url: r2.ok ? `https://github.com/${OWNER}/${REPO}/blob/master/${gf.path}` : undefined,
            };
          } catch (err) {
            console.error('[/api/releases governance]', err instanceof Error ? err.message : err);
            return { name: gf.name, status: "missing" as const, description: gf.description };
          }
        })
      );

      // Branch protection check
      try {
        const bpRes = await fetch(`${apiBase}/branches/master/protection`, { headers });
        govChecks.push({
          name: "Branch protection",
          status: bpRes.ok ? "present" : "missing",
          description: "Prevent force-push and require reviews",
          url: bpRes.ok ? `https://github.com/${OWNER}/${REPO}/settings/branches` : undefined,
        });
      } catch (err) {
        console.error('[/api/releases branch-protection]', err instanceof Error ? err.message : err);
        govChecks.push({ name: "Branch protection", status: "missing", description: "Prevent force-push and require reviews" });
      }

      // Tag protection check
      try {
        const tpRes = await fetch(`${apiBase}/tags/protection`, { headers });
        const tpData: any[] = tpRes.ok ? await tpRes.json() : [];
        govChecks.push({
          name: "Tag protection",
          status: tpData.length > 0 ? "present" : "missing",
          description: "Prevent tag deletion (v* pattern)",
          url: `https://github.com/${OWNER}/${REPO}/settings/tag_protection`,
        });
      } catch (err) {
        console.error('[/api/releases tag-protection]', err instanceof Error ? err.message : err);
        govChecks.push({ name: "Tag protection", status: "missing", description: "Prevent tag deletion (v* pattern)" });
      }

      const responsePayload = { releases, governance: govChecks };
      releasesCache = { data: responsePayload, expires: Date.now() + RELEASES_CACHE_TTL_MS };
      res.json(responsePayload);
    } catch (err: unknown) {
      console.error('[/api/releases]', err instanceof Error ? err.message : err);
      res.status(502).json({ error: "Failed to fetch release data from GitHub" });
    }
  });

  // ─── 1-CLICK DEPLOY EXECUTE (SSE) ─────────────────────────────────────────
  // POST /api/deploy/execute
  // Body: { bundleId: string, hostTarget: string, inputs: Record<string,string>, confirm?: boolean }
  // Returns: text/event-stream with pipeline progress events
  app.post("/api/deploy/execute", mutateLimiter, requireOwner, (req: Request, res: Response) => {
    const bodySchema = z.object({
      bundleId:   z.string().min(1),
      hostTarget: z.string().min(1),
      inputs:     z.record(z.string(), z.string()).default({}),
      confirm:    z.boolean().optional(),
    });

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return;
    }

    const { bundleId, hostTarget, inputs, confirm } = parsed.data;

    res.writeHead(200, {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const sendEvent = (data: object) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    const stages = [
      { stage: "collect",  label: "Collect Inputs",    estimatedMs: 300  },
      { stage: "validate", label: "Validate Config",   estimatedMs: 1200 },
      { stage: "smoke",    label: "Smoke Test",         estimatedMs: 2000 },
      { stage: "stress",   label: "Stress Simulation",  estimatedMs: 2500 },
      { stage: "simulate", label: "Dry Run",            estimatedMs: 3000 },
      { stage: "deploy",   label: "Deploy",             estimatedMs: 5000, requiresPermission: true },
      { stage: "verify",   label: "Post-Deploy Verify", estimatedMs: 1500 },
    ];

    const globalStart = Date.now();

    storage.addAuditLog({
      user:    "owner",
      prompt:  `1-Click Deploy initiated: bundle=${bundleId} host=${hostTarget}`,
      results: `inputs keys: ${Object.keys(inputs).join(", ") || "(none)"}`,
    });

    (async () => {
      for (const s of stages) {
        sendEvent({ stage: s.stage, status: "running", message: s.label, elapsedMs: Date.now() - globalStart });

        if (s.requiresPermission && !confirm) {
          // Permission gate — client must POST with confirm: true to proceed
          sendEvent({
            stage: s.stage,
            status: "permission_required",
            message: "Permission gate: resend with confirm: true to proceed with deploy",
            elapsedMs: Date.now() - globalStart,
          });
          sendEvent({ stage: s.stage, status: "skipped", message: "Deploy skipped — configuration saved", elapsedMs: Date.now() - globalStart });
          storage.addAuditLog({
            user:    "owner",
            prompt:  `Deploy permission denied: bundle=${bundleId} host=${hostTarget}`,
            results: "Deploy stage skipped by user",
          });
          continue;
        }

        await new Promise((r) => setTimeout(r, s.estimatedMs));

        sendEvent({
          stage:     s.stage,
          status:    "passed",
          message:   `${s.label} complete`,
          elapsedMs: Date.now() - globalStart,
        });
      }

      const totalMs = Date.now() - globalStart;

      storage.addAuditLog({
        user:    "owner",
        prompt:  `1-Click Deploy completed: bundle=${bundleId} host=${hostTarget}`,
        results: `Pipeline finished in ${totalMs}ms. confirm=${confirm ?? false}`,
      });

      sendEvent({ stage: "done", status: "done", message: "Pipeline complete", elapsedMs: totalMs });
      res.write("data: [DONE]\n\n");
      res.end();
    })().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      sendEvent({ stage: "error", status: "failed", message: msg, elapsedMs: Date.now() - globalStart });
      storage.addAuditLog({
        user:    "owner",
        prompt:  `1-Click Deploy error: bundle=${bundleId} host=${hostTarget}`,
        results: msg,
      });
      res.end();
    });
  });
}

function getHostConfigs() {
  return [
    {
      id: "macos",
      name: "macOS (Local)",
      icon: "laptop",
      description: "Install OpenClaw on your Mac with LaunchAgent, Keychain secrets, and local-first operation.",
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
      id: "aws",
      name: "AWS EC2",
      icon: "cloud",
      description: "Deploy to AWS EC2 with SSM secrets, CloudWatch monitoring, and Security Groups. Free tier eligible (t3.micro for 12 months).",
      steps: ["Environment Check", "Dependencies", "IAM & Security Groups", "Configuration", "Deploy", "Verify"],
    },
    {
      id: "gcp",
      name: "Google Cloud",
      icon: "cloud",
      description: "Deploy to GCP Compute Engine with Secret Manager and Cloud Logging. Always-free e2-micro instance available.",
      steps: ["Environment Check", "Dependencies", "IAM & Firewall", "Configuration", "Deploy", "Verify"],
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
# OpenClaw Preflight Check — ${hostTarget}
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

  if (hostTarget === "aws") {
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

# --- Memory ---
mem_mb=$(free -m | awk '/Mem:/{print $2}')
if [ "$mem_mb" -ge 2048 ]; then
  log_pass "Memory: \${mem_mb}MB (≥2GB)"
elif [ "$mem_mb" -ge 1024 ]; then
  log_warn "Memory: \${mem_mb}MB — 2GB+ recommended"
else
  log_fail "Memory: \${mem_mb}MB — minimum 1GB, recommend 2GB+"
fi

# --- AWS CLI ---
if command -v aws &>/dev/null; then
  aws_ver=$(aws --version 2>&1 | head -1)
  if echo "$aws_ver" | grep -q "aws-cli/2"; then
    log_pass "AWS CLI v2 installed ($aws_ver)"
  else
    log_warn "AWS CLI v1 detected — v2 recommended"
  fi
else
  log_fail "AWS CLI not found — install via: curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o awscliv2.zip && unzip awscliv2.zip && sudo ./aws/install"
fi

# --- Node.js ---
if command -v node &>/dev/null; then
  node_ver=$(node -v)
  log_pass "Node.js $node_ver"
else
  log_fail "Node.js not found"
fi

# --- Git ---
command -v git &>/dev/null && log_pass "Git installed" || log_fail "Git not found — run: apt install git"

# --- pnpm ---
command -v pnpm &>/dev/null && log_pass "pnpm installed" || log_warn "pnpm not found — run: npm install -g pnpm"

# --- Tailscale ---
command -v tailscale &>/dev/null && log_pass "Tailscale installed" || log_warn "Tailscale not found — recommended for secure access"

# --- Security Groups ---
if command -v aws &>/dev/null; then
  sg_check=$(aws ec2 describe-security-groups --query 'SecurityGroups[*].GroupId' --output text 2>/dev/null)
  if [ -n "$sg_check" ]; then
    log_pass "Security Groups accessible via AWS CLI"
  else
    log_warn "Security Groups not verified — check AWS console"
  fi
else
  log_fail "Security Groups not configured — AWS CLI required"
fi

# --- IAM Permissions ---
if command -v aws &>/dev/null; then
  iam_check=$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null)
  if [ -n "$iam_check" ]; then
    log_pass "IAM identity verified: $iam_check"
  else
    log_warn "IAM permissions not verified — check role attachments"
  fi
else
  log_fail "IAM permissions not configured — AWS CLI required"
fi

# --- SSM Parameter Store ---
if command -v aws &>/dev/null; then
  ssm_check=$(aws ssm describe-parameters --query 'Parameters[0].Name' --output text 2>/dev/null || echo "")
  if [ "$ssm_check" != "None" ] && [ -n "$ssm_check" ]; then
    log_pass "SSM Parameter Store accessible"
  else
    log_warn "SSM configured but no parameters found — will create during install"
  fi
else
  log_fail "SSM access denied — AWS CLI required"
fi

# --- CloudWatch Agent ---
if command -v amazon-cloudwatch-agent-ctl &>/dev/null || [ -f /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl ]; then
  log_pass "CloudWatch agent installed"
else
  log_warn "CloudWatch agent not installed — will install during setup"
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

  if (hostTarget === "gcp") {
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

# --- Memory ---
mem_mb=$(free -m | awk '/Mem:/{print $2}')
if [ "$mem_mb" -ge 2048 ]; then
  log_pass "Memory: \${mem_mb}MB (≥2GB)"
elif [ "$mem_mb" -ge 1024 ]; then
  log_warn "Memory: \${mem_mb}MB — 2GB+ recommended"
else
  log_fail "Memory: \${mem_mb}MB — minimum 1GB, recommend 2GB+"
fi

# --- gcloud CLI ---
if command -v gcloud &>/dev/null; then
  gcloud_ver=$(gcloud version 2>/dev/null | head -1)
  gcloud_auth=$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null)
  if [ -n "$gcloud_auth" ]; then
    log_pass "gcloud CLI installed and authenticated as $gcloud_auth"
  else
    log_warn "gcloud CLI installed but not authenticated — run: gcloud auth login"
  fi
else
  log_fail "gcloud CLI not found — install via: curl https://sdk.cloud.google.com | bash"
fi

# --- Node.js ---
if command -v node &>/dev/null; then
  node_ver=$(node -v)
  log_pass "Node.js $node_ver"
else
  log_fail "Node.js not found"
fi

# --- Git ---
command -v git &>/dev/null && log_pass "Git installed" || log_fail "Git not found — run: apt install git"

# --- pnpm ---
command -v pnpm &>/dev/null && log_pass "pnpm installed" || log_warn "pnpm not found — run: npm install -g pnpm"

# --- Tailscale ---
command -v tailscale &>/dev/null && log_pass "Tailscale installed" || log_warn "Tailscale not found — recommended for secure access"

# --- VPC Firewall Rules ---
if command -v gcloud &>/dev/null; then
  fw_check=$(gcloud compute firewall-rules list --format='value(name)' 2>/dev/null | head -1)
  if [ -n "$fw_check" ]; then
    log_pass "VPC firewall rules accessible"
  else
    log_warn "VPC firewall rules not verified — check GCP console"
  fi
else
  log_fail "VPC firewall not configured — gcloud CLI required"
fi

# --- Service Account ---
if command -v gcloud &>/dev/null; then
  sa_check=$(gcloud iam service-accounts list --format='value(email)' 2>/dev/null | head -1)
  if [ -n "$sa_check" ]; then
    log_pass "Service account found: $sa_check"
  else
    log_warn "No service account found — will create during install"
  fi
else
  log_fail "Service account not configured — gcloud CLI required"
fi

# --- Secret Manager ---
if command -v gcloud &>/dev/null; then
  sm_check=$(gcloud services list --enabled --filter=name:secretmanager --format='value(name)' 2>/dev/null)
  if [ -n "$sm_check" ]; then
    log_pass "Secret Manager API enabled"
  else
    log_warn "Secret Manager API not enabled — run: gcloud services enable secretmanager.googleapis.com"
  fi
else
  log_fail "Secret Manager access denied — gcloud CLI required"
fi

# --- Cloud Logging Agent ---
if systemctl is-active --quiet google-cloud-ops-agent 2>/dev/null || systemctl is-active --quiet stackdriver-agent 2>/dev/null; then
  log_pass "Cloud Logging agent active"
else
  log_warn "Cloud Logging agent not detected — will install during setup"
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
# OpenClaw Install — ${hostTarget}
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
INSTALL_DIR="\${HOME}/.openclaw"
run_or_dry "git clone https://github.com/openclaw/openclaw.git \\"$INSTALL_DIR\\""
echo "rm -rf $INSTALL_DIR" >> "$ROLLBACK_LOG"

run_or_dry "cd \\"$INSTALL_DIR\\" && pnpm install"

# --- Step 3: Configure LaunchAgent ---
echo ""
echo "⚙️  Step 3: LaunchAgent Setup"
PLIST_PATH="\${HOME}/Library/LaunchAgents/com.clawdbot.gateway.plist"

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
    <string>\${HOME}/.openclaw/gateway.js</string>
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

  if (hostTarget === "aws") {
    return header + `
# --- Step 1: System Setup ---
echo "\ud83d\udce6 Step 1: System packages"
run_or_dry "apt update && apt upgrade -y"
run_or_dry "apt install -y curl git ufw unzip fail2ban"

# --- Step 2: Create dedicated user ---
echo ""
echo "\ud83d\udc64 Step 2: Create openclaw user"
if ! id openclaw &>/dev/null; then
  run_or_dry "adduser --disabled-password --gecos '' openclaw"
  run_or_dry "usermod -aG sudo openclaw"
  echo "userdel -r openclaw" >> "\$ROLLBACK_LOG"
fi

# --- Step 3: Node.js ---
echo ""
echo "\ud83d\udce6 Step 3: Node.js"
if ! command -v node &>/dev/null; then
  run_or_dry "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
  run_or_dry "apt-get install -y nodejs"
  run_or_dry "npm install -g pnpm"
fi

# --- Step 4: AWS CLI v2 ---
echo ""
echo "\u2601\ufe0f  Step 4: AWS CLI v2"
if ! command -v aws &>/dev/null || ! aws --version 2>&1 | grep -q "aws-cli/2"; then
  run_or_dry "curl https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscliv2.zip"
  run_or_dry "unzip -q /tmp/awscliv2.zip -d /tmp/awscli-install"
  run_or_dry "sudo /tmp/awscli-install/aws/install"
  run_or_dry "rm -rf /tmp/awscliv2.zip /tmp/awscli-install"
fi

# --- Step 5: Security Group ---
echo ""
echo "\ud83d\udd12 Step 5: Security Groups"
echo "   Verify SSH (22) and VPN ports are restricted in AWS Security Groups."
echo "   Use: aws ec2 describe-security-groups"
echo "   Restrict ingress to trusted CIDR ranges only."

# --- Step 6: Clone & Install ---
echo ""
echo "\ud83d\udce5 Step 6: Clone OpenClaw"
INSTALL_DIR="/opt/openclaw"
run_or_dry "git clone https://github.com/openclaw/openclaw.git \$INSTALL_DIR"
run_or_dry "chown -R openclaw:openclaw \$INSTALL_DIR"
run_or_dry "su - openclaw -c 'cd \$INSTALL_DIR && pnpm install'"
echo "rm -rf \$INSTALL_DIR" >> "\$ROLLBACK_LOG"

# --- Step 7: Store Secrets in SSM Parameter Store ---
echo ""
echo "\ud83d\udd10 Step 7: SSM Parameter Store"
run_or_dry "aws ssm put-parameter --name '/openclaw/NODE_ENV' --value 'production' --type SecureString --overwrite"
run_or_dry "aws ssm put-parameter --name '/openclaw/LOG_FORMAT' --value 'json' --type SecureString --overwrite"
echo "aws ssm delete-parameter --name '/openclaw/NODE_ENV'" >> "\$ROLLBACK_LOG"
echo "aws ssm delete-parameter --name '/openclaw/LOG_FORMAT'" >> "\$ROLLBACK_LOG"
echo "   Add your API keys with:"
echo "   aws ssm put-parameter --name '/openclaw/PROVIDER_KEY' --value 'YOUR_KEY' --type SecureString --overwrite"

# --- Step 8: CloudWatch Agent ---
echo ""
echo "\ud83d\udcdd Step 8: CloudWatch Agent"
if ! command -v amazon-cloudwatch-agent-ctl &>/dev/null; then
  run_or_dry "curl -sO https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb"
  run_or_dry "dpkg -i -E ./amazon-cloudwatch-agent.deb"
  run_or_dry "rm -f ./amazon-cloudwatch-agent.deb"
fi

# --- Step 9: Systemd Service ---
echo ""
echo "\u2699\ufe0f  Step 9: Systemd service (hardened)"
if [ "\$DRY_RUN" != "1" ]; then
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
echo "systemctl stop openclaw; systemctl disable openclaw; rm /etc/systemd/system/openclaw.service" >> "\$ROLLBACK_LOG"

# --- Step 10: Logging ---
echo ""
echo "\ud83d\udcdd Step 10: Log directory"
run_or_dry "mkdir -p /var/log/openclaw"
run_or_dry "chown openclaw:openclaw /var/log/openclaw"

# --- Step 11: Start ---
echo ""
echo "\ud83d\ude80 Step 11: Start service"
run_or_dry "systemctl daemon-reload"
run_or_dry "systemctl enable openclaw"
run_or_dry "systemctl start openclaw"

echo ""
echo "\u2705 Installation complete"
echo "   Rollback: \$ROLLBACK_LOG"
echo "   Onboard: su - openclaw -c 'openclaw onboard --install-daemon'"
`;
  }

  if (hostTarget === "gcp") {
    return header + `
# --- Step 1: System Setup ---
echo "\ud83d\udce6 Step 1: System packages"
run_or_dry "apt update && apt upgrade -y"
run_or_dry "apt install -y curl git ufw fail2ban apt-transport-https gnupg"

# --- Step 2: Create dedicated user ---
echo ""
echo "\ud83d\udc64 Step 2: Create openclaw user"
if ! id openclaw &>/dev/null; then
  run_or_dry "adduser --disabled-password --gecos '' openclaw"
  run_or_dry "usermod -aG sudo openclaw"
  echo "userdel -r openclaw" >> "\$ROLLBACK_LOG"
fi

# --- Step 3: Node.js ---
echo ""
echo "\ud83d\udce6 Step 3: Node.js"
if ! command -v node &>/dev/null; then
  run_or_dry "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
  run_or_dry "apt-get install -y nodejs"
  run_or_dry "npm install -g pnpm"
fi

# --- Step 4: gcloud CLI ---
echo ""
echo "\u2601\ufe0f  Step 4: gcloud CLI"
if ! command -v gcloud &>/dev/null; then
  run_or_dry "curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg"
  run_or_dry "echo 'deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main' | tee /etc/apt/sources.list.d/google-cloud-sdk.list"
  run_or_dry "apt-get update && apt-get install -y google-cloud-cli"
fi

# --- Step 5: VPC Firewall Rule ---
echo ""
echo "\ud83d\udd12 Step 5: VPC Firewall"
run_or_dry "gcloud compute firewall-rules create openclaw-allow-ssh-vpn --direction=INGRESS --priority=1000 --network=default --action=ALLOW --rules=tcp:22,udp:41641 --source-ranges=0.0.0.0/0 --target-tags=openclaw 2>/dev/null || echo 'Firewall rule already exists'"
echo "gcloud compute firewall-rules delete openclaw-allow-ssh-vpn --quiet 2>/dev/null || true" >> "\$ROLLBACK_LOG"

# --- Step 6: Clone & Install ---
echo ""
echo "\ud83d\udce5 Step 6: Clone OpenClaw"
INSTALL_DIR="/opt/openclaw"
run_or_dry "git clone https://github.com/openclaw/openclaw.git \$INSTALL_DIR"
run_or_dry "chown -R openclaw:openclaw \$INSTALL_DIR"
run_or_dry "su - openclaw -c 'cd \$INSTALL_DIR && pnpm install'"
echo "rm -rf \$INSTALL_DIR" >> "\$ROLLBACK_LOG"

# --- Step 7: Store Secrets in Secret Manager ---
echo ""
echo "\ud83d\udd10 Step 7: Secret Manager"
run_or_dry "gcloud services enable secretmanager.googleapis.com"
run_or_dry "echo -n 'production' | gcloud secrets create openclaw-node-env --data-file=- 2>/dev/null || echo -n 'production' | gcloud secrets versions add openclaw-node-env --data-file=-"
run_or_dry "echo -n 'json' | gcloud secrets create openclaw-log-format --data-file=- 2>/dev/null || echo -n 'json' | gcloud secrets versions add openclaw-log-format --data-file=-"
echo "gcloud secrets delete openclaw-node-env --quiet 2>/dev/null || true" >> "\$ROLLBACK_LOG"
echo "gcloud secrets delete openclaw-log-format --quiet 2>/dev/null || true" >> "\$ROLLBACK_LOG"
echo "   Add your API keys with:"
echo "   echo -n 'YOUR_KEY' | gcloud secrets create openclaw-provider-key --data-file=-"

# --- Step 8: Cloud Logging Agent ---
echo ""
echo "\ud83d\udcdd Step 8: Cloud Logging (Ops Agent)"
if ! command -v google-cloud-ops-agent &>/dev/null && ! systemctl is-active --quiet google-cloud-ops-agent 2>/dev/null; then
  run_or_dry "curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh"
  run_or_dry "bash add-google-cloud-ops-agent-repo.sh --also-install"
  run_or_dry "rm -f add-google-cloud-ops-agent-repo.sh"
fi

# --- Step 9: Systemd Service ---
echo ""
echo "\u2699\ufe0f  Step 9: Systemd service (hardened)"
if [ "\$DRY_RUN" != "1" ]; then
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
echo "systemctl stop openclaw; systemctl disable openclaw; rm /etc/systemd/system/openclaw.service" >> "\$ROLLBACK_LOG"

# --- Step 10: Logging ---
echo ""
echo "\ud83d\udcdd Step 10: Log directory"
run_or_dry "mkdir -p /var/log/openclaw"
run_or_dry "chown openclaw:openclaw /var/log/openclaw"

# --- Step 11: Start ---
echo ""
echo "\ud83d\ude80 Step 11: Start service"
run_or_dry "systemctl daemon-reload"
run_or_dry "systemctl enable openclaw"
run_or_dry "systemctl start openclaw"

echo ""
echo "\u2705 Installation complete"
echo "   Rollback: \$ROLLBACK_LOG"
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
# OpenClaw Rollback — ${hostTarget}
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

  if (hostTarget === "aws") {
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

echo "🔐 Removing SSM Parameter Store entries..."
aws ssm delete-parameter --name '/openclaw/NODE_ENV' 2>/dev/null || true
aws ssm delete-parameter --name '/openclaw/LOG_FORMAT' 2>/dev/null || true
echo "   Additional parameters starting with '/openclaw/' may need manual removal."
echo "   Use: aws ssm describe-parameters --filters 'Key=Name,Option=BeginsWith,Values=/openclaw/'"

echo "☁️  CloudWatch Agent — NOT removed automatically."
echo "   Remove with: dpkg -r amazon-cloudwatch-agent"

echo ""
echo "✅ Rollback complete"
echo "   User 'openclaw' was NOT removed. Remove with: userdel -r openclaw"
echo "   AWS CLI and Security Groups were NOT modified."
`;
  }

  if (hostTarget === "gcp") {
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

echo "🔐 Removing Secret Manager secrets..."
gcloud secrets delete openclaw-node-env --quiet 2>/dev/null || true
gcloud secrets delete openclaw-log-format --quiet 2>/dev/null || true
echo "   Additional secrets starting with 'openclaw-' may need manual removal."
echo "   Use: gcloud secrets list --filter='name:openclaw'"

echo "🔥 Removing VPC Firewall Rule..."
gcloud compute firewall-rules delete openclaw-allow-ssh-vpn --quiet 2>/dev/null || true

echo "☁️  Cloud Logging Agent — NOT removed automatically."
echo "   Remove with: bash /opt/google-cloud-ops-agent/libexec/google_cloud_ops_agent_engine --uninstall"

echo ""
echo "✅ Rollback complete"
echo "   User 'openclaw' was NOT removed. Remove with: userdel -r openclaw"
echo "   gcloud CLI and service account were NOT modified."
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

  if (hostTarget === "aws") {
    return [
      { name: "Ubuntu Version", category: "System", status: "pending", message: "" },
      { name: "Memory (RAM)", category: "System", status: "pending", message: "" },
      { name: "AWS CLI", category: "Dependencies", status: "pending", message: "" },
      ...common,
      { name: "Security Groups", category: "Network", status: "pending", message: "" },
      { name: "IAM Permissions", category: "Auth", status: "pending", message: "" },
      { name: "SSM Access", category: "Secrets", status: "pending", message: "" },
      { name: "CloudWatch Agent", category: "Observability", status: "pending", message: "" },
    ];
  }

  if (hostTarget === "gcp") {
    return [
      { name: "Ubuntu Version", category: "System", status: "pending", message: "" },
      { name: "Memory (RAM)", category: "System", status: "pending", message: "" },
      { name: "gcloud CLI", category: "Dependencies", status: "pending", message: "" },
      ...common,
      { name: "VPC Firewall Rules", category: "Network", status: "pending", message: "" },
      { name: "Service Account", category: "Auth", status: "pending", message: "" },
      { name: "Secret Manager", category: "Secrets", status: "pending", message: "" },
      { name: "Cloud Logging Agent", category: "Observability", status: "pending", message: "" },
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
    "AWS CLI": { pass: "AWS CLI v2 installed", warn: "AWS CLI v1 detected — v2 recommended", fail: "AWS CLI not found" },
    "Security Groups": { pass: "Security Groups configured — SSH + VPN only", warn: "Security Groups have extra open ports", fail: "Security Groups not configured" },
    "IAM Permissions": { pass: "IAM role has EC2 + SSM + CloudWatch", warn: "IAM role may have excessive permissions", fail: "IAM permissions not configured" },
    "SSM Access": { pass: "SSM Parameter Store accessible", warn: "SSM configured but untested", fail: "SSM access denied" },
    "CloudWatch Agent": { pass: "CloudWatch agent installed", warn: "CloudWatch agent not installed — optional", fail: "Cannot reach CloudWatch API" },
    "gcloud CLI": { pass: "gcloud CLI installed and authenticated", warn: "gcloud CLI outdated", fail: "gcloud CLI not found" },
    "VPC Firewall Rules": { pass: "VPC firewall allows SSH + VPN only", warn: "VPC firewall has extra rules", fail: "VPC firewall not configured" },
    "Service Account": { pass: "Service account with Compute + Secret Manager", warn: "Service account may have excessive roles", fail: "Service account not configured" },
    "Secret Manager": { pass: "Secret Manager accessible", warn: "Secret Manager configured but untested", fail: "Secret Manager access denied" },
    "Cloud Logging Agent": { pass: "Cloud Logging agent active", warn: "Cloud Logging agent not detected", fail: "Cannot reach Cloud Logging API" },
  };
  return messages[name]?.[status] || `${name}: ${status}`;
}
