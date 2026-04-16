/**
 * Vitest Global Setup — starts the Express server before all tests,
 * tears it down after. Ensures the hash-chain integration tests
 * can reach localhost:5000.
 */
import { type ChildProcess, spawn, execSync } from "child_process";

let serverProcess: ChildProcess | null = null;

const PORT = 5000;
const MAX_WAIT_MS = 20_000;
const POLL_INTERVAL_MS = 300;

/** Poll until the server responds to /health */
async function waitForServer(): Promise<void> {
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${PORT}/health`);
      if (res.ok) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Server did not start within ${MAX_WAIT_MS}ms`);
}

export async function setup(): Promise<void> {
  // Kill anything already on port 5000
  try {
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null`, { stdio: "ignore" });
    // Brief pause for port release
    await new Promise((r) => setTimeout(r, 500));
  } catch {
    // No process on port — fine
  }

  // Start the server using tsx (handles TypeScript natively)
  serverProcess = spawn("npx", ["tsx", "server/index.ts"], {
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(PORT),
    },
    stdio: "pipe",
    detached: true,
    cwd: process.cwd(),
  });

  // Log server output for debugging CI failures
  serverProcess.stdout?.on("data", (d: Buffer) => {
    const msg = d.toString().trim();
    if (msg) process.stdout.write(`  [test-server] ${msg}\n`);
  });
  serverProcess.stderr?.on("data", (d: Buffer) => {
    const msg = d.toString().trim();
    // Suppress noisy vite HMR output
    if (msg && !msg.includes("hmr") && !msg.includes("HMR")) {
      process.stderr.write(`  [test-server:err] ${msg}\n`);
    }
  });

  serverProcess.on("error", (err) => {
    console.error("[test-server] Failed to start:", err);
  });

  // Unref so the process doesn't block Vitest shutdown
  serverProcess.unref();

  await waitForServer();

  // Ensure the owner passphrase is set (integration tests expect it)
  try {
    const ppRes = await fetch(`http://localhost:${PORT}/api/owner/has-passphrase`);
    const ppData = (await ppRes.json()) as { hasPassphrase: boolean };

    if (!ppData.hasPassphrase) {
      await fetch(`http://localhost:${PORT}/api/owner/set-passphrase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: "AiGovOps2026!" }),
      });
      console.log("  [test-server] Owner passphrase set");
    }

    // Seed at least one audit log entry for chain verification tests
    const auditRes = await fetch(`http://localhost:${PORT}/api/audit/logs`, {
      headers: { "x-owner-passphrase": "AiGovOps2026!" },
    });
    const auditLogs = (await auditRes.json()) as unknown[];

    if (!Array.isArray(auditLogs) || auditLogs.length === 0) {
      // Reset state creates an audit entry
      await fetch(`http://localhost:${PORT}/api/state/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-owner-passphrase": "AiGovOps2026!",
        },
      });
      console.log("  [test-server] Seeded audit log entry");
    }
  } catch (err) {
    console.warn("  [test-server] Setup warning:", err);
  }

  console.log(`  [test-server] Ready on port ${PORT} (PID: ${serverProcess.pid})`);
}

export async function teardown(): Promise<void> {
  if (serverProcess?.pid) {
    try {
      // Kill the detached process group
      process.kill(-serverProcess.pid, "SIGTERM");
    } catch {
      try {
        serverProcess.kill("SIGTERM");
      } catch {
        // Already dead
      }
    }

    // Give it a moment to shut down gracefully
    await new Promise((r) => setTimeout(r, 500));

    // Force kill if still alive
    try {
      process.kill(-serverProcess.pid!, "SIGKILL");
    } catch {
      // Already dead — good
    }

    serverProcess = null;
  }

  // Also kill any orphaned processes on the port
  try {
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null`, { stdio: "ignore" });
  } catch {
    // Nothing to kill
  }
}
