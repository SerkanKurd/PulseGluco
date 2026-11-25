import { GlucoseUnit } from '../../domain/models/HealthRecord';
import { MEASUREMENT_LIMITS, MeasurementIssue } from '../constants/measurement-limits';
import { Translations, formatMessage } from './translations';

/** Turns a validation issue into a localized, user-facing sentence. */
export function measurementIssueMessage(t: Translations, issue: MeasurementIssue, unit: GlucoseUnit = 'mg/dL'): string {
  const v = t.verification;
  switch (issue) {
    case 'SYSTOLIC_MISSING':
      return v.systolicMissing;
    case 'SYSTOLIC_OUT_OF_RANGE':
      return formatMessage(v.systolicOutOfRange, MEASUREMENT_LIMITS.systolic);
    case 'DIASTOLIC_MISSING':
      return v.diastolicMissing;
    case 'DIASTOLIC_OUT_OF_RANGE':
      return formatMessage(v.diastolicOutOfRange, MEASUREMENT_LIMITS.diastolic);
    case 'SYSTOLIC_NOT_ABOVE_DIASTOLIC':
      return v.systolicNotAboveDiastolic;
    case 'PULSE_OUT_OF_RANGE':
      return formatMessage(v.pulseOutOfRange, MEASUREMENT_LIMITS.pulse);
    case 'GLUCOSE_MISSING':
      return v.glucoseMissing;
    case 'GLUCOSE_OUT_OF_RANGE':
      return formatMessage(v.glucoseOutOfRange, { ...MEASUREMENT_LIMITS.glucose[unit], unit });
  }
}
