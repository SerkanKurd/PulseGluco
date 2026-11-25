import { IHealthRecordRepository } from '../repositories/IHealthRecordRepository';
import { BloodPressureRecord, BloodGlucoseRecord, GlucoseUnit, MealTag, RecordSource } from '../models/HealthRecord';
import { classifyBloodPressure, classifyBloodGlucose } from '../../core/constants/medical-thresholds';
import { validateBloodPressure, validateGlucose, MeasurementIssue } from '../../core/constants/measurement-limits';

interface CommonSaveParams {
  /** When set, the existing record with this id is updated instead of creating a new one. */
  id?: string;
  timestamp?: string;
  notes?: string;
  imageUri?: string;
  rawOcrText?: string;
  ocrConfidence?: number;
  source?: RecordSource;
}

export interface SaveBpParams extends CommonSaveParams {
  systolic: number;
  diastolic: number;
  pulse?: number;
}

export interface SaveGlucoseParams extends CommonSaveParams {
  glucoseValue: number;
  unit: GlucoseUnit;
  mealTag: MealTag;
}

export class InvalidMeasurementError extends Error {
  constructor(public readonly issues: MeasurementIssue[]) {
    super(`Invalid measurement: ${issues.join(', ')}`);
    this.name = 'InvalidMeasurementError';
  }
}

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class SaveHealthRecordUseCase {
  constructor(private repository: IHealthRecordRepository) {}

  public async saveBloodPressure(params: SaveBpParams): Promise<BloodPressureRecord> {
    const issues = validateBloodPressure(params.systolic, params.diastolic, params.pulse);
    if (issues.length > 0) throw new InvalidMeasurementError(issues);

    const record: BloodPressureRecord = {
      id: params.id || newId('bp'),
      timestamp: params.timestamp || new Date().toISOString(),
      deviceType: 'BLOOD_PRESSURE',
      systolic: Math.round(params.systolic),
      diastolic: Math.round(params.diastolic),
      pulse: params.pulse ? Math.round(params.pulse) : undefined,
      status: classifyBloodPressure(params.systolic, params.diastolic),
      source: params.source || 'MANUAL',
      ocrConfidence: params.ocrConfidence,
      rawOcrText: params.rawOcrText,
      imageUri: params.imageUri,
      notes: params.notes,
    };

    await this.persist(record, Boolean(params.id));
    return record;
  }

  public async saveBloodGlucose(params: SaveGlucoseParams): Promise<BloodGlucoseRecord> {
    const issues = validateGlucose(params.glucoseValue, params.unit);
    if (issues.length > 0) throw new InvalidMeasurementError(issues);

    const record: BloodGlucoseRecord = {
      id: params.id || newId('gluc'),
      timestamp: params.timestamp || new Date().toISOString(),
      deviceType: 'BLOOD_GLUCOSE',
      glucoseValue:
        params.unit === 'mmol/L' ? Number(params.glucoseValue.toFixed(1)) : Math.round(params.glucoseValue),
      unit: params.unit,
      mealTag: params.mealTag,
      status: classifyBloodGlucose(params.glucoseValue, params.unit, params.mealTag),
      source: params.source || 'MANUAL',
      ocrConfidence: params.ocrConfidence,
      rawOcrText: params.rawOcrText,
      imageUri: params.imageUri,
      notes: params.notes,
    };

    await this.persist(record, Boolean(params.id));
    return record;
  }

  private async persist(record: BloodPressureRecord | BloodGlucoseRecord, isUpdate: boolean): Promise<void> {
    if (isUpdate) {
      await this.repository.updateRecord(record);
    } else {
      await this.repository.saveRecord(record);
    }
  }
}
