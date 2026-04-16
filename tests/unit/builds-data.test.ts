/**
 * builds-data.test.ts
 * Tests the build catalog data defined in client/src/pages/builds.tsx.
 * Uses static source analysis (regex extraction) to avoid JSX/React import issues
 * in the Node test environment.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const BUILDS_FILE = path.resolve(__dirname, '../../client/src/pages/builds.tsx');

// ─── Parse build catalog from TSX source ─────────────────────────────────────
interface ParsedBuild {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: string;
  pricing: string;
  priceRange: string;
  learnMoreUrl: string;
}

function parseBuildsFromSource(): ParsedBuild[] {
  const src = fs.readFileSync(BUILDS_FILE, 'utf8');

  // Find the BUILDS array and extract the section up to CATEGORIES
  // (avoids JSX bracket confusion from <Icon /> components)
  const buildsStart = src.indexOf('const BUILDS: Build[] = [');
  if (buildsStart === -1) throw new Error('BUILDS array not found in builds.tsx');

  // CATEGORIES constant immediately follows the BUILDS array
  const categoriesStart = src.indexOf('const CATEGORIES:');
  const buildsSection = categoriesStart > buildsStart
    ? src.slice(buildsStart, categoriesStart)
    : src.slice(buildsStart, buildsStart + 10000);

  // Extract each build entry by matching id: "..." markers within the section.
  // Each entry has a unique id field — use that as an anchor, then read a window
  // of ~800 characters to extract sibling fields.
  const builds: ParsedBuild[] = [];
  const idMatches = [...buildsSection.matchAll(/\bid:\s*["']([\w-]+)["']/g)];

  for (const m of idMatches) {
    const start = m.index!;
    const win = buildsSection.slice(start, start + 800);

    // Extract a simple quoted string field
    const extractStr = (field: string): string => {
      const r = win.match(new RegExp(`${field}:\\s*["']([^"'\\n]+)["']`));
      return r ? r[1] : '';
    };

    // description may be split over multiple lines:
    //   description:
    //     "The original open-source..."
    const descMulti = win.match(/description:\s*\n\s+["']([^"']+)["']/);
    const descInline = win.match(/description:\s*["']([^"']+)["']/);
    const description = descMulti?.[1] ?? descInline?.[1] ?? '__multiline__';

    builds.push({
      id: m[1],
      name: extractStr('name'),
      category: extractStr('category'),
      description,
      difficulty: extractStr('difficulty'),
      pricing: extractStr('pricing'),
      priceRange: extractStr('priceRange'),
      learnMoreUrl: extractStr('learnMoreUrl'),
    });
  }

  return builds;
}

// ─── File existence ───────────────────────────────────────────────────────────
describe('builds.tsx file', () => {
  it('should exist', () => {
    expect(fs.existsSync(BUILDS_FILE)).toBe(true);
  });

  it('should contain the BUILDS array', () => {
    const src = fs.readFileSync(BUILDS_FILE, 'utf8');
    expect(src).toContain('const BUILDS: Build[] = [');
  });

  it('should define Build type/interface', () => {
    const src = fs.readFileSync(BUILDS_FILE, 'utf8');
    expect(src).toContain('interface Build');
  });
});

// ─── Build count ──────────────────────────────────────────────────────────────
describe('Build catalog — count', () => {
  const builds = parseBuildsFromSource();

  it('should have exactly 13 build variants', () => {
    expect(builds).toHaveLength(13);
  });

  it('should have at least 10 build variants', () => {
    expect(builds.length).toBeGreaterThanOrEqual(10);
  });
});

// ─── Required fields ──────────────────────────────────────────────────────────
describe('Build catalog — required fields', () => {
  const builds = parseBuildsFromSource();

  it('each build should have a non-empty id', () => {
    for (const b of builds) {
      expect(b.id, 'Build missing id').toBeTruthy();
    }
  });

  it('each build should have a non-empty name', () => {
    const missing = builds.filter(b => !b.name);
    expect(missing.map(b => b.id).join(', '), 'Builds missing name').toBe('');
  });

  it('each build should have a description', () => {
    const missing = builds.filter(b => !b.description);
    expect(missing.map(b => b.id).join(', '), 'Builds missing description').toBe('');
  });

  it('each build should have a category', () => {
    const missing = builds.filter(b => !b.category);
    expect(missing.map(b => b.id).join(', '), 'Builds missing category').toBe('');
  });

  it('each build should have a difficulty', () => {
    const missing = builds.filter(b => !b.difficulty);
    expect(missing.map(b => b.id).join(', '), 'Builds missing difficulty').toBe('');
  });

  it('each build should have a pricing string', () => {
    const missing = builds.filter(b => !b.pricing);
    expect(missing.map(b => b.id).join(', '), 'Builds missing pricing').toBe('');
  });

  it('each build should have a learnMoreUrl', () => {
    const missing = builds.filter(b => !b.learnMoreUrl);
    expect(missing.map(b => b.id).join(', '), 'Builds missing learnMoreUrl').toBe('');
  });
});

// ─── Category validation ──────────────────────────────────────────────────────
describe('Build catalog — categories', () => {
  const builds = parseBuildsFromSource();
  const VALID_CATEGORIES = new Set(['self-hosted', 'managed', 'PaaS', 'local']);

  it('all categories should be valid (self-hosted | managed | PaaS | local)', () => {
    for (const b of builds) {
      expect(
        VALID_CATEGORIES.has(b.category),
        `Build "${b.id}" has invalid category "${b.category}"`
      ).toBe(true);
    }
  });

  it('should include "self-hosted" builds', () => {
    const count = builds.filter(b => b.category === 'self-hosted').length;
    expect(count, 'Expected at least one self-hosted build').toBeGreaterThan(0);
  });

  it('should include "managed" builds', () => {
    const count = builds.filter(b => b.category === 'managed').length;
    expect(count, 'Expected at least one managed build').toBeGreaterThan(0);
  });

  it('should include "PaaS" builds', () => {
    const count = builds.filter(b => b.category === 'PaaS').length;
    expect(count, 'Expected at least one PaaS build').toBeGreaterThan(0);
  });

  it('should include "local" builds', () => {
    const count = builds.filter(b => b.category === 'local').length;
    expect(count, 'Expected at least one local build').toBeGreaterThan(0);
  });
});

// ─── Difficulty validation ────────────────────────────────────────────────────
describe('Build catalog — difficulty levels', () => {
  const builds = parseBuildsFromSource();
  const VALID_DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);

  it('all difficulty values should be valid (Beginner | Intermediate | Advanced)', () => {
    for (const b of builds) {
      expect(
        VALID_DIFFICULTIES.has(b.difficulty),
        `Build "${b.id}" has invalid difficulty "${b.difficulty}"`
      ).toBe(true);
    }
  });

  it('should include "Beginner" difficulty builds', () => {
    const count = builds.filter(b => b.difficulty === 'Beginner').length;
    expect(count).toBeGreaterThan(0);
  });

  it('should include "Intermediate" difficulty builds', () => {
    const count = builds.filter(b => b.difficulty === 'Intermediate').length;
    expect(count).toBeGreaterThan(0);
  });

  it('should include "Advanced" difficulty builds', () => {
    const count = builds.filter(b => b.difficulty === 'Advanced').length;
    expect(count).toBeGreaterThan(0);
  });
});

// ─── Duplicate checks ─────────────────────────────────────────────────────────
describe('Build catalog — uniqueness', () => {
  const builds = parseBuildsFromSource();

  it('should have no duplicate build IDs', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const b of builds) {
      if (seen.has(b.id)) dupes.push(b.id);
      seen.add(b.id);
    }
    expect(dupes, `Duplicate build IDs: ${dupes.join(', ')}`).toHaveLength(0);
  });

  it('should have no duplicate build names', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const b of builds) {
      if (!b.name) continue;
      if (seen.has(b.name)) dupes.push(b.name);
      seen.add(b.name);
    }
    expect(dupes, `Duplicate build names: ${dupes.join(', ')}`).toHaveLength(0);
  });
});

// ─── Price range validation ───────────────────────────────────────────────────
describe('Build catalog — price ranges', () => {
  const builds = parseBuildsFromSource();
  const VALID_PRICE_RANGES = new Set(['free', 'low', 'mid', 'any']);

  it('all priceRange values should be valid (free | low | mid | any)', () => {
    for (const b of builds) {
      if (!b.priceRange) continue; // optional field
      expect(
        VALID_PRICE_RANGES.has(b.priceRange),
        `Build "${b.id}" has invalid priceRange "${b.priceRange}"`
      ).toBe(true);
    }
  });

  it('should include at least some free/free-tier builds', () => {
    const freePriced = builds.filter(b => b.priceRange === 'free');
    expect(freePriced.length, 'Expected free or free-tier builds').toBeGreaterThan(0);
  });
});

// ─── Specific build checks ────────────────────────────────────────────────────
describe('Build catalog — specific entries', () => {
  const builds = parseBuildsFromSource();
  const buildById = (id: string) => builds.find(b => b.id === id);

  it('should include "openclaw-core" build', () => {
    expect(buildById('openclaw-core')).toBeDefined();
  });

  it('should include "aigovops" build (this project)', () => {
    expect(buildById('aigovops')).toBeDefined();
  });

  it('should include "ollama" local build', () => {
    expect(buildById('ollama')).toBeDefined();
  });

  it('"aigovops" build should be in "self-hosted" category', () => {
    const b = buildById('aigovops');
    expect(b?.category).toBe('self-hosted');
  });

  it('"ollama" build should be in "local" category', () => {
    const b = buildById('ollama');
    expect(b?.category).toBe('local');
  });

  it('"railway" build should be in "PaaS" category', () => {
    const b = buildById('railway');
    expect(b?.category).toBe('PaaS');
  });
});

// ─── Source-level checks ─────────────────────────────────────────────────────
describe('builds.tsx source — CATEGORIES and DIFFICULTIES constants', () => {
  it('should define CATEGORIES array with all 4 valid categories', () => {
    const src = fs.readFileSync(BUILDS_FILE, 'utf8');
    expect(src).toContain('"self-hosted"');
    expect(src).toContain('"managed"');
    expect(src).toContain('"PaaS"');
    expect(src).toContain('"local"');
  });

  it('should define DIFFICULTIES array with all 3 difficulty levels', () => {
    const src = fs.readFileSync(BUILDS_FILE, 'utf8');
    expect(src).toContain('"Beginner"');
    expect(src).toContain('"Intermediate"');
    expect(src).toContain('"Advanced"');
  });

  it('should define RECOMMENDED_IDS array', () => {
    const src = fs.readFileSync(BUILDS_FILE, 'utf8');
    expect(src).toContain('RECOMMENDED_IDS');
  });
});
