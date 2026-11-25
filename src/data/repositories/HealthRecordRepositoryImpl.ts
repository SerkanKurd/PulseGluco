import {
  IHealthRecordRepository,
  RecordFilterOptions,
  AnalyticsSummary,
} from '../../domain/repositories/IHealthRecordRepository';
import {
  HealthRecord,
  BloodPressureRecord,
  BloodGlucoseRecord,
  isBloodPressureRecord,
  isBloodGlucoseRecord,
} from '../../domain/models/HealthRecord';
import { appDatabase } from '../datasources/local/Database';
import { generateMockHealthRecords } from '../../core/utils/mock-data-generator';
import { classifyBloodPressure, classifyBloodGlucose } from '../../core/constants/medical-thresholds';

export class HealthRecordRepositoryImpl implements IHealthRecordRepository {
  // In-memory cache for instant UI response and offline resilience
  private memoryRecords: Map<string, HealthRecord> = new Map();
  private loading: Promise<void> | null = null;

  /**
   * Loads stored records once. The logbook starts empty: demo data is never
   * written to the real database (see `seedDemoData`, development only).
   */
  private ensureInitialized(): Promise<void> {
    if (!this.loading) {
      this.loading = this.loadFromDatabase();
    }
    return this.loading;
  }

  private async loadFromDatabase(): Promise<void> {
    try {
      const db = await appDatabase.getDatabase();
      if (!db) return;

      const rows = await db.getAllAsync<any>('SELECT * FROM health_records ORDER BY timestamp DESC');
      for (const row of rows ?? []) {
        const record = this.mapRowToRecord(row);
        // Records saved while loading are newer than the stored copy
        if (record && !this.memoryRecords.has(record.id)) {
          this.memoryRecords.set(record.id, record);
        }
      }
    } catch (e) {
      console.warn('Repository failed to query SQLite, keeping memory state:', e);
    }
  }

