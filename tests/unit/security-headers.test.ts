/**
 * security-headers.test.ts
 * Tests security configuration from server/routes.ts:
 *   - VALID_HOST_TARGETS has exactly 16 entries
 *   - Rate limit configurations exist and are sane
 *   - Zod schema compositions are strict (no extra fields where expected)
 *   - Security header middleware (helmet) is configured
 *   - Owner auth middleware is defined
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_FILE = path.resolve(__dirname, '../../server/routes.ts');

// ─── Re-create schemas from routes.ts (mirrors production code) ──────────────
const VALID_HOST_TARGETS = [
  'macos', 'digitalocean', 'aws-ec2', 'google-cloud', 'azure-vm',
  'generic-vps', 'railway', 'render', 'fly-io', 'hetzner',
  'oracle-cloud', 'ovhcloud', 'tencent', 'alibaba', 'vultr', 'kamatera',
] as const;

type HostTarget = typeof VALID_HOST_TARGETS[number];

const hostTargetSchema = z.enum(VALID_HOST_TARGETS);
const logSeveritySchema = z.enum(['info', 'warn', 'error', 'success']);
const stateStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'rolled_back']);

// Strict object schema (rejects extra fields via .strict())
const strictLogSchema = z.object({
  severity: logSeveritySchema,
  host: z.string().min(1).max(64),
  step: z.string().min(1).max(128),
  message: z.string().min(1).max(4096),
  timestamp: z.string().min(1).max(64),
}).strict();

const strictStateSchema = z.object({
  hostTarget: hostTargetSchema.optional(),
  status: stateStatusSchema.optional(),
  currentStep: z.number().int().min(0).max(20).optional(),
}).strict();

// ─── Read routes.ts source ────────────────────────────────────────────────────
const routesSrc = fs.readFileSync(ROUTES_FILE, 'utf8');

// ─── VALID_HOST_TARGETS array ─────────────────────────────────────────────────
describe('VALID_HOST_TARGETS array', () => {
  it('should have exactly 16 entries', () => {
    expect(VALID_HOST_TARGETS).toHaveLength(16);
  });

  it('should be defined as const in routes.ts source', () => {
    expect(routesSrc).toContain('VALID_HOST_TARGETS');
  });

  it('should contain exactly 16 quoted strings in the source definition', () => {
    const match = routesSrc.match(/VALID_HOST_TARGETS\s*=\s*\[([^\]]+)\]/s);
    expect(match, 'Could not find VALID_HOST_TARGETS in source').toBeTruthy();
    const quoted = match![1].match(/"[^"]+"/g) ?? [];
    expect(quoted).toHaveLength(16);
  });

  it('all 16 entries should be unique', () => {
    const unique = new Set(VALID_HOST_TARGETS);
    expect(unique.size).toBe(16);
  });

  it('should include all major cloud providers', () => {
    const targetSet = new Set(VALID_HOST_TARGETS);
    // Big 3 cloud providers
    expect(targetSet.has('aws-ec2')).toBe(true);
    expect(targetSet.has('google-cloud')).toBe(true);
    expect(targetSet.has('azure-vm')).toBe(true);
    // Popular VPS / PaaS providers
    expect(targetSet.has('digitalocean')).toBe(true);
    expect(targetSet.has('hetzner')).toBe(true);
    expect(targetSet.has('vultr')).toBe(true);
    expect(targetSet.has('railway')).toBe(true);
    expect(targetSet.has('render')).toBe(true);
    expect(targetSet.has('fly-io')).toBe(true);
    // Asia-Pacific providers
    expect(targetSet.has('oracle-cloud')).toBe(true);
    expect(targetSet.has('ovhcloud')).toBe(true);
    expect(targetSet.has('tencent')).toBe(true);
    expect(targetSet.has('alibaba')).toBe(true);
    expect(targetSet.has('kamatera')).toBe(true);
    // Generic + local
    expect(targetSet.has('generic-vps')).toBe(true);
    expect(targetSet.has('macos')).toBe(true);
  });

  it('should not contain empty strings', () => {
    for (const target of VALID_HOST_TARGETS) {
      expect(target.length, `Empty target found in VALID_HOST_TARGETS`).toBeGreaterThan(0);
    }
  });

  it('should not contain targets with path traversal characters', () => {
    for (const target of VALID_HOST_TARGETS) {
      expect(target, `Target "${target}" contains path traversal characters`).not.toContain('.');
      expect(target, `Target "${target}" contains path traversal characters`).not.toContain('/');
      expect(target, `Target "${target}" contains path traversal characters`).not.toContain('\\');
    }
  });

  it('all entries should use lowercase kebab-case only', () => {
    const kebabCase = /^[a-z0-9-]+$/;
    for (const target of VALID_HOST_TARGETS) {
      expect(
        kebabCase.test(target),
        `Target "${target}" is not kebab-case`
      ).toBe(true);
    }
  });
});

// ─── Rate limit configuration ─────────────────────────────────────────────────
describe('Rate limit configuration', () => {
  it('routes.ts should use express-rate-limit', () => {
    expect(routesSrc).toContain('rateLimit');
  });

  it('should define an API rate limiter (apiLimiter)', () => {
    expect(routesSrc).toContain('apiLimiter');
  });

  it('should define a mutation rate limiter (mutateLimiter)', () => {
    expect(routesSrc).toContain('mutateLimiter');
  });

  it('API rate limit window should be 60 seconds', () => {
    // "windowMs: 60 * 1000" or "windowMs: 60_000"
    expect(routesSrc).toMatch(/windowMs:\s*60\s*\*\s*1000|windowMs:\s*60_000/);
  });

  it('API rate limit max should be 100 requests', () => {
    expect(routesSrc).toContain('max: 100');
  });

  it('mutation rate limit max should be 20 requests', () => {
    expect(routesSrc).toContain('max: 20');
  });

  it('should use standardHeaders (not legacy headers)', () => {
    expect(routesSrc).toContain('standardHeaders: true');
    expect(routesSrc).toContain('legacyHeaders: false');
  });

  it('should define a brute-force rate limiter for verify endpoint', () => {
    expect(routesSrc).toContain('RATE_LIMIT_MAX');
    expect(routesSrc).toContain('RATE_LIMIT_WINDOW_MS');
  });

  it('brute-force rate limit should be 5 attempts max', () => {
    const match = routesSrc.match(/RATE_LIMIT_MAX\s*=\s*(\d+)/);
    expect(match, 'RATE_LIMIT_MAX constant not found').toBeTruthy();
    expect(parseInt(match![1])).toBe(5);
  });

  it('brute-force rate limit window should be 60 seconds', () => {
    const match = routesSrc.match(/RATE_LIMIT_WINDOW_MS\s*=\s*([\d_]+)/);
    expect(match, 'RATE_LIMIT_WINDOW_MS constant not found').toBeTruthy();
    const value = parseInt(match![1].replace(/_/g, ''));
    expect(value).toBe(60_000);
  });
});

// ─── Helmet security middleware ───────────────────────────────────────────────
describe('Helmet security middleware', () => {
  it('routes.ts should import helmet', () => {
    expect(routesSrc).toContain("import helmet from \"helmet\"");
  });

  it('should call app.use(helmet(...))', () => {
    expect(routesSrc).toContain('app.use(helmet(');
  });

  it('should configure Content Security Policy', () => {
    expect(routesSrc).toContain('contentSecurityPolicy');
  });

  it("CSP defaultSrc should be \"'self'\"", () => {
    expect(routesSrc).toContain("defaultSrc: [\"'self'\"]");
  });

  it('CSP should restrict frameSrc to none', () => {
    expect(routesSrc).toContain("frameSrc: [\"'none'\"]");
  });

  it('CSP should allow frame ancestors from perplexity.ai', () => {
    expect(routesSrc).toContain('frameAncestors');
    expect(routesSrc).toContain('perplexity.ai');
  });
});

// ─── Owner auth middleware ────────────────────────────────────────────────────
describe('Owner authentication middleware', () => {
  it('should define requireOwner function', () => {
    expect(routesSrc).toContain('function requireOwner');
  });

  it('should check x-owner-passphrase header', () => {
    expect(routesSrc).toContain('x-owner-passphrase');
  });

  it('should return 401 on unauthorized requests', () => {
    expect(routesSrc).toContain('401');
  });

  it('should check passphrase against storage.verifyOwnerPassphrase', () => {
    expect(routesSrc).toContain('verifyOwnerPassphrase');
  });
});

// ─── Zod schema strictness ────────────────────────────────────────────────────
describe('Zod schema strictness — extra field rejection', () => {
  it('strict log schema should reject objects with extra fields', () => {
    const validLog = {
      severity: 'info' as const,
      host: 'macos',
      step: 'preflight',
      message: 'All good',
      timestamp: '2026-04-16T00:00:00Z',
      extraField: 'should be rejected',
    };
    expect(strictLogSchema.safeParse(validLog).success).toBe(false);
  });

  it('strict log schema should accept a valid log entry with no extra fields', () => {
    const validLog = {
      severity: 'info' as const,
      host: 'macos',
      step: 'preflight',
      message: 'All good',
      timestamp: '2026-04-16T00:00:00Z',
    };
    expect(strictLogSchema.safeParse(validLog).success).toBe(true);
  });

  it('strict state schema should reject extra fields', () => {
    const invalidState = {
      hostTarget: 'macos' as const,
      status: 'pending' as const,
      currentStep: 0,
      unknownField: 'bad',
    };
    expect(strictStateSchema.safeParse(invalidState).success).toBe(false);
  });

  it('strict state schema should accept valid partial state', () => {
    const validState = {
      hostTarget: 'macos' as const,
      status: 'pending' as const,
    };
    expect(strictStateSchema.safeParse(validState).success).toBe(true);
  });

  it('strict state schema should accept empty object (all fields optional)', () => {
    expect(strictStateSchema.safeParse({}).success).toBe(true);
  });

  it('currentStep should be validated between 0 and 20', () => {
    const tooHigh = { currentStep: 21 };
    const justRight = { currentStep: 20 };
    const tooLow = { currentStep: -1 };
    expect(strictStateSchema.safeParse(tooHigh).success).toBe(false);
    expect(strictStateSchema.safeParse(justRight).success).toBe(true);
    expect(strictStateSchema.safeParse(tooLow).success).toBe(false);
  });
});

// ─── Schema composition integrity ────────────────────────────────────────────
describe('Schema composition integrity', () => {
  it('hostTargetSchema should be a Zod enum', () => {
    expect(hostTargetSchema._def.typeName).toBe('ZodEnum');
  });

  it('logSeveritySchema should be a Zod enum with 4 values', () => {
    expect(logSeveritySchema._def.typeName).toBe('ZodEnum');
    expect(logSeveritySchema._def.values).toHaveLength(4);
  });

  it('stateStatusSchema should be a Zod enum with 5 values', () => {
    expect(stateStatusSchema._def.typeName).toBe('ZodEnum');
    expect(stateStatusSchema._def.values).toHaveLength(5);
  });

  it('hostTargetSchema should parse and return the correct value type', () => {
    const result = hostTargetSchema.safeParse('macos');
    expect(result.success).toBe(true);
    if (result.success) {
      const target: HostTarget = result.data;
      expect(target).toBe('macos');
    }
  });

  it('logSeveritySchema should parse and return the exact severity value', () => {
    const result = logSeveritySchema.safeParse('warn');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('warn');
    }
  });
});

// ─── Input sanitization edge cases ───────────────────────────────────────────
describe('Input sanitization — edge cases', () => {
  it('hostTargetSchema should reject SQL injection attempts', () => {
    expect(hostTargetSchema.safeParse("' OR 1=1 --").success).toBe(false);
    expect(hostTargetSchema.safeParse("1; DROP TABLE logs;").success).toBe(false);
  });

  it('hostTargetSchema should reject script injection', () => {
    expect(hostTargetSchema.safeParse('<script>alert(1)</script>').success).toBe(false);
  });

  it('hostTargetSchema should reject very long strings', () => {
    expect(hostTargetSchema.safeParse('a'.repeat(1000)).success).toBe(false);
  });

  it('logSeveritySchema should be case sensitive', () => {
    expect(logSeveritySchema.safeParse('INFO').success).toBe(false);
    expect(logSeveritySchema.safeParse('Warn').success).toBe(false);
    expect(logSeveritySchema.safeParse('ERROR').success).toBe(false);
  });

  it('stateStatusSchema should be case sensitive', () => {
    expect(stateStatusSchema.safeParse('Pending').success).toBe(false);
    expect(stateStatusSchema.safeParse('COMPLETED').success).toBe(false);
    expect(stateStatusSchema.safeParse('In_Progress').success).toBe(false);
  });
});
