import { HealthRecord, BloodPressureRecord, BloodGlucoseRecord, DeviceType } from '../models/HealthRecord';

export interface RecordFilterOptions {
  deviceType?: DeviceType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsSummary {
  totalReadings: number;
  bpSummary?: {
    count: number;
    avgSystolic: number;
    avgDiastolic: number;
    minSystolic: number;
    maxSystolic: number;
    minDiastolic: number;
    maxDiastolic: number;
    avgPulse?: number;
    normalCount: number;
    elevatedCount: number;
    stage1Count: number;
    stage2Count: number;
    crisisCount: number;
  };
  glucoseSummary?: {
    count: number;
    avgGlucoseMgDl: number;
    minGlucoseMgDl: number;
    maxGlucoseMgDl: number;
    fastingCount: number;
    postprandialCount: number;
    normalCount: number;
    prediabetesCount: number;
    diabetesCount: number;
  };
}

export interface IHealthRecordRepository {
  saveRecord(record: HealthRecord): Promise<HealthRecord>;
  getRecordById(id: string): Promise<HealthRecord | null>;
  getAllRecords(options?: RecordFilterOptions): Promise<HealthRecord[]>;
  getBloodPressureRecords(options?: RecordFilterOptions): Promise<BloodPressureRecord[]>;
  getBloodGlucoseRecords(options?: RecordFilterOptions): Promise<BloodGlucoseRecord[]>;
  deleteRecord(id: string): Promise<boolean>;
  updateRecord(record: HealthRecord): Promise<HealthRecord>;
  getAnalyticsSummary(days: number): Promise<AnalyticsSummary>;
  clearAllRecords(): Promise<void>;
  seedDemoData(): Promise<void>;
}
