import { HealthRecord, BloodPressureRecord, BloodGlucoseRecord } from '../../domain/models/HealthRecord';
import { classifyBloodPressure, classifyBloodGlucose } from '../constants/medical-thresholds';

/**
 * Generates realistic longitudinal medical health records for testing and demo display
 */
export function generateMockHealthRecords(daysCount = 14): HealthRecord[] {
  const records: HealthRecord[] = [];
  const now = new Date();

  // Baseline user profile: Stage 1 / Elevated tending to normal with medication
  const bpPatterns = [
    { sys: 136, dia: 86, pulse: 74 },
    { sys: 132, dia: 84, pulse: 71 },
    { sys: 128, dia: 82, pulse: 69 },
    { sys: 122, dia: 79, pulse: 72 },
    { sys: 120, dia: 78, pulse: 68 },
    { sys: 118, dia: 76, pulse: 67 },
    { sys: 124, dia: 80, pulse: 70 },
    { sys: 130, dia: 85, pulse: 75 },
    { sys: 121, dia: 77, pulse: 66 },
    { sys: 119, dia: 78, pulse: 68 },
  ];

  const glucosePatterns = [
    { val: 98, tag: 'FASTING' as const },
    { val: 142, tag: 'POSTPRANDIAL' as const },
    { val: 94, tag: 'FASTING' as const },
    { val: 136, tag: 'POSTPRANDIAL' as const },
    { val: 104, tag: 'FASTING' as const },
    { val: 148, tag: 'POSTPRANDIAL' as const },
    { val: 92, tag: 'FASTING' as const },
    { val: 128, tag: 'POSTPRANDIAL' as const },
  ];

  let idCounter = 1;

  for (let i = daysCount - 1; i >= 0; i--) {
    const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Morning BP Reading (around 08:15 AM)
    const morningBpTime = new Date(dayDate);
    morningBpTime.setHours(8, 15 + Math.floor(Math.random() * 15), 0, 0);

    const bpTemplate = bpPatterns[i % bpPatterns.length];
    const morningSys = bpTemplate.sys + (Math.floor(Math.random() * 5) - 2);
    const morningDia = bpTemplate.dia + (Math.floor(Math.random() * 4) - 2);
    const morningPulse = bpTemplate.pulse + (Math.floor(Math.random() * 6) - 3);

    const bpRecord: BloodPressureRecord = {
      id: `bp-demo-${idCounter++}`,
      timestamp: morningBpTime.toISOString(),
      deviceType: 'BLOOD_PRESSURE',
      systolic: morningSys,
      diastolic: morningDia,
      pulse: morningPulse,
      status: classifyBloodPressure(morningSys, morningDia),
      source: 'OCR_AUTO',
      ocrConfidence: 0.94,
      notes: 'Morning measurement before breakfast',
    };
    records.push(bpRecord);

    // Morning Fasting Glucose (around 08:30 AM)
    const morningGlucoseTime = new Date(dayDate);
    morningGlucoseTime.setHours(8, 30 + Math.floor(Math.random() * 10), 0, 0);

    const glucTemplate = glucosePatterns[(i * 2) % glucosePatterns.length];
    const fastingVal = glucTemplate.val + (Math.floor(Math.random() * 6) - 3);

    const fastingRecord: BloodGlucoseRecord = {
      id: `gluc-demo-${idCounter++}`,
      timestamp: morningGlucoseTime.toISOString(),
      deviceType: 'BLOOD_GLUCOSE',
      glucoseValue: fastingVal,
      unit: 'mg/dL',
      mealTag: 'FASTING',
      status: classifyBloodGlucose(fastingVal, 'mg/dL', 'FASTING'),
      source: 'OCR_AUTO',
      ocrConfidence: 0.96,
      notes: 'Morning fasting',
    };
    records.push(fastingRecord);

    // Evening Postprandial Glucose every 2 days (around 08:00 PM)
    if (i % 2 === 0) {
      const eveningGlucoseTime = new Date(dayDate);
      eveningGlucoseTime.setHours(20, Math.floor(Math.random() * 20), 0, 0);

      const postVal = 135 + Math.floor(Math.random() * 20);
      const postRecord: BloodGlucoseRecord = {
        id: `gluc-demo-${idCounter++}`,
        timestamp: eveningGlucoseTime.toISOString(),
        deviceType: 'BLOOD_GLUCOSE',
        glucoseValue: postVal,
        unit: 'mg/dL',
        mealTag: 'POSTPRANDIAL',
        status: classifyBloodGlucose(postVal, 'mg/dL', 'POSTPRANDIAL'),
        source: 'OCR_AUTO',
        ocrConfidence: 0.92,
        notes: '2h after dinner',
      };
      records.push(postRecord);
    }
  }

  // Sort descending by timestamp
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
