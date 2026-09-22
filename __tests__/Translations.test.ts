import { translations, SupportedLocale } from '../src/core/i18n/translations';

describe('i18n Translations Parity & Integrity', () => {
  const locales: SupportedLocale[] = ['en', 'tr'];

  it('provides both English and Turkish translation dictionaries', () => {
    expect(translations.en).toBeDefined();
    expect(translations.tr).toBeDefined();
  });

  it('ensures all top-level sections exist in both en and tr', () => {
    const sections = [
      'common',
      'navigation',
      'dashboard',
      'camera',
      'verification',
      'status',
      'analytics',
      'export',
    ] as const;

    for (const locale of locales) {
      for (const section of sections) {
        expect(translations[locale][section]).toBeDefined();
        expect(typeof translations[locale][section]).toBe('object');
      }
    }
  });

  it('ensures exact key parity and non-empty values between en and tr', () => {
    const enSections = Object.keys(translations.en) as (keyof typeof translations.en)[];

    for (const section of enSections) {
      const enKeys = Object.keys(translations.en[section]).sort();
      const trKeys = Object.keys(translations.tr[section]).sort();

      expect(trKeys).toEqual(enKeys);

      for (const key of enKeys) {
        const enVal = (translations.en[section] as any)[key];
        const trVal = (translations.tr[section] as any)[key];

        expect(typeof enVal).toBe('string');
        expect(typeof trVal).toBe('string');
        expect(enVal.trim().length).toBeGreaterThan(0);
        expect(trVal.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
