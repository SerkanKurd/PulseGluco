import { SmartDeviceParser } from '../src/data/parsers/SmartDeviceParser';

describe('SmartDeviceParser', () => {
  let parser: SmartDeviceParser;

  beforeEach(() => {
    parser = new SmartDeviceParser();
  });

  describe('Device Type Auto-Detection', () => {
    it('classifies oximeter-style text as blood pressure or glucose only', () => {
      const detected = parser.detectDeviceType('%SpO2 98\nPR bpm 72');
      expect(['BLOOD_PRESSURE', 'BLOOD_GLUCOSE']).toContain(detected);
    });

    it('detects Blood Pressure monitors from Omron / SYS / DIA / mmHg displays', () => {
      const text = `
        OMRON
        SYS mmHg 128
        DIA mmHg 84
        PULSE 70
      `;
      expect(parser.detectDeviceType(text)).toBe('BLOOD_PRESSURE');
    });

    it('detects Blood Glucose meters with units, brands, or Turkish keywords', () => {
      const text1 = 'Accu-Chek Guide 105 mg/dL';
      expect(parser.detectDeviceType(text1)).toBe('BLOOD_GLUCOSE');

      const text2 = 'Contour Plus 5.6 mmol/L';
      expect(parser.detectDeviceType(text2)).toBe('BLOOD_GLUCOSE');

      const text3 = 'KAN SEKERI 110 mgdl ACLIK';
      expect(parser.detectDeviceType(text3)).toBe('BLOOD_GLUCOSE');
    });

    it('does not falsely classify glucometers with timestamps as blood pressure', () => {
      const text = `
        Accu-Chek
        10:45 AM
        108 mg/dL
      `;
      expect(parser.detectDeviceType(text)).toBe('BLOOD_GLUCOSE');
    });

  });

  describe('Smart Parse Coordination', () => {
    it('parses blood glucose correctly in auto mode', () => {
      const text = `
        Accu-Chek Guide
        104
        mg/dL
        FASTING
      `;
      const result = parser.parse(text);
      expect(result.result).not.toBeNull();
      expect(result.detectedType).toBe('BLOOD_GLUCOSE');
      expect((result.result as any).glucoseValue).toBe(104);
    });

    it('respects forced scan mode even with ambiguous input', () => {
      const text = '110';
      const glucoseResult = parser.parse(text, undefined, { forcedDeviceType: 'BLOOD_GLUCOSE' });
      expect(glucoseResult.detectedType).toBe('BLOOD_GLUCOSE');

      const bpResult = parser.parse(text, undefined, { forcedDeviceType: 'BLOOD_PRESSURE' });
      expect(bpResult.detectedType).toBe('BLOOD_PRESSURE');
    });

    it('asks for user input when nothing could be read', () => {
      const result = parser.parse('');
      expect(result.result).toBeNull();
      expect(result.needsUserInput).toBe(true);
    });
  });
});
