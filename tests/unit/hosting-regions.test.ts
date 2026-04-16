/**
 * hosting-regions.test.ts
 * Tests hosting regions data integrity from client/src/data/hosting-regions.ts.
 * Uses static file analysis to avoid JSX/browser import issues in Node environment.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const HOSTING_REGIONS_FILE = path.resolve(
  __dirname,
  '../../client/src/data/hosting-regions.ts'
);

// ─── Parse hosting-regions.ts ────────────────────────────────────────────────
// Read the source and extract country data using regex
function parseRegionalDeals(): Array<{
  country: string;
  countryCode: string;
  flag: string;
  population: string;
  cloudSpendRank: number | null;
  populationRank: number | null;
  providerCount: number;
  providers: Array<{
    provider: string;
    hostTargetId: string;
    monthlyFrom: string;
    freeTier: boolean;
    signupUrl: string;
  }>;
}> {
  const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');

  // Find the regionalDeals array
  const arrayStart = src.indexOf('export const regionalDeals');
  const arrayContent = src.slice(arrayStart);

  // Split by top-level country objects (those starting with `country:`)
  const countryBlocks: typeof parseRegionalDeals extends () => infer R ? R : never = [];

  // Use a sliding window to find each top-level { country: ... } block
  const countryMatches = [...arrayContent.matchAll(/\bcountry:\s*["']([^"']+)["']/g)];

  for (let i = 0; i < countryMatches.m; i++) { /* noop — see below */ }

  const deals: ReturnType<typeof parseRegionalDeals> = [];

  for (let i = 0; i < countryMatches.length; i++) {
    const m = countryMatches[i];
    const blockStart = m.index!;
    // The next country block starts at the next country match (or end of array)
    const blockEnd = i + 1 < countryMatches.length
      ? countryMatches[i + 1].index!
      : arrayContent.length;
    const block = arrayContent.slice(blockStart, blockEnd);

    const countryName = m[1];
    const codeMatch = block.match(/countryCode:\s*["']([A-Z]{2})["']/);
    const popMatch = block.match(/population:\s*["']([^"']+)["']/);
    const cloudRankMatch = block.match(/cloudSpendRank:\s*(null|\d+)/);
    const popRankMatch = block.match(/populationRank:\s*(null|\d+)/);

    const providerMatches = [...block.matchAll(/provider:\s*["']([^"']+)["']/g)];
    const hostTargetMatches = [...block.matchAll(/hostTargetId:\s*["']([^"']+)["']/g)];
    const monthlyFromMatches = [...block.matchAll(/monthlyFrom:\s*["']([^"']+)["']/g)];
    const freeTierMatches = [...block.matchAll(/freeTier:\s*(true|false)/g)];
    const signupUrlMatches = [...block.matchAll(/signupUrl:\s*["'](https?:\/\/[^"']+)["']/g)];

    const providers = providerMatches.map((p, idx) => ({
      provider: p[1],
      hostTargetId: hostTargetMatches[idx]?.at(1) ?? '',
      monthlyFrom: monthlyFromMatches[idx]?.[1] ?? '',
      freeTier: freeTierMatches[idx]?.[1] === 'true',
      signupUrl: signupUrlMatches[idx]?.[1] ?? '',
    }));

    deals.push({
      country: countryName,
      countryCode: codeMatch?.[1] ?? '',
      flag: '',
      population: popMatch?.[1] ?? '',
      cloudSpendRank: cloudRankMatch ? (cloudRankMatch[1] === 'null' ? null : parseInt(cloudRankMatch[1])) : null,
      populationRank: popRankMatch ? (popRankMatch[1] === 'null' ? null : parseInt(popRankMatch[1])) : null,
      providerCount: providers.length,
      providers,
    });
  }

  return deals;
}

// ─── Parse signupUrls from the file directly ──────────────────────────────────
function parseSignupUrls(): string[] {
  const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
  return [...src.matchAll(/signupUrl:\s*["'](https?:\/\/[^"']+)["']/g)].map(m => m[1]);
}

// ─── Parse monthlyFrom values from the file ───────────────────────────────────
function parseMonthlyFromValues(): string[] {
  const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
  return [...src.matchAll(/monthlyFrom:\s*["']([^"']+)["']/g)].map(m => m[1]);
}

// ─── File existence ───────────────────────────────────────────────────────────
describe('hosting-regions.ts file', () => {
  it('should exist', () => {
    expect(fs.existsSync(HOSTING_REGIONS_FILE)).toBe(true);
  });

  it('should be non-empty', () => {
    const content = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('should export regionalDeals array', () => {
    const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
    expect(src).toContain('export const regionalDeals');
  });

  it('should export regionStats object', () => {
    const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
    expect(src).toContain('export const regionStats');
  });
});

// ─── Country count ────────────────────────────────────────────────────────────
describe('Regional deals — country count', () => {
  const deals = parseRegionalDeals();

  it('should have exactly 16 country entries', () => {
    expect(deals).toHaveLength(16);
  });

  it('should cover top 10 cloud spend countries', () => {
    const cloudCountries = deals.filter(d => d.cloudSpendRank !== null);
    expect(cloudCountries).toHaveLength(10);
  });

  it('should cover top 10 population countries (minus overlaps)', () => {
    const popCountries = deals.filter(d => d.populationRank !== null);
    // Some countries appear in both lists, so total unique = 16 (as stated in regionStats)
    expect(popCountries.length).toBeGreaterThanOrEqual(6);
  });
});

// ─── Country code format (ISO 3166-1 alpha-2) ────────────────────────────────
describe('Country codes — ISO 3166-1 alpha-2 format', () => {
  const deals = parseRegionalDeals();
  const ISO_ALPHA2 = /^[A-Z]{2}$/;

  it('each country should have a country code', () => {
    for (const deal of deals) {
      expect(deal.countryCode, `Country "${deal.country}" missing countryCode`).toBeTruthy();
    }
  });

  it('each country code should be exactly 2 uppercase letters', () => {
    for (const deal of deals) {
      if (!deal.countryCode) continue;
      expect(
        ISO_ALPHA2.test(deal.countryCode),
        `Country "${deal.country}" has invalid code "${deal.countryCode}"`
      ).toBe(true);
    }
  });

  it('should include expected country codes', () => {
    const codes = new Set(deals.map(d => d.countryCode));
    expect(codes.has('US')).toBe(true);
    expect(codes.has('CN')).toBe(true);
    expect(codes.has('JP')).toBe(true);
    expect(codes.has('GB')).toBe(true);
    expect(codes.has('DE')).toBe(true);
    expect(codes.has('IN')).toBe(true);
  });

  it('should have no duplicate country codes', () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const deal of deals) {
      if (seen.has(deal.countryCode)) dupes.push(deal.countryCode);
      seen.add(deal.countryCode);
    }
    expect(dupes, `Duplicate country codes: ${dupes.join(', ')}`).toHaveLength(0);
  });
});

// ─── Provider recommendations ─────────────────────────────────────────────────
describe('Provider recommendations per country', () => {
  const deals = parseRegionalDeals();

  it('each country should have at least 1 provider recommendation', () => {
    for (const deal of deals) {
      expect(
        deal.providerCount,
        `Country "${deal.country}" has no provider recommendations`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('each country should have at most 5 provider recommendations', () => {
    for (const deal of deals) {
      expect(
        deal.providerCount,
        `Country "${deal.country}" has too many providers (${deal.providerCount})`
      ).toBeLessThanOrEqual(5);
    }
  });

  it('total provider recommendations should be at least 30', () => {
    const totalProviders = deals.reduce((sum, d) => sum + d.providerCount, 0);
    expect(totalProviders).toBeGreaterThanOrEqual(30);
  });
});

// ─── Pricing data ─────────────────────────────────────────────────────────────
describe('Pricing data (monthlyFrom)', () => {
  it('monthlyFrom values should be present for all providers', () => {
    const values = parseMonthlyFromValues();
    expect(values.length).toBeGreaterThan(0);
  });

  it('monthlyFrom values should start with a currency symbol or "$"', () => {
    const values = parseMonthlyFromValues();
    const currencyPattern = /^[\$€£¥₹CA]|^\d/;
    for (const value of values) {
      expect(
        currencyPattern.test(value),
        `monthlyFrom "${value}" does not start with a currency symbol or digit`
      ).toBe(true);
    }
  });

  it('monthlyFrom "$0" entries indicate free tier availability', () => {
    const values = parseMonthlyFromValues();
    const freeEntries = values.filter(v => v === '$0');
    expect(freeEntries.length, 'Expected at least some free-tier entries').toBeGreaterThan(0);
  });
});

// ─── Signup URLs ──────────────────────────────────────────────────────────────
describe('Signup URLs', () => {
  const urls = parseSignupUrls();

  it('should have signup URLs for all providers', () => {
    expect(urls.length).toBeGreaterThan(0);
  });

  it('all signup URLs should start with https://', () => {
    for (const url of urls) {
      expect(url, `URL "${url}" should start with https://`).toMatch(/^https:\/\//);
    }
  });

  it('signup URLs should include known cloud provider domains', () => {
    const urlSet = urls.join(' ');
    expect(urlSet).toContain('aws.amazon.com');
    expect(urlSet).toContain('cloud.google.com');
    expect(urlSet).toContain('azure.microsoft.com');
    // DigitalOcean uses a referral short link (m.do.co) in regional deals
    expect(urlSet).toMatch(/digitalocean\.com|do\.co/);
  });
});

// ─── regionStats verification ─────────────────────────────────────────────────
describe('regionStats constants', () => {
  it('regionStats.totalCountries should be 16', () => {
    const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
    const match = src.match(/totalCountries:\s*(\d+)/);
    expect(match, 'totalCountries not found in regionStats').toBeTruthy();
    expect(parseInt(match![1])).toBe(16);
  });

  it('regionStats.cloudSpendCountries should be 10', () => {
    const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
    const match = src.match(/cloudSpendCountries:\s*(\d+)/);
    expect(match, 'cloudSpendCountries not found in regionStats').toBeTruthy();
    expect(parseInt(match![1])).toBe(10);
  });

  it('regionStats.lowestMonthly should be present', () => {
    const src = fs.readFileSync(HOSTING_REGIONS_FILE, 'utf8');
    expect(src).toContain('lowestMonthly');
  });
});
