import { generateMockHealthRecords } from '../src/core/utils/mock-data-generator';
import { isBloodPressureRecord, isBloodGlucoseRecord } from '../src/domain/models/HealthRecord';

describe('MockDataFactory', () => {
  it('generates the specified count of days of realistic health records', () => {
    const records = generateMockHealthRecords(10);
    expect(records.length).toBeGreaterThanOrEqual(20); // Morning BP + morning glucose for each day
  });

  it('generates valid physiological values for blood pressure records', () => {
    const records = generateMockHealthRecords(7);
    const bpRecords = records.filter(isBloodPressureRecord);

    expect(bpRecords.length).toBeGreaterThan(0);
    bpRecords.forEach((bp) => {
      expect(bp.systolic).toBeGreaterThanOrEqual(90);
      expect(bp.systolic).toBeLessThanOrEqual(200);
      expect(bp.diastolic).toBeGreaterThanOrEqual(60);
      expect(bp.diastolic).toBeLessThanOrEqual(120);
      expect(bp.systolic).toBeGreaterThan(bp.diastolic);
      expect(bp.status).toBeDefined();
      expect(bp.status.color).toBeDefined();
    });
  });

  it('generates valid values and tags for blood glucose records', () => {
    const records = generateMockHealthRecords(7);
    const glucoseRecords = records.filter(isBloodGlucoseRecord);

    expect(glucoseRecords.length).toBeGreaterThan(0);
    glucoseRecords.forEach((g) => {
      expect(g.glucoseValue).toBeGreaterThanOrEqual(60);
      expect(g.glucoseValue).toBeLessThanOrEqual(300);
      expect(['mg/dL', 'mmol/L']).toContain(g.unit);
      expect(['FASTING', 'POSTPRANDIAL', 'RANDOM', 'BEFORE_MEAL', 'BEDTIME']).toContain(g.mealTag);
      expect(g.status).toBeDefined();
      expect(g.status.label).toBeDefined();
    });
  });

  it('sorts records in descending chronological order', () => {
    const records = generateMockHealthRecords(5);
    for (let i = 0; i < records.length - 1; i++) {
      const current = new Date(records[i].timestamp).getTime();
      const next = new Date(records[i + 1].timestamp).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});
