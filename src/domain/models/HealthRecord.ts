import { StatusCategory } from '../../core/constants/medical-thresholds';

export type DeviceType = 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'PULSE';

export type GlucoseUnit = 'mg/dL' | 'mmol/L';

export type MealTag = 'FASTING' | 'BEFORE_MEAL' | 'POSTPRANDIAL' | 'RANDOM' | 'BEDTIME';

export interface BaseRecord {
  id: string;
  timestamp: string; // ISO 8601 string
  deviceType: DeviceType;
  rawOcrText?: string;
  imageUri?: string;
  notes?: string;
  isSynced?: boolean;
  ocrConfidence?: number;
  source: 'OCR_AUTO' | 'OCR_FALLBACK' | 'MANUAL';
}

export interface BloodPressureRecord extends BaseRecord {
  deviceType: 'BLOOD_PRESSURE';
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse?: number; // bpm
  status: StatusCategory;
}

export interface BloodGlucoseRecord extends BaseRecord {
  deviceType: 'BLOOD_GLUCOSE';
  glucoseValue: number;
  unit: GlucoseUnit;
  mealTag: MealTag;
  status: StatusCategory;
}

export interface PulseRecord extends BaseRecord {
  deviceType: 'PULSE';
  pulse: number; // bpm
  spo2?: number; // % (if available from pulse oximeter)
  status: StatusCategory;
}

export type HealthRecord = BloodPressureRecord | BloodGlucoseRecord | PulseRecord;

export function isBloodPressureRecord(record: HealthRecord): record is BloodPressureRecord {
  return record.deviceType === 'BLOOD_PRESSURE';
}

export function isBloodGlucoseRecord(record: HealthRecord): record is BloodGlucoseRecord {
  return record.deviceType === 'BLOOD_GLUCOSE';
}

export function isPulseRecord(record: HealthRecord): record is PulseRecord {
  return record.deviceType === 'PULSE';
}
