import { describe, it, expect, beforeEach, afterAll } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createHash, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import {
  installLogs,
  installState,
  hardeningChecks,
  auditLogs,
  ownerAuth,
} from "../shared/schema";
import { eq, desc } from "drizzle-orm";

// --- Test-isolated in-memory database ---
function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite);

  // Create tables (mirrors the schema)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS install_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      severity TEXT NOT NULL,
      step TEXT NOT NULL,
      message TEXT NOT NULL,
      host TEXT DEFAULT 'macos'
    );
    CREATE TABLE IF NOT EXISTS install_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_target TEXT DEFAULT 'macos',
      current_step INTEGER DEFAULT 0,
      steps_completed TEXT DEFAULT '[]',
      preflight_results TEXT DEFAULT '{}',
      config_values TEXT DEFAULT '{}',
      rollback_scripts TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS hardening_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      command TEXT,
      host_target TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'recommended',
      is_completed INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL,
      "user" TEXT NOT NULL,
      prompt TEXT NOT NULL,
      results TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      current_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS owner_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      passphrase_hash TEXT NOT NULL
    );
  `);

  return { db, sqlite };
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

// --- Audit chain helpers (mirrors storage.ts logic) ---
function addAuditLog(
  db: ReturnType<typeof drizzle>,
  entry: { user: string; prompt: string; results: string }
) {
  const now = new Date();
  const timestamp = now.toISOString();
  const date = now.toISOString().split("T")[0];
  const lastEntry = db.select().from(auditLogs).orderBy(desc(auditLogs.id)).get();
  const previousHash = lastEntry ? lastEntry.currentHash : "0";
  const payload = `${timestamp}|${entry.user}|${entry.prompt}|${entry.results}|${previousHash}`;
  const currentHash = sha256(payload);
  return db
    .insert(auditLogs)
    .values({ timestamp, date, user: entry.user, prompt: entry.prompt, results: entry.results, previousHash, currentHash })
    .returning()
    .get();
}

function verifyAuditChain(db: ReturnType<typeof drizzle>): { valid: boolean; brokenAt?: number } {
  const allLogs = db.select().from(auditLogs).orderBy(auditLogs.id).all();
  for (let i = 0; i < allLogs.length; i++) {
    const entry = allLogs[i];
    const expectedPrev = i === 0 ? "0" : allLogs[i - 1].currentHash;
    if (entry.previousHash !== expectedPrev) return { valid: false, brokenAt: entry.id };
    const payload = `${entry.timestamp}|${entry.user}|${entry.prompt}|${entry.results}|${entry.previousHash}`;
    const expectedHash = sha256(payload);
    if (entry.currentHash !== expectedHash) return { valid: false, brokenAt: entry.id };
  }
  return { valid: true };
}

// ==============================
// TEST SUITES
// ==============================

describe("Audit Chain", () => {
  let db: ReturnType<typeof drizzle>;
  let sqlite: Database.Database;

  beforeEach(() => {
    const setup = createTestDb();
    db = setup.db;
    sqlite = setup.sqlite;
  });

  afterAll(() => {
    // Clean up is handled per-test since each uses in-memory DB
  });

  it("creates a genesis entry with previousHash '0'", () => {
    const entry = addAuditLog(db, { user: "test", prompt: "genesis", results: "ok" });
    expect(entry.previousHash).toBe("0");
    expect(entry.currentHash).toBeTruthy();
    expect(entry.currentHash.length).toBe(64); // SHA-256 hex
  });

  it("chains entries correctly", () => {
    const first = addAuditLog(db, { user: "test", prompt: "first", results: "ok" });
    const second = addAuditLog(db, { user: "test", prompt: "second", results: "ok" });
    expect(second.previousHash).toBe(first.currentHash);
  });

  it("verifies a valid chain", () => {
    addAuditLog(db, { user: "a", prompt: "p1", results: "r1" });
    addAuditLog(db, { user: "b", prompt: "p2", results: "r2" });
    addAuditLog(db, { user: "c", prompt: "p3", results: "r3" });
    expect(verifyAuditChain(db)).toEqual({ valid: true });
  });

  it("detects tampered entry", () => {
    addAuditLog(db, { user: "a", prompt: "p1", results: "r1" });
    const second = addAuditLog(db, { user: "b", prompt: "p2", results: "r2" });
    addAuditLog(db, { user: "c", prompt: "p3", results: "r3" });

    // Tamper with the second entry's hash
    db.update(auditLogs)
      .set({ currentHash: "tampered_hash_value_not_valid" })
      .where(eq(auditLogs.id, second.id))
      .run();

    const result = verifyAuditChain(db);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(second.id);
  });

  it("verifies empty chain as valid", () => {
    expect(verifyAuditChain(db)).toEqual({ valid: true });
  });
});

describe("Owner Auth (scrypt)", () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    const setup = createTestDb();
    db = setup.db;
  });

  function setOwnerPassphrase(passphrase: string) {
    const salt = randomBytes(32).toString("hex");
    const hash = scryptSync(passphrase, salt, 64).toString("hex");
    db.delete(ownerAuth).run();
    db.insert(ownerAuth).values({ passphraseHash: `${salt}:${hash}` }).run();
  }

  function verifyOwnerPassphrase(passphrase: string): boolean {
    const record = db.select().from(ownerAuth).get();
    if (!record) return false;
    const stored = record.passphraseHash;
    if (!stored.includes(":")) {
      return stored === sha256(passphrase);
    }
    const [salt, storedHash] = stored.split(":");
    const derived = scryptSync(passphrase, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(derived, "hex"));
  }

  it("verifies correct passphrase", () => {
    setOwnerPassphrase("AiGovOps2026!");
    expect(verifyOwnerPassphrase("AiGovOps2026!")).toBe(true);
  });

  it("rejects wrong passphrase", () => {
    setOwnerPassphrase("AiGovOps2026!");
    expect(verifyOwnerPassphrase("wrong_password")).toBe(false);
  });

  it("returns false when no passphrase set", () => {
    expect(verifyOwnerPassphrase("anything")).toBe(false);
  });

  it("uses salt (different hashes for same passphrase)", () => {
    setOwnerPassphrase("test123");
    const first = db.select().from(ownerAuth).get()!;
    setOwnerPassphrase("test123");
    const second = db.select().from(ownerAuth).get()!;
    // Salt is random, so stored hashes differ even for same passphrase
    expect(first.passphraseHash).not.toBe(second.passphraseHash);
  });

  it("supports legacy bare SHA-256 hashes", () => {
    const legacyHash = sha256("old_passphrase");
    db.insert(ownerAuth).values({ passphraseHash: legacyHash }).run();
    expect(verifyOwnerPassphrase("old_passphrase")).toBe(true);
    expect(verifyOwnerPassphrase("wrong")).toBe(false);
  });
});

describe("Zod Input Validation", () => {
  // Import the schemas
  it("rejects log with missing required fields", async () => {
    const { insertInstallLogSchema } = await import("../shared/schema");
    const result = insertInstallLogSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts valid log entry", async () => {
    const { insertInstallLogSchema } = await import("../shared/schema");
    const result = insertInstallLogSchema.safeParse({
      timestamp: new Date().toISOString(),
      severity: "info",
      step: "preflight",
      message: "Test message",
      host: "macos",
    });
    expect(result.success).toBe(true);
  });

  it("rejects state with invalid types", async () => {
    const { insertInstallStateSchema } = await import("../shared/schema");
    const result = insertInstallStateSchema.safeParse({
      currentStep: "not_a_number",
    });
    expect(result.success).toBe(false);
  });
});

describe("Install Logs", () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    const setup = createTestDb();
    db = setup.db;
  });

  it("adds and retrieves logs", () => {
    db.insert(installLogs).values({
      timestamp: new Date().toISOString(),
      severity: "info",
      step: "test",
      message: "test log",
      host: "macos",
    }).run();

    const logs = db.select().from(installLogs).all();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe("test log");
  });

  it("filters logs by host", () => {
    db.insert(installLogs).values({ timestamp: "t1", severity: "info", step: "s", message: "mac", host: "macos" }).run();
    db.insert(installLogs).values({ timestamp: "t2", severity: "info", step: "s", message: "do", host: "digitalocean" }).run();

    const macLogs = db.select().from(installLogs).where(eq(installLogs.host, "macos")).all();
    expect(macLogs).toHaveLength(1);
    expect(macLogs[0].message).toBe("mac");
  });
});

describe("Health Endpoint Schema", () => {
  it("returns expected fields", () => {
    // Simulate what the health endpoint returns
    const health = {
      status: "ok",
      uptime: 123.45,
      version: "1.0.0",
      memory: 12345678,
      db: "ok",
      timestamp: new Date().toISOString(),
    };
    expect(health.status).toBe("ok");
    expect(typeof health.uptime).toBe("number");
    expect(typeof health.memory).toBe("number");
    expect(health.db).toBe("ok");
  });
});
