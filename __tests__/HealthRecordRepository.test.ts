jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  }),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

import { HealthRecordRepositoryImpl } from '../src/data/repositories/HealthRecordRepositoryImpl';
import { BloodPressureRecord, BloodGlucoseRecord } from '../src/domain/models/HealthRecord';
import { classifyBloodPressure, classifyBloodGlucose } from '../src/core/constants/medical-thresholds';

describe('HealthRecordRepository', () => {
  let repository: HealthRecordRepositoryImpl;

  beforeEach(() => {
    repository = new HealthRecordRepositoryImpl();
  });

  it('saves a Blood Pressure record without recursion and retrieves it', async () => {
    const bpRecord: BloodPressureRecord = {
      id: 'test-bp-1',
      timestamp: new Date().toISOString(),
      deviceType: 'BLOOD_PRESSURE',
      systolic: 125,
      diastolic: 78,
      pulse: 70,
      status: classifyBloodPressure(125, 78),
      source: 'OCR_AUTO',
      ocrConfidence: 0.95,
      notes: 'Test BP note',
    };

    const saved = await repository.saveRecord(bpRecord);
    expect(saved.id).toBe('test-bp-1');

    const retrieved = await repository.getRecordById('test-bp-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test-bp-1');
    if (retrieved && retrieved.deviceType === 'BLOOD_PRESSURE') {
      expect(retrieved.systolic).toBe(125);
      expect(retrieved.diastolic).toBe(78);
    }
  });

  it('saves a Blood Glucose record and retrieves it', async () => {
    const glucoseRecord: BloodGlucoseRecord = {
      id: 'test-gluc-1',
      timestamp: new Date().toISOString(),
      deviceType: 'BLOOD_GLUCOSE',
      glucoseValue: 105,
      unit: 'mg/dL',
      mealTag: 'FASTING',
      status: classifyBloodGlucose(105, 'mg/dL', 'FASTING'),
      source: 'MANUAL',
    };

    const saved = await repository.saveRecord(glucoseRecord);
    expect(saved.id).toBe('test-gluc-1');

    const retrieved = await repository.getRecordById('test-gluc-1');
    expect(retrieved).not.toBeNull();
    if (retrieved && retrieved.deviceType === 'BLOOD_GLUCOSE') {
      expect(retrieved.glucoseValue).toBe(105);
      expect(retrieved.mealTag).toBe('FASTING');
    }
  });

  it('deletes an existing record properly', async () => {
    const bpRecord: BloodPressureRecord = {
      id: 'test-bp-delete',
      timestamp: new Date().toISOString(),
      deviceType: 'BLOOD_PRESSURE',
      systolic: 130,
      diastolic: 85,
      status: classifyBloodPressure(130, 85),
      source: 'MANUAL',
    };

    await repository.saveRecord(bpRecord);
    const exists = await repository.getRecordById('test-bp-delete');
    expect(exists).not.toBeNull();

    const deleted = await repository.deleteRecord('test-bp-delete');
    expect(deleted).toBe(true);

    const afterDelete = await repository.getRecordById('test-bp-delete');
    expect(afterDelete).toBeNull();
  });
});
