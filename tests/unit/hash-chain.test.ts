/**
 * hash-chain.test.ts
 * Tests the server-side audit hash chain via HTTP.
 * The server runs on port 5000 with passphrase "AiGovOps2026!".
 *
 * Tests in-memory hash chain logic directly too (mirrors the storage logic).
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

const BASE_URL = 'http://localhost:5000';
const PASSPHRASE = 'AiGovOps2026!';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// ─── Unit: Pure hash chain logic (mirrors storage.ts) ─────────────────────
describe('Hash chain logic (unit)', () => {
  type Entry = {
    id: number;
    timestamp: string;
    user: string;
    prompt: string;
    results: string;
    previousHash: string;
    currentHash: string;
  };

  function buildChain(entries: Omit<Entry, 'id' | 'previousHash' | 'currentHash'>[]): Entry[] {
    const chain: Entry[] = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const previousHash = i === 0 ? '0' : chain[i - 1].currentHash;
      const payload = `${e.timestamp}|${e.user}|${e.prompt}|${e.results}|${previousHash}`;
      const currentHash = sha256(payload);
      chain.push({ id: i + 1, ...e, previousHash, currentHash });
    }
    return chain;
  }

  function verifyChain(entries: Entry[]): { valid: boolean; brokenAt?: number } {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const expectedPrev = i === 0 ? '0' : entries[i - 1].currentHash;
      if (entry.previousHash !== expectedPrev) return { valid: false, brokenAt: entry.id };
      const payload = `${entry.timestamp}|${entry.user}|${entry.prompt}|${entry.results}|${entry.previousHash}`;
      if (entry.currentHash !== sha256(payload)) return { valid: false, brokenAt: entry.id };
    }
    return { valid: true };
  }

  it('genesis entry has previousHash "0"', () => {
    const chain = buildChain([{ timestamp: '2025-01-01T00:00:00.000Z', user: 'test', prompt: 'p1', results: 'r1' }]);
    expect(chain[0].previousHash).toBe('0');
  });

  it('genesis entry has 64-char SHA-256 currentHash', () => {
    const chain = buildChain([{ timestamp: '2025-01-01T00:00:00.000Z', user: 'test', prompt: 'p1', results: 'r1' }]);
    expect(chain[0].currentHash).toHaveLength(64);
    expect(chain[0].currentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('second entry previousHash equals first entry currentHash', () => {
    const chain = buildChain([
      { timestamp: '2025-01-01T00:00:00.000Z', user: 'a', prompt: 'p1', results: 'r1' },
      { timestamp: '2025-01-01T00:01:00.000Z', user: 'b', prompt: 'p2', results: 'r2' },
    ]);
    expect(chain[1].previousHash).toBe(chain[0].currentHash);
  });

  it('chain with 5 entries verifies as valid', () => {
    const chain = buildChain([
      { timestamp: '2025-01-01T00:00:00.000Z', user: 'a', prompt: 'p1', results: 'r1' },
      { timestamp: '2025-01-01T00:01:00.000Z', user: 'b', prompt: 'p2', results: 'r2' },
      { timestamp: '2025-01-01T00:02:00.000Z', user: 'c', prompt: 'p3', results: 'r3' },
      { timestamp: '2025-01-01T00:03:00.000Z', user: 'd', prompt: 'p4', results: 'r4' },
      { timestamp: '2025-01-01T00:04:00.000Z', user: 'e', prompt: 'p5', results: 'r5' },
    ]);
    expect(verifyChain(chain)).toEqual({ valid: true });
  });

  it('detects tampered currentHash', () => {
    const chain = buildChain([
      { timestamp: '2025-01-01T00:00:00.000Z', user: 'a', prompt: 'p1', results: 'r1' },
      { timestamp: '2025-01-01T00:01:00.000Z', user: 'b', prompt: 'p2', results: 'r2' },
      { timestamp: '2025-01-01T00:02:00.000Z', user: 'c', prompt: 'p3', results: 'r3' },
    ]);
    // Tamper entry 1 (index 0)
    chain[0].currentHash = 'deadbeef'.repeat(8);
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
  });

  it('detects tampered previousHash', () => {
    const chain = buildChain([
      { timestamp: '2025-01-01T00:00:00.000Z', user: 'a', prompt: 'p1', results: 'r1' },
      { timestamp: '2025-01-01T00:01:00.000Z', user: 'b', prompt: 'p2', results: 'r2' },
    ]);
    // Tamper second entry's previousHash
    chain[1].previousHash = 'tampered'.padEnd(64, '0');
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(2);
  });

  it('empty chain is valid', () => {
    expect(verifyChain([])).toEqual({ valid: true });
  });

  it('hashes are deterministic (same payload → same hash)', () => {
    const payload = '2025-01-01T00:00:00.000Z|user|prompt|results|0';
    expect(sha256(payload)).toBe(sha256(payload));
  });

  it('different payloads produce different hashes', () => {
    expect(sha256('payload1')).not.toBe(sha256('payload2'));
  });
});

// ─── Integration: Live server HTTP tests ──────────────────────────────────
describe('Audit chain API (integration)', () => {
  it('server health check returns ok', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.ok).toBe(true);
    const data = await res.json() as Record<string, unknown>;
    expect(data.status).toBe('ok');
    expect(data.db).toBe('ok');
  });

  it('GET /api/owner/has-passphrase returns hasPassphrase: true', async () => {
    const res = await fetch(`${BASE_URL}/api/owner/has-passphrase`);
    expect(res.ok).toBe(true);
    const data = await res.json() as { hasPassphrase: boolean };
    expect(data.hasPassphrase).toBe(true);
  });

  it('POST /api/owner/verify with correct passphrase returns valid: true', async () => {
    const res = await fetch(`${BASE_URL}/api/owner/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: PASSPHRASE }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json() as { valid: boolean };
    expect(data.valid).toBe(true);
  });

  it('POST /api/owner/verify with wrong passphrase returns valid: false', async () => {
    const res = await fetch(`${BASE_URL}/api/owner/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: 'definitely-wrong-passphrase' }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json() as { valid: boolean };
    expect(data.valid).toBe(false);
  });

  it('GET /api/audit/logs without passphrase returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/audit/logs`);
    expect(res.status).toBe(401);
  });

  it('GET /api/audit/logs with correct passphrase returns array of entries', async () => {
    const res = await fetch(`${BASE_URL}/api/audit/logs`, {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    expect(res.ok).toBe(true);
    const logs = await res.json() as Record<string, unknown>[];
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
  });

  it('each audit entry has required fields (id, timestamp, user, prompt, results, previousHash, currentHash)', async () => {
    const res = await fetch(`${BASE_URL}/api/audit/logs`, {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    const logs = await res.json() as Record<string, unknown>[];

    for (const log of logs) {
      expect(log.id, 'entry missing id').toBeDefined();
      expect(log.timestamp, `entry ${log.id} missing timestamp`).toBeTruthy();
      expect(log.user, `entry ${log.id} missing user`).toBeTruthy();
      expect(log.prompt, `entry ${log.id} missing prompt`).toBeTruthy();
      expect(log.results, `entry ${log.id} missing results`).toBeTruthy();
      expect(log.previousHash, `entry ${log.id} missing previousHash`).toBeDefined();
      expect(log.currentHash, `entry ${log.id} missing currentHash`).toBeTruthy();
    }
  });

  it('each audit entry currentHash is a 64-char hex string', async () => {
    const res = await fetch(`${BASE_URL}/api/audit/logs`, {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    const logs = await res.json() as Record<string, unknown>[];

    for (const log of logs) {
      expect(
        (log.currentHash as string).length,
        `entry ${log.id} currentHash wrong length`
      ).toBe(64);
      expect(
        (log.currentHash as string),
        `entry ${log.id} currentHash not hex`
      ).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('the genesis entry (id=1) has previousHash "0"', async () => {
    const res = await fetch(`${BASE_URL}/api/audit/logs`, {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    const logs = await res.json() as Record<string, unknown>[];

    // Logs are returned in DESC order — find entry with id=1
    const genesis = logs.find((l) => l.id === 1);
    expect(genesis, 'Entry with id=1 (genesis) not found').toBeDefined();
    expect(genesis!.previousHash).toBe('0');
  });

  it('GET /api/audit/verify returns valid: true', async () => {
    const res = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    expect(res.ok).toBe(true);
    const data = await res.json() as { valid: boolean; brokenAt?: number };
    expect(data.valid).toBe(true);
    expect(data.brokenAt).toBeUndefined();
  });

  it('entries are chained: each previousHash matches prior currentHash', async () => {
    const res = await fetch(`${BASE_URL}/api/audit/logs`, {
      headers: { 'x-owner-passphrase': PASSPHRASE },
    });
    const logs = (await res.json() as Record<string, unknown>[])
      .sort((a, b) => (a.id as number) - (b.id as number));

    for (let i = 1; i < logs.length; i++) {
      expect(
        logs[i].previousHash,
        `Entry ${logs[i].id}.previousHash should match entry ${logs[i - 1].id}.currentHash`
      ).toBe(logs[i - 1].currentHash);
    }
  });
});
