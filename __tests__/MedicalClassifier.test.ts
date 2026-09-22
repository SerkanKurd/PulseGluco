import {
  classifyBloodPressure,
  classifyBloodGlucose,
  MedicalSeverity,
} from '../src/core/constants/medical-thresholds';

describe('MedicalClassifier', () => {
  describe('Blood Pressure Classification (WHO / AHA 2017)', () => {
    it('classifies Normal (< 120 and < 80)', () => {
      const status = classifyBloodPressure(115, 75);
      expect(status.key).toBe(MedicalSeverity.NORMAL);
      expect(status.color).toBe('#10B981'); // Green
    });

    it('classifies Elevated (120-129 and < 80)', () => {
      const status = classifyBloodPressure(124, 76);
      expect(status.key).toBe(MedicalSeverity.ELEVATED);
      expect(status.color).toBe('#F59E0B'); // Yellow
    });

    it('classifies Hypertension Stage 1 (130-139 or 80-89)', () => {
      expect(classifyBloodPressure(132, 78).key).toBe(MedicalSeverity.STAGE_1);
      expect(classifyBloodPressure(124, 84).key).toBe(MedicalSeverity.STAGE_1);
      expect(classifyBloodPressure(135, 88).key).toBe(MedicalSeverity.STAGE_1);
    });

    it('classifies Hypertension Stage 2 (140-179 or 90-119)', () => {
      expect(classifyBloodPressure(145, 82).key).toBe(MedicalSeverity.STAGE_2);
      expect(classifyBloodPressure(128, 92).key).toBe(MedicalSeverity.STAGE_2);
      expect(classifyBloodPressure(160, 100).key).toBe(MedicalSeverity.STAGE_2);
    });

    it('classifies Hypertensive Crisis (>= 180 or >= 120)', () => {
      expect(classifyBloodPressure(182, 85).key).toBe(MedicalSeverity.CRISIS);
      expect(classifyBloodPressure(150, 125).key).toBe(MedicalSeverity.CRISIS);
      expect(classifyBloodPressure(195, 128).key).toBe(MedicalSeverity.CRISIS);
    });

    it('classifies Hypotension (< 90 or < 60)', () => {
      expect(classifyBloodPressure(88, 62).key).toBe(MedicalSeverity.HYPOTENSION);
      expect(classifyBloodPressure(95, 55).key).toBe(MedicalSeverity.HYPOTENSION);
    });
  });

  describe('Blood Glucose Classification (ADA / WHO)', () => {
    describe('Fasting', () => {
      it('classifies Fasting Normal (< 100 mg/dL)', () => {
        expect(classifyBloodGlucose(88, 'mg/dL', 'FASTING').key).toBe(MedicalSeverity.NORMAL);
      });

      it('classifies Fasting Impaired / Prediabetes (100 - 125 mg/dL)', () => {
        expect(classifyBloodGlucose(105, 'mg/dL', 'FASTING').key).toBe(MedicalSeverity.PREDIABETES);
      });

      it('classifies Fasting Diabetes (>= 126 mg/dL)', () => {
        expect(classifyBloodGlucose(130, 'mg/dL', 'FASTING').key).toBe(MedicalSeverity.DIABETES);
      });

      it('classifies Hypoglycemia (< 70 mg/dL)', () => {
        expect(classifyBloodGlucose(62, 'mg/dL', 'FASTING').key).toBe(MedicalSeverity.HYPOGLYCEMIA);
      });
    });

    describe('Postprandial (After Meal)', () => {
      it('classifies Postprandial Normal (< 140 mg/dL)', () => {
        expect(classifyBloodGlucose(120, 'mg/dL', 'POSTPRANDIAL').key).toBe(MedicalSeverity.NORMAL);
      });

      it('classifies Postprandial Prediabetes (140 - 199 mg/dL)', () => {
        expect(classifyBloodGlucose(165, 'mg/dL', 'POSTPRANDIAL').key).toBe(MedicalSeverity.PREDIABETES);
      });

      it('classifies Postprandial Diabetes (>= 200 mg/dL)', () => {
        expect(classifyBloodGlucose(215, 'mg/dL', 'POSTPRANDIAL').key).toBe(MedicalSeverity.DIABETES);
      });
    });

    describe('mmol/L Conversion Classification', () => {
      it('correctly converts mmol/L and classifies fasting normal (e.g. 5.0 mmol/L = 90 mg/dL)', () => {
        expect(classifyBloodGlucose(5.0, 'mmol/L', 'FASTING').key).toBe(MedicalSeverity.NORMAL);
      });

      it('correctly converts mmol/L and classifies fasting diabetes (e.g. 7.5 mmol/L = 135 mg/dL)', () => {
        expect(classifyBloodGlucose(7.5, 'mmol/L', 'FASTING').key).toBe(MedicalSeverity.DIABETES);
      });
    });
  });
});
