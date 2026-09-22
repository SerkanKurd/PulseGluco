import {
  BloodPressureParser,
  sanitizeSevenSegmentText,
  isPhysiologicallyPlausibleBp,
} from '../src/data/parsers/BloodPressureParser';

describe('BloodPressureParser', () => {
  let parser: BloodPressureParser;

  beforeEach(() => {
    parser = new BloodPressureParser();
  });

  describe('7-Segment Character Normalization', () => {
    it('normalizes common 7-segment OCR misreads like O to 0, I to 1', () => {
      expect(sanitizeSevenSegmentText('O8')).toBe('08');
      expect(sanitizeSevenSegmentText('12O')).toBe('120');
      expect(sanitizeSevenSegmentText('I20')).toBe('120');
      expect(sanitizeSevenSegmentText('l28')).toBe('128');
    });
  });

  describe('Physiological Plausibility Validation', () => {
    it('accepts valid human BP measurements', () => {
      expect(isPhysiologicallyPlausibleBp(120, 80, 72)).toBe(true);
      expect(isPhysiologicallyPlausibleBp(140, 90, 68)).toBe(true);
      expect(isPhysiologicallyPlausibleBp(95, 62, 80)).toBe(true);
    });

    it('rejects impossible values where systolic <= diastolic', () => {
      expect(isPhysiologicallyPlausibleBp(80, 120)).toBe(false);
      expect(isPhysiologicallyPlausibleBp(85, 80)).toBe(false);
    });

    it('rejects extreme non-physiological values', () => {
      expect(isPhysiologicallyPlausibleBp(300, 80)).toBe(false);
      expect(isPhysiologicallyPlausibleBp(120, 20)).toBe(false);
      expect(isPhysiologicallyPlausibleBp(120, 80, 300)).toBe(false);
    });
  });

  describe('Label-Based Parsing', () => {
    it('parses standard Omron monitor display with SYS, DIA, PUL labels', () => {
      const ocrText = `
        OMRON EVOLV
        SYS mmHg
        128
        DIA mmHg
        84
        PULSE /min
        71
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.deviceType).toBe('BLOOD_PRESSURE');
      expect(result?.systolic).toBe(128);
      expect(result?.diastolic).toBe(84);
      expect(result?.pulse).toBe(71);
      expect(result?.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result?.status.shortLabel).toBe('Stage 1');
    });

    it('parses inline label representations (SYS: 135 DIA: 85 PUL: 68)', () => {
      const ocrText = `
        READING
        SYS 135
        DIA 85
        PUL 68
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.systolic).toBe(135);
      expect(result?.diastolic).toBe(85);
      expect(result?.pulse).toBe(68);
    });
  });

  describe('Positional Layout Parsing', () => {
    it('parses vertical 3-number stack even without explicit labels', () => {
      const ocrText = `
        122
        78
        69
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.systolic).toBe(122);
      expect(result?.diastolic).toBe(78);
      expect(result?.pulse).toBe(69);
      expect(result?.status.shortLabel).toBe('Elevated');
    });
  });

  describe('Slash-Separated Format Parsing', () => {
    it('parses slash formatted values like "124/76" or "130/85 - 75"', () => {
      const result = parser.parse('Patient BP: 124/76 - 72');
      expect(result).not.toBeNull();
      expect(result?.systolic).toBe(124);
      expect(result?.diastolic).toBe(76);
      expect(result?.pulse).toBe(72);
      expect(result?.status.shortLabel).toBe('Elevated');
    });
  });

  describe('Turkish Device Label Parsing', () => {
    it('parses Turkish labels like BUYUK, KUCUK, and NABIZ', () => {
      const ocrText = `
        TANSIYON OLCUMU
        BUYUK TANSIYON 130
        KUCUK TANSIYON 85
        NABIZ 74
      `;

      const result = parser.parse(ocrText);
      expect(result).not.toBeNull();
      expect(result?.systolic).toBe(130);
      expect(result?.diastolic).toBe(85);
      expect(result?.pulse).toBe(74);
    });
  });
});