  private async insertRecordDirectly(db: any, record: HealthRecord): Promise<void> {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO health_records (
          id, timestamp, device_type, systolic, diastolic, pulse,
          glucose_value, glucose_unit, meal_tag, status_key, source,
          ocr_confidence, raw_ocr_text, image_uri, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.timestamp,
          record.deviceType,
          isBloodPressureRecord(record) ? record.systolic : null,
          isBloodPressureRecord(record) ? record.diastolic : null,
          isBloodPressureRecord(record) ? record.pulse ?? null : null,
          isBloodGlucoseRecord(record) ? record.glucoseValue : null,
          isBloodGlucoseRecord(record) ? record.unit : null,
          isBloodGlucoseRecord(record) ? record.mealTag : null,
          record.status.key,
          record.source,
          record.ocrConfidence ?? null,
          record.rawOcrText ?? null,
          record.imageUri ?? null,
          record.notes ?? null,
        ]
      );
    } catch (e) {
      console.warn('Direct SQLite insert failed:', e);
    }
  }

  public async saveRecord(record: HealthRecord): Promise<HealthRecord> {
    // Immediately update memory cache so user sees saved record with zero latency
    this.memoryRecords.set(record.id, record);

    try {
      await this.ensureInitialized();
      const db = await appDatabase.getDatabase();
      if (db) {
        await this.insertRecordDirectly(db, record);
      }
    } catch (e) {
      console.warn('Could not persist record to SQLite, kept in memory cache:', e);
    }

    return record;
  }

  public async getRecordById(id: string): Promise<HealthRecord | null> {
    await this.ensureInitialized();
    return this.memoryRecords.get(id) || null;
  }

  public async getAllRecords(options?: RecordFilterOptions): Promise<HealthRecord[]> {
    await this.ensureInitialized();
    let list = Array.from(this.memoryRecords.values());

    if (options?.deviceType) {
      list = list.filter((r) => r.deviceType === options.deviceType);
    }
    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      list = list.filter((r) => new Date(r.timestamp).getTime() >= start);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate).getTime();
      list = list.filter((r) => new Date(r.timestamp).getTime() <= end);
    }

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options?.limit) {
      const offset = options.offset || 0;
      list = list.slice(offset, offset + options.limit);
    }

    return list;
  }

  public async getBloodPressureRecords(options?: RecordFilterOptions): Promise<BloodPressureRecord[]> {
    const records = await this.getAllRecords({ ...options, deviceType: 'BLOOD_PRESSURE' });
    return records.filter(isBloodPressureRecord);
  }

  public async getBloodGlucoseRecords(options?: RecordFilterOptions): Promise<BloodGlucoseRecord[]> {
    const records = await this.getAllRecords({ ...options, deviceType: 'BLOOD_GLUCOSE' });
    return records.filter(isBloodGlucoseRecord);
  }

  public async deleteRecord(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const deleted = this.memoryRecords.delete(id);

    try {
      const db = await appDatabase.getDatabase();
      if (db) {
        await db.runAsync('DELETE FROM health_records WHERE id = ?', [id]);
      }
    } catch (e) {
      console.warn('Could not delete record from SQLite:', e);
    }

    return deleted;
  }

  public async updateRecord(record: HealthRecord): Promise<HealthRecord> {
    await this.ensureInitialized();
    if (!this.memoryRecords.has(record.id)) {
      throw new Error(`Record ${record.id} not found`);
    }
    return this.saveRecord(record);
  }

  public async getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
    await this.ensureInitialized();
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const recentRecords = await this.getAllRecords({ startDate: cutoffDate });

    const bpList = recentRecords.filter(isBloodPressureRecord);
    const glucoseList = recentRecords.filter(isBloodGlucoseRecord);

    let bpSummary: AnalyticsSummary['bpSummary'] | undefined = undefined;
    if (bpList.length > 0) {
      const sysVals = bpList.map((r) => r.systolic);
      const diaVals = bpList.map((r) => r.diastolic);
      const pulseVals = bpList.map((r) => r.pulse).filter((p): p is number => typeof p === 'number');

      const sumSys = sysVals.reduce((a, b) => a + b, 0);
      const sumDia = diaVals.reduce((a, b) => a + b, 0);
      const sumPulse = pulseVals.reduce((a, b) => a + b, 0);

      bpSummary = {
        count: bpList.length,
        avgSystolic: Math.round(sumSys / bpList.length),
        avgDiastolic: Math.round(sumDia / bpList.length),
        minSystolic: Math.min(...sysVals),
        maxSystolic: Math.max(...sysVals),
        minDiastolic: Math.min(...diaVals),
        maxDiastolic: Math.max(...diaVals),
        avgPulse: pulseVals.length > 0 ? Math.round(sumPulse / pulseVals.length) : undefined,
        normalCount: bpList.filter((r) => r.status.key === 'NORMAL' || r.status.key === 'OPTIMAL').length,
        elevatedCount: bpList.filter((r) => r.status.key === 'ELEVATED').length,
        stage1Count: bpList.filter((r) => r.status.key === 'STAGE_1').length,
        stage2Count: bpList.filter((r) => r.status.key === 'STAGE_2').length,
        crisisCount: bpList.filter((r) => r.status.key === 'CRISIS').length,
      };
    }

    let glucoseSummary: AnalyticsSummary['glucoseSummary'] | undefined = undefined;
    if (glucoseList.length > 0) {
      const mgVals = glucoseList.map((r) =>
        r.unit === 'mmol/L' ? r.glucoseValue * 18.0182 : r.glucoseValue
      );
      const sumMg = mgVals.reduce((a, b) => a + b, 0);

      glucoseSummary = {
        count: glucoseList.length,
        avgGlucoseMgDl: Math.round(sumMg / glucoseList.length),
        minGlucoseMgDl: Math.round(Math.min(...mgVals)),
        maxGlucoseMgDl: Math.round(Math.max(...mgVals)),
        fastingCount: glucoseList.filter((r) => r.mealTag === 'FASTING').length,
        postprandialCount: glucoseList.filter((r) => r.mealTag === 'POSTPRANDIAL').length,
        normalCount: glucoseList.filter((r) => r.status.key === 'NORMAL').length,
        prediabetesCount: glucoseList.filter((r) => r.status.key === 'PREDIABETES').length,
        diabetesCount: glucoseList.filter((r) => r.status.key === 'DIABETES').length,
      };
    }

    return {
      totalReadings: recentRecords.length,
      bpSummary,
      glucoseSummary,
    };
  }

  public async clearAllRecords(): Promise<void> {
    this.memoryRecords.clear();
    try {
      const db = await appDatabase.getDatabase();
      if (db) {
        await db.runAsync('DELETE FROM health_records');
      }
    } catch (e) {
      console.warn('Could not clear SQLite:', e);
    }
  }

  /** Development only: replaces the logbook with generated demo records. */
  public async seedDemoData(): Promise<void> {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return;
    const demo = generateMockHealthRecords(14);
    this.memoryRecords.clear();
    const db = await appDatabase.getDatabase();
    for (const r of demo) {
      this.memoryRecords.set(r.id, r);
      if (db) {
        await this.insertRecordDirectly(db, r);
      }
    }
  }

  private mapRowToRecord(row: any): HealthRecord | null {
    if (row.device_type === 'BLOOD_PRESSURE') {
      const record: BloodPressureRecord = {
        id: row.id,
        timestamp: row.timestamp,
        deviceType: 'BLOOD_PRESSURE',
        systolic: row.systolic,
        diastolic: row.diastolic,
        pulse: row.pulse || undefined,
        status: classifyBloodPressure(row.systolic, row.diastolic),
        source: row.source === 'MANUAL' ? 'MANUAL' : 'OCR_AUTO',
        ocrConfidence: row.ocr_confidence,
        rawOcrText: row.raw_ocr_text,
        imageUri: row.image_uri,
        notes: row.notes,
        isSynced: Boolean(row.is_synced),
      };
      return record;
    } else if (row.device_type === 'BLOOD_GLUCOSE') {
      const unit = row.glucose_unit || 'mg/dL';
      const tag = row.meal_tag || 'FASTING';
      const record: BloodGlucoseRecord = {
        id: row.id,
        timestamp: row.timestamp,
        deviceType: 'BLOOD_GLUCOSE',
        glucoseValue: row.glucose_value,
        unit,
        mealTag: tag,
        status: classifyBloodGlucose(row.glucose_value, unit, tag),
        source: row.source === 'MANUAL' ? 'MANUAL' : 'OCR_AUTO',
        ocrConfidence: row.ocr_confidence,
        rawOcrText: row.raw_ocr_text,
        imageUri: row.image_uri,
        notes: row.notes,
        isSynced: Boolean(row.is_synced),
      };
      return record;
    }
    // Unsupported device type (e.g. legacy pulse readings)
    return null;
  }
}

export const healthRecordRepository = new HealthRecordRepositoryImpl();
