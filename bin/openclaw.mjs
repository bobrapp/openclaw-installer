#!/usr/bin/env node

// OpenClaw Guided Install — CLI Entry Point
// AiGovOps Foundation | https://aigovopsfoundation.org
// License: Apache 2.0 + Commons Clause (non-commercial)

import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const args = process.argv.slice(2);
const command = args[0] || "start";

const HELP = `
  OpenClaw Guided Install by AiGovOps Foundation
  ================================================

  Usage: openclaw <command> [options]

  Commands:
    start             Start the installer web UI (default)
    preflight         Run preflight checks only (CLI mode)
    validate          Run E2E validation suite
    canary-init       Initialize canary token baseline
    canary-verify     Verify canary tokens (tampering check)
    version           Show version
    help              Show this help message

  Options:
    --port <port>     Server port (default: 5000)
    --host <target>   Host target (default: macos)

  Environment:
    PORT              Server port (default: 5000)
    HOST              Bind address (default: 127.0.0.1)
    OWNER_PASSPHRASE  Owner passphrase for secure endpoints
    NODE_ENV          Environment (development | production)

  Examples:
    openclaw                    # Start the web UI on port 5000
    openclaw start --port 3000  # Start on custom port
    openclaw preflight          # Run preflight checks
    openclaw validate           # Run E2E validation
    openclaw canary-verify      # Check for file tampering

  Documentation:
    https://github.com/bobrapp/openclaw-installer

  License: Apache 2.0 + Commons Clause (non-commercial)
  © AiGovOps Foundation — Ken Johnston & Bob Rapp, Co-Founders
`;

function getPort() {
  const portIdx = args.indexOf("--port");
  if (portIdx !== -1 && args[portIdx + 1]) {
    return parseInt(args[portIdx + 1], 10);
  }
  return parseInt(process.env.PORT || "5000", 10);
}

function getHostTarget() {
  const hostIdx = args.indexOf("--host");
  if (hostIdx !== -1 && args[hostIdx + 1]) {
    return args[hostIdx + 1];
  }
  return "macos";
}

function runScript(scriptPath, scriptArgs = []) {
  const fullPath = resolve(ROOT, scriptPath);
  if (!existsSync(fullPath)) {
    console.error(`Script not found: ${fullPath}`);
    process.exit(1);
  }
  try {
    execSync(`bash "${fullPath}" ${scriptArgs.join(" ")}`, {
      stdio: "inherit",
      cwd: ROOT,
    });
  } catch (err) {
    process.exit(err.status || 1);
  }
}

switch (command) {
  case "start": {
    const port = getPort();
    console.log(`\n  🦀 OpenClaw Guided Install — starting on port ${port}...\n`);
    const serverPath = resolve(ROOT, "dist/index.cjs");
    if (!existsSync(serverPath)) {
      console.error("  Build not found. Run 'npm run build' first.\n");
      process.exit(1);
    }
    const child = spawn("node", [serverPath], {
      stdio: "inherit",
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
    });
    child.on("exit", (code) => process.exit(code || 0));
    break;
  }

  case "preflight":
    console.log("\n  🔍 Running preflight checks...\n");
    runScript("scripts/e2e-validate.sh", [
      "--host", getHostTarget(),
      "--steps", "prerequisites,preflight",
    ]);
    break;

  case "validate":
    console.log("\n  🧪 Running E2E validation suite...\n");
    runScript("scripts/e2e-validate.sh", args.slice(1));
    break;

  case "canary-init":
    console.log("\n  🐤 Initializing canary token baseline...\n");
    runScript("scripts/canary-check.sh", ["--init"]);
    break;

  case "canary-verify":
    console.log("\n  🔒 Verifying canary tokens...\n");
    runScript("scripts/canary-check.sh", ["--verify"]);
    break;

  case "version":
  case "--version":
  case "-v": {
    const pkg = JSON.parse(
      (await import("fs")).readFileSync(resolve(ROOT, "package.json"), "utf8")
    );
    console.log(`openclaw v${pkg.version}`);
    break;
  }

  case "help":
  case "--help":
  case "-h":
    console.log(HELP);
    break;

  default:
    console.error(`  Unknown command: ${command}\n`);
    console.log(HELP);
    process.exit(1);
}
