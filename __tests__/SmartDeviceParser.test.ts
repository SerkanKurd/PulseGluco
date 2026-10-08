import { SmartDeviceParser } from '../src/data/parsers/SmartDeviceParser';

describe('SmartDeviceParser', () => {
  let parser: SmartDeviceParser;

  beforeEach(() => {
    parser = new SmartDeviceParser();
  });

  describe('Device Type Auto-Detection', () => {
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

    it('detects Pulse Oximeters from SpO2 and PR bpm keywords', () => {
      const text = `
        PULSE OXIMETER
        %SpO2 98
        PR bpm 72
      `;
      expect(parser.detectDeviceType(text)).toBe('PULSE');
    });

    it('detects Pulse from standalone heart rate monitor keywords', () => {
      const text = `
        HEART RATE
        68 BPM
      `;
      expect(parser.detectDeviceType(text)).toBe('PULSE');
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

    it('parses pulse oximeter correctly in auto mode', () => {
      const text = `
        %SpO2 99
        PR bpm 74
      `;
      const result = parser.parse(text);
      expect(result.result).not.toBeNull();
      expect(result.detectedType).toBe('PULSE');
      expect((result.result as any).pulse).toBe(74);
    });

    it('respects forced scan mode even with ambiguous input', () => {
      const text = '110';
      const glucoseResult = parser.parse(text, undefined, { forcedDeviceType: 'BLOOD_GLUCOSE' });
      expect(glucoseResult.detectedType).toBe('BLOOD_GLUCOSE');

      const pulseResult = parser.parse(text, undefined, { forcedDeviceType: 'PULSE' });
      expect(pulseResult.detectedType).toBe('PULSE');
    });
  });
});
