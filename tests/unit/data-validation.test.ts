/**
 * data-validation.test.ts
 * Validates the shape and integrity of marketplace skills and community patterns.
 * Uses static file analysis and regex extraction to avoid React/JSX import issues.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ─── Known valid icon names from icon-map.ts ───────────────────────────────
const VALID_ICON_NAMES = new Set([
  'Anchor', 'Bird', 'BookOpen', 'Brain', 'Brush', 'Calendar', 'CircleDot',
  'Clock', 'Cloud', 'Clover', 'Compass', 'Container', 'Cpu', 'CreditCard',
  'Database', 'Dog', 'Drum', 'Feather', 'FileText', 'Fish', 'Flame',
  'Flower', 'Footprints', 'Gamepad2', 'Gem', 'GitBranch', 'Globe',
  'GraduationCap', 'Hammer', 'HandHeart', 'Handshake', 'HardDrive', 'Heart',
  'Layers', 'Mail', 'Map', 'MessageSquare', 'Mountain', 'Music', 'Network',
  'Palette', 'PartyPopper', 'Pen', 'Phone', 'Plug', 'Ribbon', 'Scale',
  'Search', 'Server', 'Shield', 'ShieldCheck', 'Snowflake', 'Sparkles',
  'Sprout', 'Store', 'Sunrise', 'Target', 'TicketCheck', 'Users', 'Wheat',
  'Wind', 'Wrench', 'Zap',
]);

const SKILLS_DIR = path.resolve(__dirname, '../../client/src/data/configs/skills');
const PATTERNS_DIR = path.resolve(__dirname, '../../client/src/data/configs/patterns');
const MARKETPLACE_FILE = path.resolve(__dirname, '../../client/src/data/marketplace-skills.ts');
const PATTERNS_FILE = path.resolve(__dirname, '../../client/src/data/community-patterns.ts');

// ─── Parse skill data from TypeScript source ───────────────────────────────
// Each MarketplaceSkill is defined as an object literal. We look for blocks
// immediately containing 'mcpEndpoint' to identify them (donation tiers, etc. don't have that).
function parseSkillsFromSource(): Array<Record<string, unknown>> {
  const src = fs.readFileSync(MARKETPLACE_FILE, 'utf8');

  // Split source into object-like blocks that contain mcpEndpoint (skill-specific field)
  const skills: Array<Record<string, unknown>> = [];

  // Find each skill block: starts at an id field and includes mcpEndpoint
  // Strategy: find all id: lines, then look forward for the mcpEndpoint within ~500 chars
  const idMatches = [...src.matchAll(/^\s{2,4}id:\s*["']([^"']+)["']/gm)];

  for (const idMatch of idMatches) {
    const skillId = idMatch[1];
    const startIdx = idMatch.index!;

    // Look at the next ~800 chars to find the skill block fields
    const window = src.slice(startIdx, startIdx + 800);

    // Only include actual skills (must have mcpEndpoint, not donation tiers or curators)
    if (!window.includes('mcpEndpoint')) continue;

    const skill: Record<string, unknown> = { id: skillId };

    // Extract each scalar field
    for (const field of ['name', 'provider', 'category', 'icon', 'description', 'mcpEndpoint', 'installCmd']) {
      const fm = window.match(new RegExp(`${field}:\\s*["']([^"']+)["']`));
      if (fm) skill[field] = fm[1];
    }

    // Extract tags array
    const tagsMatch = window.match(/tags:\s*\[([^\]]*)\]/s);
    if (tagsMatch) {
      skill.tags = [...tagsMatch[1].matchAll(/["']([^"']+)["']/g)].map(m => m[1]);
    }

    // Extract compatibility array
    const compatMatch = window.match(/compatibility:\s*\[([^\]]*)\]/s);
    if (compatMatch) {
      skill.compatibility = [...compatMatch[1].matchAll(/["']([^"']+)["']/g)].map(m => m[1]);
    }

    skills.push(skill);
  }

  return skills;
}

// ─── Parse pattern data from TypeScript source ─────────────────────────────
// CommunityPattern objects have config: getPatternConfig(...) — use that to identify them.
function parsePatternsFromSource(): Array<Record<string, unknown>> {
  const src = fs.readFileSync(PATTERNS_FILE, 'utf8');

  const patterns: Array<Record<string, unknown>> = [];
  const idMatches = [...src.matchAll(/^\s{2,4}id:\s*["']([^"']+)["']/gm)];

  for (const idMatch of idMatches) {
    const patternId = idMatch[1];
    const startIdx = idMatch.index!;
    const window = src.slice(startIdx, startIdx + 1200);

    // Only include actual patterns (must have getPatternConfig)
    if (!window.includes('getPatternConfig')) continue;

    const pattern: Record<string, unknown> = { id: patternId };

    for (const field of ['name', 'tagline', 'icon', 'color', 'audience']) {
      const fm = window.match(new RegExp(`${field}:\\s*["']([^"']+)["']`));
      if (fm) pattern[field] = fm[1];
    }

    // description and whyItMatters may use multi-line strings
    const descMatch = window.match(/description:\s*\n\s+["']([^"']+)["']/s);
    if (descMatch) {
      pattern.description = descMatch[1];
    } else {
      const inlineDesc = window.match(/description:\s*["']([^"']+)["']/);
      if (inlineDesc) pattern.description = inlineDesc[1];
    }

    if (!pattern.description) {
      // Check for template literal or multi-line
      pattern.description = window.includes('description:') ? '__multiline__' : undefined;
    }

    patterns.push(pattern);
  }

  return patterns;
}

// ─── Extract IDs from source files ────────────────────────────────────────
function extractSkillIdsFromSource(): string[] {
  const src = fs.readFileSync(MARKETPLACE_FILE, 'utf8');
  // Only extract IDs from actual skill objects (those near mcpEndpoint)
  return parseSkillsFromSource().map(s => s.id as string);
}

function extractPatternIdsFromSource(): string[] {
  return parsePatternsFromSource().map(p => p.id as string);
}

// ─── YAML config file tests ────────────────────────────────────────────────
describe('Skill YAML config files', () => {
  const yamlFiles = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  it('should have skill YAML config files present', () => {
    expect(yamlFiles.length).toBeGreaterThan(0);
  });

  it('each skill YAML file should be non-empty', () => {
    for (const file of yamlFiles) {
      const content = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
      expect(content.trim().length, `${file} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('each skill YAML should be readable as text', () => {
    for (const file of yamlFiles) {
      expect(() => {
        fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
      }).not.toThrow();
    }
  });
});

describe('Pattern YAML config files', () => {
  const yamlFiles = fs.readdirSync(PATTERNS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  it('should have pattern YAML config files present', () => {
    expect(yamlFiles.length).toBeGreaterThan(0);
  });

  it('each pattern YAML file should be non-empty', () => {
    for (const file of yamlFiles) {
      const content = fs.readFileSync(path.join(PATTERNS_DIR, file), 'utf8');
      expect(content.trim().length, `${file} should not be empty`).toBeGreaterThan(0);
    }
  });

  it('pattern YAML count is at least as many as community-patterns.ts count', () => {
    const patternIds = extractPatternIdsFromSource();
    const yamlCount = yamlFiles.length;
    // There should be at least as many YAML files as patterns in the TS source
    // (some YAML files may be drafts not yet listed in the TS source)
    expect(yamlCount).toBeGreaterThanOrEqual(patternIds.length);
  });
});

// ─── Marketplace skill TypeScript source validation ────────────────────────
describe('Marketplace Skills (source validation)', () => {
  const skills = parseSkillsFromSource();

  it('should have at least 10 skills defined', () => {
    expect(skills.length).toBeGreaterThanOrEqual(10);
  });

  it('each skill should have a non-empty id', () => {
    for (const skill of skills) {
      expect(skill.id, `Skill missing id`).toBeTruthy();
      expect(typeof skill.id).toBe('string');
    }
  });

  it('each skill should have a non-empty name', () => {
    const noName = skills.filter(s => !s.name);
    expect(
      noName.map(s => s.id).join(', '),
      `Skills missing name`
    ).toBe('');
  });

  it('each skill should have a non-empty provider', () => {
    const noProvider = skills.filter(s => !s.provider);
    expect(
      noProvider.map(s => s.id).join(', '),
      `Skills missing provider`
    ).toBe('');
  });

  it('each skill should have a non-empty icon', () => {
    const noIcon = skills.filter(s => !s.icon);
    expect(
      noIcon.map(s => s.id).join(', '),
      `Skills missing icon`
    ).toBe('');
  });

  it('each skill icon should be in the icon map', () => {
    for (const skill of skills) {
      const icon = skill.icon as string;
      if (!icon) continue; // Already caught above
      expect(
        VALID_ICON_NAMES.has(icon),
        `Skill "${skill.id}" has unknown icon "${icon}"`
      ).toBe(true);
    }
  });

  it('each skill should have a non-empty description', () => {
    const noDesc = skills.filter(s => !s.description);
    expect(
      noDesc.map(s => s.id).join(', '),
      `Skills missing description`
    ).toBe('');
  });

  it('each skill should have mcpEndpoint', () => {
    const noEndpoint = skills.filter(s => !s.mcpEndpoint);
    expect(
      noEndpoint.map(s => s.id).join(', '),
      `Skills missing mcpEndpoint`
    ).toBe('');
  });

  it('each skill should have installCmd', () => {
    const noCmd = skills.filter(s => !s.installCmd);
    expect(
      noCmd.map(s => s.id).join(', '),
      `Skills missing installCmd`
    ).toBe('');
  });

  it('should have no duplicate skill ids', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const skill of skills) {
      const id = skill.id as string;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes, `Duplicate skill IDs: ${dupes.join(', ')}`).toHaveLength(0);
  });

  it('each skill has a corresponding YAML config file', () => {
    const skillIds = extractSkillIdsFromSource();
    for (const id of skillIds) {
      const yamlPath = path.join(SKILLS_DIR, `${id}.yaml`);
      expect(
        fs.existsSync(yamlPath),
        `Skill "${id}" missing YAML config at ${yamlPath}`
      ).toBe(true);
    }
  });
});

// ─── Community patterns TypeScript source validation ───────────────────────
describe('Community Patterns (source validation)', () => {
  const patterns = parsePatternsFromSource();

  it('should have at least 10 patterns defined', () => {
    expect(patterns.length).toBeGreaterThanOrEqual(10);
  });

  it('each pattern should have a non-empty id', () => {
    const noId = patterns.filter(p => !p.id);
    expect(noId.length, `Patterns missing id`).toBe(0);
  });

  it('each pattern should have a non-empty name', () => {
    const noName = patterns.filter(p => !p.name);
    expect(
      noName.map(p => p.id).join(', '),
      `Patterns missing name`
    ).toBe('');
  });

  it('each pattern should have a non-empty icon', () => {
    const noIcon = patterns.filter(p => !p.icon);
    expect(
      noIcon.map(p => p.id).join(', '),
      `Patterns missing icon`
    ).toBe('');
  });

  it('each pattern icon should be in the icon map', () => {
    for (const pattern of patterns) {
      const icon = pattern.icon as string;
      if (!icon) continue;
      expect(
        VALID_ICON_NAMES.has(icon),
        `Pattern "${pattern.id}" has unknown icon "${icon}"`
      ).toBe(true);
    }
  });

  it('each pattern should have a description (inline or multiline)', () => {
    const noDesc = patterns.filter(p => !p.description);
    expect(
      noDesc.map(p => p.id).join(', '),
      `Patterns missing description`
    ).toBe('');
  });

  it('should have no duplicate pattern ids', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const pattern of patterns) {
      const id = pattern.id as string;
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes, `Duplicate pattern IDs: ${dupes.join(', ')}`).toHaveLength(0);
  });

  it('each pattern should have a YAML config file', () => {
    const patternIds = extractPatternIdsFromSource();
    for (const id of patternIds) {
      const yamlPath = path.join(PATTERNS_DIR, `${id}.yaml`);
      expect(
        fs.existsSync(yamlPath),
        `Pattern "${id}" is missing YAML config at ${yamlPath}`
      ).toBe(true);
    }
  });
});

// ─── Icon map completeness ─────────────────────────────────────────────────
describe('Icon map coverage', () => {
  it('VALID_ICON_NAMES set has at least 60 entries', () => {
    expect(VALID_ICON_NAMES.size).toBeGreaterThanOrEqual(60);
  });

  it('icon-map.ts file exists', () => {
    const iconMapPath = path.resolve(__dirname, '../../client/src/lib/icon-map.ts');
    expect(fs.existsSync(iconMapPath)).toBe(true);
  });

  it('all icon names in VALID_ICON_NAMES are referenced in icon-map.ts', () => {
    const iconMapSrc = fs.readFileSync(
      path.resolve(__dirname, '../../client/src/lib/icon-map.ts'),
      'utf8'
    );
    for (const name of VALID_ICON_NAMES) {
      expect(
        iconMapSrc.includes(name),
        `Icon "${name}" is in VALID_ICON_NAMES but not found in icon-map.ts`
      ).toBe(true);
    }
  });
});
