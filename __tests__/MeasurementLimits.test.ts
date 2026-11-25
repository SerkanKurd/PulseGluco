import { validateBloodPressure, validateGlucose } from '../src/core/constants/measurement-limits';
import { measurementIssueMessage } from '../src/core/i18n/measurementMessages';
import { translations, formatMessage, DEFAULT_LOCALE } from '../src/core/i18n/translations';

describe('Measurement limits', () => {
  it('accepts a normal blood pressure reading with and without pulse', () => {
    expect(validateBloodPressure(122, 78, 70)).toEqual([]);
    expect(validateBloodPressure(122, 78)).toEqual([]);
  });

  it('reports missing values instead of guessing', () => {
    expect(validateBloodPressure(null, null)).toEqual(['SYSTOLIC_MISSING', 'DIASTOLIC_MISSING']);
    expect(validateGlucose(null, 'mg/dL')).toEqual(['GLUCOSE_MISSING']);
    expect(validateGlucose(0, 'mg/dL')).toEqual(['GLUCOSE_MISSING']);
  });

  it('rejects implausible blood pressure values', () => {
    expect(validateBloodPressure(1240, 82)).toContain('SYSTOLIC_OUT_OF_RANGE');
    expect(validateBloodPressure(120, 8)).toContain('DIASTOLIC_OUT_OF_RANGE');
    expect(validateBloodPressure(80, 90)).toContain('SYSTOLIC_NOT_ABOVE_DIASTOLIC');
    expect(validateBloodPressure(120, 80, 400)).toEqual(['PULSE_OUT_OF_RANGE']);
  });

  it('checks glucose ranges per unit', () => {
    expect(validateGlucose(105, 'mg/dL')).toEqual([]);
    expect(validateGlucose(5.8, 'mmol/L')).toEqual([]);
    expect(validateGlucose(5.8, 'mg/dL')).toEqual(['GLUCOSE_OUT_OF_RANGE']);
    expect(validateGlucose(105, 'mmol/L')).toEqual(['GLUCOSE_OUT_OF_RANGE']);
  });

  it('produces localized messages with the limits filled in', () => {
    const en = measurementIssueMessage(translations.en, 'SYSTOLIC_OUT_OF_RANGE');
    expect(en).toBe('Systolic must be between 60 and 260 mmHg.');
    const tr = measurementIssueMessage(translations.tr, 'GLUCOSE_OUT_OF_RANGE', 'mmol/L');
    expect(tr).toContain('1.1');
    expect(tr).toContain('mmol/L');
    expect(tr).not.toMatch(/\{\w+\}/);
  });
});

describe('i18n helpers', () => {
  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('formats placeholders and leaves unknown ones untouched', () => {
    expect(formatMessage('{a} to {b} {c}', { a: 1, b: 2 })).toBe('1 to 2 {c}');
  });
});
