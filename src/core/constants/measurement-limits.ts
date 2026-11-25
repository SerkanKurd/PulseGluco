import { GlucoseUnit } from '../../domain/models/HealthRecord';

/**
 * Plausible ranges for values that home devices can display. Anything outside
 * these is almost certainly a misread or a typo, so the user is asked to check it.
 */
export const MEASUREMENT_LIMITS = {
  systolic: { min: 60, max: 260 },
  diastolic: { min: 30, max: 160 },
  pulse: { min: 30, max: 220 },
  glucose: {
    'mg/dL': { min: 20, max: 600 },
    'mmol/L': { min: 1.1, max: 33.3 },
  },
} as const;

export type MeasurementIssue =
  | 'SYSTOLIC_MISSING'
  | 'SYSTOLIC_OUT_OF_RANGE'
  | 'DIASTOLIC_MISSING'
  | 'DIASTOLIC_OUT_OF_RANGE'
  | 'SYSTOLIC_NOT_ABOVE_DIASTOLIC'
  | 'PULSE_OUT_OF_RANGE'
  | 'GLUCOSE_MISSING'
  | 'GLUCOSE_OUT_OF_RANGE';

const inRange = (value: number, range: { min: number; max: number }) =>
  value >= range.min && value <= range.max;

const isPresent = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export function validateBloodPressure(
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
  pulse?: number | null
): MeasurementIssue[] {
  const issues: MeasurementIssue[] = [];

  if (!isPresent(systolic)) issues.push('SYSTOLIC_MISSING');
  else if (!inRange(systolic, MEASUREMENT_LIMITS.systolic)) issues.push('SYSTOLIC_OUT_OF_RANGE');

  if (!isPresent(diastolic)) issues.push('DIASTOLIC_MISSING');
  else if (!inRange(diastolic, MEASUREMENT_LIMITS.diastolic)) issues.push('DIASTOLIC_OUT_OF_RANGE');

  if (isPresent(systolic) && isPresent(diastolic) && systolic <= diastolic) {
    issues.push('SYSTOLIC_NOT_ABOVE_DIASTOLIC');
  }

  // Pulse is optional, but if given it must be plausible
  if (isPresent(pulse) && !inRange(pulse, MEASUREMENT_LIMITS.pulse)) {
    issues.push('PULSE_OUT_OF_RANGE');
  }

  return issues;
}

export function validateGlucose(value: number | null | undefined, unit: GlucoseUnit): MeasurementIssue[] {
  if (!isPresent(value)) return ['GLUCOSE_MISSING'];
  if (!inRange(value, MEASUREMENT_LIMITS.glucose[unit])) return ['GLUCOSE_OUT_OF_RANGE'];
  return [];
}
