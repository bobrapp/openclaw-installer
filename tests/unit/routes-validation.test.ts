/**
 * routes-validation.test.ts
 * Tests API route input validation schemas extracted from server/routes.ts.
 * Uses static analysis (regex/source reading) and direct Zod schema construction
 * to avoid importing the Express server at test time.
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// ─── Re-create validation constants from routes.ts ──────────────────────────
// These mirror the constants defined in server/routes.ts exactly.
const VALID_HOST_TARGETS = [
  'macos', 'digitalocean', 'aws-ec2', 'google-cloud', 'azure-vm',
  'generic-vps', 'railway', 'render', 'fly-io', 'hetzner',
  'oracle-cloud', 'ovhcloud', 'tencent', 'alibaba', 'vultr', 'kamatera',
] as const;

const hostTargetSchema = z.enum(VALID_HOST_TARGETS);
const logSeveritySchema = z.enum(['info', 'warn', 'error', 'success']);
const stateStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'rolled_back']);
const passphraseSchema = z.string().min(6).max(256);

const refinedInsertLogSchema = z.object({
  severity: logSeveritySchema,
  host: z.string().min(1).max(64),
  step: z.string().min(1).max(128),
  message: z.string().min(1).max(4096),
  timestamp: z.string().min(1).max(64),
}).passthrough();

const numericIdSchema = z.coerce.number().int().positive().max(2_147_483_647);

// ─── Read routes.ts source for structural verification ───────────────────────
const ROUTES_FILE = path.resolve(__dirname, '../../server/routes.ts');
const routesSrc = fs.readFileSync(ROUTES_FILE, 'utf8');

// ── Host target schema ────────────────────────────────────────────────────────
describe('hostTargetSchema', () => {
  it('should have exactly 16 valid host targets', () => {
    expect(VALID_HOST_TARGETS).toHaveLength(16);
  });

  it('should accept all 16 valid host targets', () => {
    for (const target of VALID_HOST_TARGETS) {
      const result = hostTargetSchema.safeParse(target);
      expect(result.success, `Expected "${target}" to be valid`).toBe(true);
    }
  });

  it('should accept "macos"', () => {
    expect(hostTargetSchema.safeParse('macos').success).toBe(true);
  });

  it('should accept "aws-ec2"', () => {
    expect(hostTargetSchema.safeParse('aws-ec2').success).toBe(true);
  });

  it('should accept "google-cloud"', () => {
    expect(hostTargetSchema.safeParse('google-cloud').success).toBe(true);
  });

  it('should accept "oracle-cloud"', () => {
    expect(hostTargetSchema.safeParse('oracle-cloud').success).toBe(true);
  });

  it('should reject an empty string', () => {
    expect(hostTargetSchema.safeParse('').success).toBe(false);
  });

  it('should reject unknown target "ubuntu"', () => {
    expect(hostTargetSchema.safeParse('ubuntu').success).toBe(false);
  });

  it('should reject unknown target "aws"', () => {
    // routes.ts uses "aws-ec2", not "aws"
    expect(hostTargetSchema.safeParse('aws').success).toBe(false);
  });

  it('should reject unknown target "gcp"', () => {
    // routes.ts uses "google-cloud", not "gcp"
    expect(hostTargetSchema.safeParse('gcp').success).toBe(false);
  });

  it('should reject unknown target "azure"', () => {
    // routes.ts uses "azure-vm", not "azure"
    expect(hostTargetSchema.safeParse('azure').success).toBe(false);
  });

  it('should reject path traversal attempts', () => {
    expect(hostTargetSchema.safeParse('../etc/passwd').success).toBe(false);
    expect(hostTargetSchema.safeParse('../../windows/system32').success).toBe(false);
  });

  it('should reject null and undefined', () => {
    expect(hostTargetSchema.safeParse(null).success).toBe(false);
    expect(hostTargetSchema.safeParse(undefined).success).toBe(false);
  });

  it('should reject a number', () => {
    expect(hostTargetSchema.safeParse(42).success).toBe(false);
  });

  it('should include all expected cloud providers', () => {
    const targets = new Set(VALID_HOST_TARGETS);
    expect(targets.has('digitalocean')).toBe(true);
    expect(targets.has('aws-ec2')).toBe(true);
    expect(targets.has('google-cloud')).toBe(true);
    expect(targets.has('azure-vm')).toBe(true);
    expect(targets.has('hetzner')).toBe(true);
    expect(targets.has('vultr')).toBe(true);
    expect(targets.has('railway')).toBe(true);
    expect(targets.has('render')).toBe(true);
    expect(targets.has('fly-io')).toBe(true);
    expect(targets.has('oracle-cloud')).toBe(true);
    expect(targets.has('ovhcloud')).toBe(true);
    expect(targets.has('tencent')).toBe(true);
    expect(targets.has('alibaba')).toBe(true);
    expect(targets.has('kamatera')).toBe(true);
    expect(targets.has('generic-vps')).toBe(true);
    expect(targets.has('macos')).toBe(true);
  });
});

// ── Log severity enum ─────────────────────────────────────────────────────────
describe('logSeveritySchema', () => {
  it('should accept "info"', () => {
    expect(logSeveritySchema.safeParse('info').success).toBe(true);
  });

  it('should accept "warn"', () => {
    expect(logSeveritySchema.safeParse('warn').success).toBe(true);
  });

  it('should accept "error"', () => {
    expect(logSeveritySchema.safeParse('error').success).toBe(true);
  });

  it('should accept "success"', () => {
    expect(logSeveritySchema.safeParse('success').success).toBe(true);
  });

  it('should reject "debug"', () => {
    expect(logSeveritySchema.safeParse('debug').success).toBe(false);
  });

  it('should reject "warning"', () => {
    expect(logSeveritySchema.safeParse('warning').success).toBe(false);
  });

  it('should reject "critical"', () => {
    expect(logSeveritySchema.safeParse('critical').success).toBe(false);
  });

  it('should reject empty string', () => {
    expect(logSeveritySchema.safeParse('').success).toBe(false);
  });

  it('should reject uppercase "INFO"', () => {
    expect(logSeveritySchema.safeParse('INFO').success).toBe(false);
  });
});

// ── State status enum ────────────────────────────────────────────────────────
describe('stateStatusSchema', () => {
  const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'rolled_back'];

  it('should accept all valid statuses', () => {
    for (const status of validStatuses) {
      expect(stateStatusSchema.safeParse(status).success, `Expected "${status}" to be valid`).toBe(true);
    }
  });

  it('should accept "pending"', () => {
    expect(stateStatusSchema.safeParse('pending').success).toBe(true);
  });

  it('should accept "in_progress"', () => {
    expect(stateStatusSchema.safeParse('in_progress').success).toBe(true);
  });

  it('should accept "completed"', () => {
    expect(stateStatusSchema.safeParse('completed').success).toBe(true);
  });

  it('should accept "failed"', () => {
    expect(stateStatusSchema.safeParse('failed').success).toBe(true);
  });

  it('should accept "rolled_back"', () => {
    expect(stateStatusSchema.safeParse('rolled_back').success).toBe(true);
  });

  it('should reject "running"', () => {
    expect(stateStatusSchema.safeParse('running').success).toBe(false);
  });

  it('should reject "unknown"', () => {
    expect(stateStatusSchema.safeParse('unknown').success).toBe(false);
  });

  it('should reject empty string', () => {
    expect(stateStatusSchema.safeParse('').success).toBe(false);
  });

  it('should have exactly 5 valid statuses', () => {
    expect(validStatuses).toHaveLength(5);
  });
});

// ── Passphrase schema ────────────────────────────────────────────────────────
describe('passphraseSchema', () => {
  it('should accept a passphrase of exactly 6 characters (minimum)', () => {
    expect(passphraseSchema.safeParse('abc123').success).toBe(true);
  });

  it('should accept a passphrase of exactly 256 characters (maximum)', () => {
    const longPass = 'a'.repeat(256);
    expect(passphraseSchema.safeParse(longPass).success).toBe(true);
  });

  it('should accept a typical strong passphrase', () => {
    expect(passphraseSchema.safeParse('AiGovOps2026!').success).toBe(true);
  });

  it('should reject a passphrase shorter than 6 characters', () => {
    expect(passphraseSchema.safeParse('abc').success).toBe(false);
  });

  it('should reject a passphrase of 5 characters', () => {
    expect(passphraseSchema.safeParse('ab1!2').success).toBe(false);
  });

  it('should reject an empty string', () => {
    expect(passphraseSchema.safeParse('').success).toBe(false);
  });

  it('should reject a passphrase longer than 256 characters', () => {
    const tooLong = 'a'.repeat(257);
    expect(passphraseSchema.safeParse(tooLong).success).toBe(false);
  });

  it('should reject a passphrase of 300 characters', () => {
    const tooLong = 'x'.repeat(300);
    expect(passphraseSchema.safeParse(tooLong).success).toBe(false);
  });

  it('should reject null', () => {
    expect(passphraseSchema.safeParse(null).success).toBe(false);
  });

  it('should reject a number', () => {
    expect(passphraseSchema.safeParse(123456).success).toBe(false);
  });
});

// ── Message length limits ────────────────────────────────────────────────────
describe('log message length validation (1–4096 chars)', () => {
  const messageSchema = z.string().min(1).max(4096);

  it('should accept a message of 1 character (minimum)', () => {
    expect(messageSchema.safeParse('x').success).toBe(true);
  });

  it('should accept a typical log message', () => {
    expect(messageSchema.safeParse('Preflight check complete').success).toBe(true);
  });

  it('should accept a message of exactly 4096 characters (maximum)', () => {
    expect(messageSchema.safeParse('a'.repeat(4096)).success).toBe(true);
  });

  it('should reject an empty message', () => {
    expect(messageSchema.safeParse('').success).toBe(false);
  });

  it('should reject a message longer than 4096 characters', () => {
    expect(messageSchema.safeParse('a'.repeat(4097)).success).toBe(false);
  });
});

// ── Numeric ID parameter bounds ───────────────────────────────────────────────
describe('numeric ID parameter validation', () => {
  it('should accept a valid positive integer ID', () => {
    expect(numericIdSchema.safeParse(1).success).toBe(true);
    expect(numericIdSchema.safeParse(100).success).toBe(true);
    expect(numericIdSchema.safeParse(9999).success).toBe(true);
  });

  it('should reject 0 (zero is not a valid record ID)', () => {
    expect(numericIdSchema.safeParse(0).success).toBe(false);
  });

  it('should reject negative numbers', () => {
    expect(numericIdSchema.safeParse(-1).success).toBe(false);
    expect(numericIdSchema.safeParse(-100).success).toBe(false);
  });

  it('should reject NaN', () => {
    expect(numericIdSchema.safeParse(NaN).success).toBe(false);
  });

  it('should reject Infinity', () => {
    expect(numericIdSchema.safeParse(Infinity).success).toBe(false);
  });

  it('should reject a string "abc"', () => {
    // z.coerce.number() would NaN on "abc"
    expect(numericIdSchema.safeParse('abc').success).toBe(false);
  });

  it('should reject an excessively large ID', () => {
    expect(numericIdSchema.safeParse(9_999_999_999).success).toBe(false);
  });
});

// ── Log insert schema ─────────────────────────────────────────────────────────
describe('refinedInsertLogSchema', () => {
  const validLog = {
    severity: 'info',
    host: 'digitalocean',
    step: 'preflight-check',
    message: 'Preflight check passed',
    timestamp: '2026-04-16T12:00:00.000Z',
  };

  it('should accept a valid log entry', () => {
    expect(refinedInsertLogSchema.safeParse(validLog).success).toBe(true);
  });

  it('should reject a log with invalid severity', () => {
    const bad = { ...validLog, severity: 'verbose' };
    expect(refinedInsertLogSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject a log with empty host', () => {
    const bad = { ...validLog, host: '' };
    expect(refinedInsertLogSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject a log with host longer than 64 characters', () => {
    const bad = { ...validLog, host: 'x'.repeat(65) };
    expect(refinedInsertLogSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject a log with empty message', () => {
    const bad = { ...validLog, message: '' };
    expect(refinedInsertLogSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject a log with message exceeding 4096 characters', () => {
    const bad = { ...validLog, message: 'x'.repeat(4097) };
    expect(refinedInsertLogSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject a log with empty step', () => {
    const bad = { ...validLog, step: '' };
    expect(refinedInsertLogSchema.safeParse(bad).success).toBe(false);
  });

  it('should reject a log with step exceeding 128 characters', () => {
    const bad = { ...validLog, step: 's'.repeat(129) };
    expect(refinedInsertLogSchema.safeParse(bad).success).toBe(false);
  });
});

// ── Source-level verification ─────────────────────────────────────────────────
describe('routes.ts source verification', () => {
  it('routes.ts file should exist', () => {
    expect(fs.existsSync(ROUTES_FILE)).toBe(true);
  });

  it('should define VALID_HOST_TARGETS with exactly 16 entries (source check)', () => {
    const match = routesSrc.match(/VALID_HOST_TARGETS\s*=\s*\[([^\]]+)\]/s);
    expect(match, 'VALID_HOST_TARGETS array not found in routes.ts').toBeTruthy();
    const entries = match![1].match(/"[^"]+"/g) || [];
    expect(entries).toHaveLength(16);
  });

  it('should define logSeveritySchema with info/warn/error/success', () => {
    expect(routesSrc).toContain('"info"');
    expect(routesSrc).toContain('"warn"');
    expect(routesSrc).toContain('"error"');
    expect(routesSrc).toContain('"success"');
  });

  it('should define stateStatusSchema (pending/in_progress/completed/failed/rolled_back)', () => {
    expect(routesSrc).toContain('"pending"');
    expect(routesSrc).toContain('"in_progress"');
    expect(routesSrc).toContain('"completed"');
    expect(routesSrc).toContain('"failed"');
    expect(routesSrc).toContain('"rolled_back"');
  });

  it('should define passphraseSchema with min(6) and max(256)', () => {
    expect(routesSrc).toContain('passphraseSchema');
    expect(routesSrc).toContain('.min(6)');
    expect(routesSrc).toContain('.max(256)');
  });

  it('should define message max length of 4096', () => {
    expect(routesSrc).toContain('.max(4096)');
  });

  it('should use helmet for security headers', () => {
    expect(routesSrc).toContain('helmet');
  });

  it('should use express-rate-limit', () => {
    expect(routesSrc).toContain('rateLimit');
  });

  it('should define the requireOwner middleware', () => {
    expect(routesSrc).toContain('requireOwner');
  });

  it('should validate x-owner-passphrase header', () => {
    expect(routesSrc).toContain('x-owner-passphrase');
  });
});
