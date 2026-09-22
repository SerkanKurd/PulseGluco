import { BloodGlucoseParser } from '../src/data/parsers/BloodGlucoseParser';

describe('BloodGlucoseParser', () => {
  let parser: BloodGlucoseParser;

  beforeEach(() => {
    parser = new BloodGlucoseParser();
  });

  describe('mg/dL Integer Extraction', () => {
    it('parses standard mg/dL display with fasting tag', () => {
      const ocrText = `
        Accu-Chek Guide
        98
        mg/dL
        FASTING
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.deviceType).toBe('BLOOD_GLUCOSE');
      expect(result?.glucoseValue).toBe(98);
      expect(result?.unit).toBe('mg/dL');
      expect(result?.mealTag).toBe('FASTING');
      expect(result?.status.shortLabel).toBe('Normal');
    });

    it('parses postprandial glucose reading in mg/dL', () => {
      const ocrText = `
        OneTouch Verio
        155
        mg/dL
        After Meal
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.glucoseValue).toBe(155);
      expect(result?.unit).toBe('mg/dL');
      expect(result?.mealTag).toBe('POSTPRANDIAL');
      expect(result?.status.shortLabel).toBe('Impaired');
    });
  });

  describe('mmol/L Decimal Extraction', () => {
    it('parses decimal values with dot (e.g. 5.4 mmol/L)', () => {
      const ocrText = `
        CONTOUR PLUS
        5.4
        mmol/L
        Pre-meal
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.glucoseValue).toBe(5.4);
      expect(result?.unit).toBe('mmol/L');
      expect(result?.mealTag).toBe('FASTING');
      expect(result?.status.shortLabel).toBe('Normal');
    });

    it('parses decimal values with comma separator (e.g. 7,2 mmol/L)', () => {
      const ocrText = `
        GlucoMen
        7,2
        mmol/L
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.glucoseValue).toBe(7.2);
      expect(result?.unit).toBe('mmol/L');
    });
  });

  describe('Meal Tag Detection', () => {
    it('detects FASTING tags accurately', () => {
      expect(parser.detectMealTag('Fasting blood sugar')).toBe('FASTING');
      expect(parser.detectMealTag('Before Breakfast')).toBe('FASTING');
      expect(parser.detectMealTag('pre meal')).toBe('FASTING');
    });

    it('detects POSTPRANDIAL tags accurately', () => {
      expect(parser.detectMealTag('Post-meal check')).toBe('POSTPRANDIAL');
      expect(parser.detectMealTag('After Food 2h')).toBe('POSTPRANDIAL');
      expect(parser.detectMealTag('postprandial test')).toBe('POSTPRANDIAL');
    });

    it('defaults to RANDOM when no meal tags are present', () => {
      expect(parser.detectMealTag('105 mg/dL')).toBe('RANDOM');
    });

    it('detects Turkish tags (AÇLIK, TOKLUK, GECE)', () => {
      expect(parser.detectMealTag('Açlık kan şekeri')).toBe('FASTING');
      expect(parser.detectMealTag('Yemek öncesi')).toBe('FASTING');
      expect(parser.detectMealTag('Tokluk şekeri 2. saat')).toBe('POSTPRANDIAL');
      expect(parser.detectMealTag('Yatmadan önce')).toBe('BEDTIME');
    });
  });

  describe('Turkish Glucose Display Parsing', () => {
    it('parses Turkish glucose readings with aclik tag and seker keyword', () => {
      const ocrText = `
        KAN SEKERI
        110
        mg/dL
        ACLIK
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.glucoseValue).toBe(110);
      expect(result?.mealTag).toBe('FASTING');
      expect(result?.confidence).toBeGreaterThanOrEqual(0.9);
    });
  });
});
