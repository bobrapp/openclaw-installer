/**
 * marketplace-data.test.ts
 * Tests marketplace data integrity using static file analysis.
 * Reads marketplace-unified.ts and marketplace-skills.ts via regex
 * to avoid JSX/React import issues in the Node test environment.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const UNIFIED_FILE = path.resolve(__dirname, '../../client/src/data/marketplace-unified.ts');
const SKILLS_FILE = path.resolve(__dirname, '../../client/src/data/marketplace-skills.ts');
const PATTERNS_FILE = path.resolve(__dirname, '../../client/src/data/community-patterns.ts');

// ─── Parse helpers ────────────────────────────────────────────────────────────

/** Extract quoted string field values from an object block window */
function extractField(window: string, field: string): string | undefined {
  const m = window.match(new RegExp(`${field}:\\s*["']([^"']+)["']`));
  return m ? m[1] : undefined;
}

/** Parse hosting entries from marketplace-unified.ts */
function parseHostingEntries(): Array<Record<string, unknown>> {
  const src = fs.readFileSync(UNIFIED_FILE, 'utf8');
  const hostingStart = src.indexOf('export const hostingEntries');
  const nextExport = src.indexOf('export const', hostingStart + 1);
  const section = src.slice(hostingStart, nextExport);

  const entries: Array<Record<string, unknown>> = [];
  const idMatches = [...section.matchAll(/\bid:\s*["']([\w-]+)["']/g)];
  for (const m of idMatches) {
    const start = m.index!;
    const window = section.slice(start, start + 600);
    entries.push({
      id: m[1],
      kind: extractField(window, 'kind'),
      name: extractField(window, 'name'),
      provider: extractField(window, 'provider'),
      category: extractField(window, 'category'),
      description: extractField(window, 'description'),
      trustTier: extractField(window, 'trustTier'),
    });
  }
  return entries;
}

/** Parse bundle entries from marketplace-unified.ts */
function parseBundleEntries(): Array<Record<string, unknown>> {
  const src = fs.readFileSync(UNIFIED_FILE, 'utf8');
  const bundleStart = src.indexOf('export const oneClickBundles');
  const nextExport = src.indexOf('// ══', bundleStart + 1);
  const section = src.slice(bundleStart, nextExport > bundleStart ? nextExport : bundleStart + 3000);

  const entries: Array<Record<string, unknown>> = [];
  const idMatches = [...section.matchAll(/\bid:\s*["']([\w-]+)["']/g)];
  for (const m of idMatches) {
    const start = m.index!;
    const window = section.slice(start, start + 600);
    entries.push({
      id: m[1],
      kind: extractField(window, 'kind'),
      name: extractField(window, 'name'),
      provider: extractField(window, 'provider'),
      category: extractField(window, 'category'),
      description: extractField(window, 'description'),
      trustTier: extractField(window, 'trustTier'),
    });
  }
  return entries;
}

/** Parse connector/skill entries from marketplace-skills.ts */
function parseSkillEntries(): Array<Record<string, unknown>> {
  const src = fs.readFileSync(SKILLS_FILE, 'utf8');
  const entries: Array<Record<string, unknown>> = [];
  const idMatches = [...src.matchAll(/^\s{2,4}id:\s*["']([\w-]+)["']/gm)];
  for (const m of idMatches) {
    const start = m.index!;
    const window = src.slice(start, start + 800);
    if (!window.includes('mcpEndpoint')) continue;
    entries.push({
      id: m[1],
      name: extractField(window, 'name'),
      provider: extractField(window, 'provider'),
      category: extractField(window, 'category'),
      description: extractField(window, 'description'),
      mcpEndpoint: extractField(window, 'mcpEndpoint'),
    });
  }
  return entries;
}

/** Parse agent/pattern entries from community-patterns.ts */
function parsePatternEntries(): Array<Record<string, unknown>> {
  const src = fs.readFileSync(PATTERNS_FILE, 'utf8');
  const entries: Array<Record<string, unknown>> = [];
  const idMatches = [...src.matchAll(/^\s{2,4}id:\s*["']([\w-]+)["']/gm)];
  for (const m of idMatches) {
    const start = m.index!;
    const window = src.slice(start, start + 1200);
    if (!window.includes('getPatternConfig')) continue;
    entries.push({
      id: m[1],
      name: extractField(window, 'name'),
      tagline: extractField(window, 'tagline'),
      icon: extractField(window, 'icon'),
      color: extractField(window, 'color'),
      audience: extractField(window, 'audience'),
    });
  }
  return entries;
}

// ─── Data files existence ─────────────────────────────────────────────────────
describe('Marketplace data files', () => {
  it('marketplace-unified.ts should exist', () => {
    expect(fs.existsSync(UNIFIED_FILE)).toBe(true);
  });

  it('marketplace-skills.ts should exist', () => {
    expect(fs.existsSync(SKILLS_FILE)).toBe(true);
  });

  it('community-patterns.ts should exist', () => {
    expect(fs.existsSync(PATTERNS_FILE)).toBe(true);
  });
});

// ─── Hosting entries (marketplace-unified.ts) ─────────────────────────────────
describe('Hosting entries (marketplace-unified.ts)', () => {
  const entries = parseHostingEntries();

  it('should have exactly 16 hosting entries', () => {
    expect(entries).toHaveLength(16);
  });

  it('each hosting entry should have a non-empty id', () => {
    for (const e of entries) {
      expect(e.id, 'Entry missing id').toBeTruthy();
    }
  });

  it('each hosting entry should have a non-empty name', () => {
    const missing = entries.filter(e => !e.name);
    expect(missing.map(e => e.id).join(', '), 'Entries missing name').toBe('');
  });

  it('each hosting entry should have a non-empty provider', () => {
    const missing = entries.filter(e => !e.provider);
    expect(missing.map(e => e.id).join(', '), 'Entries missing provider').toBe('');
  });

  it('each hosting entry should have a non-empty description', () => {
    const missing = entries.filter(e => !e.description);
    expect(missing.map(e => e.id).join(', '), 'Entries missing description').toBe('');
  });

  it('each hosting entry should have a trustTier', () => {
    const missing = entries.filter(e => !e.trustTier);
    expect(missing.map(e => e.id).join(', '), 'Entries missing trustTier').toBe('');
  });

  it('each hosting entry trustTier should be valid (official|verified|listed)', () => {
    const validTiers = new Set(['official', 'verified', 'listed']);
    for (const e of entries) {
      if (!e.trustTier) continue;
      expect(
        validTiers.has(e.trustTier as string),
        `Entry "${e.id}" has invalid trustTier "${e.trustTier}"`
      ).toBe(true);
    }
  });

  it('should have no duplicate hosting entry IDs', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const e of entries) {
      const id = e.id as string;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0);
  });
});

// ─── Bundle entries (oneClickBundles) ─────────────────────────────────────────
describe('Bundle entries (marketplace-unified.ts)', () => {
  const bundles = parseBundleEntries();

  it('should have at least 4 one-click bundles', () => {
    expect(bundles.length).toBeGreaterThanOrEqual(4);
  });

  it('each bundle should have a non-empty id', () => {
    for (const b of bundles) {
      expect(b.id, 'Bundle missing id').toBeTruthy();
    }
  });

  it('each bundle should have a non-empty name', () => {
    const missing = bundles.filter(b => !b.name);
    expect(missing.map(b => b.id).join(', '), 'Bundles missing name').toBe('');
  });

  it('each bundle should have a non-empty description', () => {
    const missing = bundles.filter(b => !b.description);
    expect(missing.map(b => b.id).join(', '), 'Bundles missing description').toBe('');
  });

  it('each bundle trustTier should be valid', () => {
    const validTiers = new Set(['official', 'verified', 'listed']);
    for (const b of bundles) {
      if (!b.trustTier) continue;
      expect(
        validTiers.has(b.trustTier as string),
        `Bundle "${b.id}" has invalid trustTier "${b.trustTier}"`
      ).toBe(true);
    }
  });

  it('should have no duplicate bundle IDs', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const b of bundles) {
      const id = b.id as string;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0);
  });
});

// ─── Skill/connector entries (marketplace-skills.ts) ─────────────────────────
describe('Skill/connector entries (marketplace-skills.ts)', () => {
  const skills = parseSkillEntries();

  it('should have at least 20 skill entries', () => {
    expect(skills.length).toBeGreaterThanOrEqual(20);
  });

  it('each skill should have a non-empty id', () => {
    for (const s of skills) {
      expect(s.id, 'Skill missing id').toBeTruthy();
    }
  });

  it('each skill should have a non-empty name', () => {
    const missing = skills.filter(s => !s.name);
    expect(missing.map(s => s.id).join(', '), 'Skills missing name').toBe('');
  });

  it('each skill should have a non-empty description', () => {
    const missing = skills.filter(s => !s.description);
    expect(missing.map(s => s.id).join(', '), 'Skills missing description').toBe('');
  });

  it('each skill should have an mcpEndpoint', () => {
    const missing = skills.filter(s => !s.mcpEndpoint);
    expect(missing.map(s => s.id).join(', '), 'Skills missing mcpEndpoint').toBe('');
  });

  it('should have no duplicate skill IDs', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const s of skills) {
      const id = s.id as string;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0);
  });
});

// ─── Agent/pattern entries (community-patterns.ts) ────────────────────────────
describe('Agent/pattern entries (community-patterns.ts)', () => {
  const patterns = parsePatternEntries();

  it('should have at least 25 pattern entries', () => {
    expect(patterns.length).toBeGreaterThanOrEqual(25);
  });

  it('each pattern should have a non-empty id', () => {
    for (const p of patterns) {
      expect(p.id, 'Pattern missing id').toBeTruthy();
    }
  });

  it('each pattern should have a non-empty name', () => {
    const missing = patterns.filter(p => !p.name);
    expect(missing.map(p => p.id).join(', '), 'Patterns missing name').toBe('');
  });

  it('should have no duplicate pattern IDs', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const p of patterns) {
      const id = p.id as string;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes, `Duplicate IDs: ${dupes.join(', ')}`).toHaveLength(0);
  });
});

// ─── Total marketplace count ──────────────────────────────────────────────────
describe('Total marketplace entry count', () => {
  it('total entries across all sources should be at least 75', () => {
    const hosting = parseHostingEntries();
    const bundles = parseBundleEntries();
    const skills = parseSkillEntries();
    const patterns = parsePatternEntries();
    const total = hosting.length + bundles.length + skills.length + patterns.length;
    expect(total).toBeGreaterThanOrEqual(75);
  });

  it('combined IDs across all sources should have no cross-source duplicates (bundles vs hosting)', () => {
    const hostingIds = new Set(parseHostingEntries().map(e => e.id as string));
    const bundleIds = parseBundleEntries().map(e => e.id as string);
    const crossDupes = bundleIds.filter(id => hostingIds.has(id));
    expect(crossDupes, `IDs appear in both hosting and bundles: ${crossDupes.join(', ')}`).toHaveLength(0);
  });
});

// ─── URL format validation (hosting entries) ──────────────────────────────────
describe('Hosting entry URL format', () => {
  it('all hosting entries with a url field should have valid https:// URLs', () => {
    const src = fs.readFileSync(UNIFIED_FILE, 'utf8');
    const hostingStart = src.indexOf('export const hostingEntries');
    const nextExport = src.indexOf('export const', hostingStart + 1);
    const section = src.slice(hostingStart, nextExport);

    // Extract all url: "..." values from the hosting section
    const urlMatches = [...section.matchAll(/\burl:\s*["'](https?:\/\/[^"']+)["']/g)];
    expect(urlMatches.length, 'Expected at least some URL entries').toBeGreaterThan(0);

    for (const m of urlMatches) {
      const url = m[1];
      expect(url, `Invalid URL format: "${url}"`).toMatch(/^https?:\/\/.+/);
    }
  });
});

// ─── Trust tier distribution ──────────────────────────────────────────────────
describe('Trust tier distribution (hosting)', () => {
  const VALID_TIERS = new Set(['official', 'verified', 'listed']);

  it('should contain entries with trustTier "verified"', () => {
    const entries = parseHostingEntries();
    const verified = entries.filter(e => e.trustTier === 'verified');
    expect(verified.length).toBeGreaterThan(0);
  });

  it('should contain entries with trustTier "listed"', () => {
    const entries = parseHostingEntries();
    const listed = entries.filter(e => e.trustTier === 'listed');
    expect(listed.length).toBeGreaterThan(0);
  });

  it('all trust tiers in hosting entries should be valid', () => {
    const entries = parseHostingEntries();
    for (const e of entries) {
      if (!e.trustTier) continue;
      expect(VALID_TIERS.has(e.trustTier as string), `Invalid tier "${e.trustTier}" for "${e.id}"`).toBe(true);
    }
  });
});
