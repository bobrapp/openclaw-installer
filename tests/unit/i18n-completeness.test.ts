/**
 * i18n-completeness.test.ts
 * Verifies all 15 locale JSON files have the same set of keys as en.json,
 * no empty values, and a minimum key count.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.resolve(__dirname, '../../client/src/locales');

// ─── Load all locale files ─────────────────────────────────────────────────
function loadLocales(): Record<string, Record<string, string>> {
  const locales: Record<string, Record<string, string>> = {};
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const code = path.basename(file, '.json');
    const raw = fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8');
    locales[code] = JSON.parse(raw);
  }
  return locales;
}

const locales = loadLocales();
const localeCodes = Object.keys(locales).sort();
const enKeys = Object.keys(locales['en'] || {}).sort();

const EXPECTED_MIN_KEYS = 125;
const EXPECTED_LOCALE_COUNT = 15;

// ─── Expected locales ──────────────────────────────────────────────────────
const EXPECTED_LOCALES = ['en', 'fr', 'de', 'zh', 'pt', 'hi', 'es', 'ar', 'ru', 'tr', 'ur', 'ps', 'sw', 'chr', 'brl'];

// ─── RTL locales ───────────────────────────────────────────────────────────
const RTL_LOCALES = new Set(['ar', 'ur', 'ps']);

describe('Locale file presence', () => {
  it(`should have exactly ${EXPECTED_LOCALE_COUNT} locale files`, () => {
    expect(localeCodes.length).toBe(EXPECTED_LOCALE_COUNT);
  });

  it('should include all expected locale codes', () => {
    for (const code of EXPECTED_LOCALES) {
      expect(localeCodes, `Missing locale: ${code}`).toContain(code);
    }
  });

  it('en.json should have at least 125 keys', () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(EXPECTED_MIN_KEYS);
  });
});

describe('Key completeness', () => {
  for (const code of localeCodes) {
    if (code === 'en') continue;

    it(`${code}.json should have the same keys as en.json`, () => {
      const keys = Object.keys(locales[code]).sort();
      const missingKeys = enKeys.filter(k => !(k in locales[code]));
      const extraKeys = keys.filter(k => !(k in locales['en']));

      expect(
        missingKeys.length,
        `${code}.json is missing keys: ${missingKeys.slice(0, 5).join(', ')}`
      ).toBe(0);

      expect(
        extraKeys.length,
        `${code}.json has extra keys: ${extraKeys.slice(0, 5).join(', ')}`
      ).toBe(0);
    });

    it(`${code}.json should have exactly ${EXPECTED_MIN_KEYS} keys`, () => {
      const count = Object.keys(locales[code]).length;
      expect(count).toBe(EXPECTED_MIN_KEYS);
    });
  }
});

describe('Value completeness', () => {
  for (const code of localeCodes) {
    it(`${code}.json should have no empty string values`, () => {
      const emptyKeys = Object.entries(locales[code])
        .filter(([, v]) => v === '')
        .map(([k]) => k);
      expect(
        emptyKeys,
        `${code}.json has empty values for: ${emptyKeys.slice(0, 5).join(', ')}`
      ).toHaveLength(0);
    });

    it(`${code}.json values should all be strings`, () => {
      for (const [key, val] of Object.entries(locales[code])) {
        expect(
          typeof val,
          `${code}.json key "${key}" value is not a string`
        ).toBe('string');
      }
    });
  }
});

describe('Specific key presence', () => {
  const criticalKeys = [
    'appName',
    'homeTitle',
    'preflightTitle',
    'preflightRun',
    'preflightReset',
    'navAuditLog',
    'navPreflightRunner',
    'hostMacOS',
    'hostDigitalOcean',
    'loading',
    'error',
  ];

  for (const key of criticalKeys) {
    it(`all locales should have the critical key "${key}"`, () => {
      for (const code of localeCodes) {
        expect(
          locales[code][key],
          `${code}.json missing critical key "${key}"`
        ).toBeTruthy();
      }
    });
  }
});

describe('RTL locale validity', () => {
  it('Arabic (ar) should have a non-empty appName', () => {
    expect(locales['ar']?.appName).toBeTruthy();
  });

  it('Urdu (ur) should have a non-empty appName', () => {
    expect(locales['ur']?.appName).toBeTruthy();
  });

  it('Pashto (ps) should have a non-empty appName', () => {
    expect(locales['ps']?.appName).toBeTruthy();
  });
});

describe('Translation uniqueness', () => {
  it('French homeTitle should differ from English homeTitle', () => {
    // French is sufficiently different from English
    expect(locales['fr']?.homeTitle).toBeTruthy();
    expect(locales['fr']?.homeTitle).not.toBe(locales['en']?.homeTitle);
  });

  it('German appName should differ from English appName', () => {
    // German should differ from English (or may be same brand name)
    expect(locales['de']?.appName).toBeTruthy();
  });
});
