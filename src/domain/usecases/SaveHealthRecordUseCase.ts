import { IHealthRecordRepository } from '../repositories/IHealthRecordRepository';
import { HealthRecord, BloodPressureRecord, BloodGlucoseRecord, GlucoseUnit, MealTag } from '../models/HealthRecord';
import { classifyBloodPressure, classifyBloodGlucose } from '../../core/constants/medical-thresholds';

export interface SaveBpParams {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp?: string;
  notes?: string;
  imageUri?: string;
  rawOcrText?: string;
  ocrConfidence?: number;
  source?: 'OCR_AUTO' | 'OCR_FALLBACK' | 'MANUAL';
}

export interface SaveGlucoseParams {
  glucoseValue: number;
  unit: GlucoseUnit;
  mealTag: MealTag;
  timestamp?: string;
  notes?: string;
  imageUri?: string;
  rawOcrText?: string;
  ocrConfidence?: number;
  source?: 'OCR_AUTO' | 'OCR_FALLBACK' | 'MANUAL';
}

export class SaveHealthRecordUseCase {
  constructor(private repository: IHealthRecordRepository) {}

  public async saveBloodPressure(params: SaveBpParams): Promise<BloodPressureRecord> {
    const status = classifyBloodPressure(params.systolic, params.diastolic);
    const record: BloodPressureRecord = {
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: params.timestamp || new Date().toISOString(),
      deviceType: 'BLOOD_PRESSURE',
      systolic: Math.round(params.systolic),
      diastolic: Math.round(params.diastolic),
      pulse: params.pulse ? Math.round(params.pulse) : undefined,
      status,
      source: params.source || 'MANUAL',
      ocrConfidence: params.ocrConfidence,
      rawOcrText: params.rawOcrText,
      imageUri: params.imageUri,
      notes: params.notes,
    };

    await this.repository.saveRecord(record);
    return record;
  }

  public async saveBloodGlucose(params: SaveGlucoseParams): Promise<BloodGlucoseRecord> {
    const status = classifyBloodGlucose(params.glucoseValue, params.unit, params.mealTag);
    const record: BloodGlucoseRecord = {
      id: `gluc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: params.timestamp || new Date().toISOString(),
      deviceType: 'BLOOD_GLUCOSE',
      glucoseValue: params.unit === 'mmol/L' ? Number(params.glucoseValue.toFixed(1)) : Math.round(params.glucoseValue),
      unit: params.unit,
      mealTag: params.mealTag,
      status,
      source: params.source || 'MANUAL',
      ocrConfidence: params.ocrConfidence,
      rawOcrText: params.rawOcrText,
      imageUri: params.imageUri,
      notes: params.notes,
    };

    await this.repository.saveRecord(record);
    return record;
  }
}
