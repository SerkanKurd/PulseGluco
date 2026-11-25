/**
 * WHO, AHA/ACC, and ADA Medical Guidelines & Threshold Constants
 */

export enum MedicalSeverity {
  OPTIMAL = 'OPTIMAL',
  NORMAL = 'NORMAL',
  ELEVATED = 'ELEVATED',
  STAGE_1 = 'STAGE_1',
  STAGE_2 = 'STAGE_2',
  CRISIS = 'CRISIS',
  HYPOTENSION = 'HYPOTENSION',
  HYPOGLYCEMIA = 'HYPOGLYCEMIA',
  PREDIABETES = 'PREDIABETES',
  DIABETES = 'DIABETES',
}

export interface StatusCategory {
  key: MedicalSeverity;
  label: string;
  shortLabel: string;
  color: string;
  backgroundColor: string;
  description: string;
}

export const BP_STATUS_CATEGORIES: Record<MedicalSeverity, StatusCategory> = {
  [MedicalSeverity.OPTIMAL]: {
    key: MedicalSeverity.OPTIMAL,
    label: 'Normal / Optimal',
    shortLabel: 'Normal',
    color: '#10B981', // Green
    backgroundColor: '#ECFDF5',
    description: 'Systolic < 120 mmHg and Diastolic < 80 mmHg',
  },
  [MedicalSeverity.NORMAL]: {
    key: MedicalSeverity.NORMAL,
    label: 'Normal',
    shortLabel: 'Normal',
    color: '#10B981', // Green
    backgroundColor: '#ECFDF5',
    description: 'Systolic < 120 mmHg and Diastolic < 80 mmHg',
  },
  [MedicalSeverity.HYPOTENSION]: {
    key: MedicalSeverity.HYPOTENSION,
    label: 'Low Blood Pressure',
    shortLabel: 'Low',
    color: '#06B6D4', // Cyan
    backgroundColor: '#ECFEFF',
    description: 'Systolic < 90 mmHg or Diastolic < 60 mmHg',
  },
  [MedicalSeverity.ELEVATED]: {
    key: MedicalSeverity.ELEVATED,
    label: 'Elevated',
    shortLabel: 'Elevated',
    color: '#F59E0B', // Yellow / Amber
    backgroundColor: '#FFFBEB',
    description: 'Systolic 120–129 mmHg and Diastolic < 80 mmHg',
  },
  [MedicalSeverity.STAGE_1]: {
    key: MedicalSeverity.STAGE_1,
    label: 'Hypertension Stage 1',
    shortLabel: 'Stage 1',
    color: '#F97316', // Orange
    backgroundColor: '#FFF7ED',
    description: 'Systolic 130–139 mmHg or Diastolic 80–89 mmHg',
  },
  [MedicalSeverity.STAGE_2]: {
    key: MedicalSeverity.STAGE_2,
    label: 'Hypertension Stage 2',
    shortLabel: 'Stage 2',
    color: '#EF4444', // Red
    backgroundColor: '#FEF2F2',
    description: 'Systolic 140–179 mmHg or Diastolic 90–119 mmHg',
  },
  [MedicalSeverity.CRISIS]: {
    key: MedicalSeverity.CRISIS,
    label: 'Hypertensive Crisis',
    shortLabel: 'Crisis',
    color: '#991B1B', // Deep Red
    backgroundColor: '#FEE2E2',
    description: 'Systolic ≥ 180 mmHg or Diastolic ≥ 120 mmHg (Seek immediate medical attention)',
  },
  [MedicalSeverity.HYPOGLYCEMIA]: {
    key: MedicalSeverity.HYPOGLYCEMIA,
    label: 'Hypoglycemia',
    shortLabel: 'Low',
    color: '#8B5CF6', // Purple
    backgroundColor: '#F5F3FF',
    description: 'Blood sugar is dangerously low',
  },
  [MedicalSeverity.PREDIABETES]: {
    key: MedicalSeverity.PREDIABETES,
    label: 'Impaired / Prediabetes',
    shortLabel: 'Impaired',
    color: '#F59E0B',
    backgroundColor: '#FFFBEB',
    description: 'Elevated glucose levels',
  },
  [MedicalSeverity.DIABETES]: {
    key: MedicalSeverity.DIABETES,
    label: 'High Glucose / Diabetes',
    shortLabel: 'High',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    description: 'Significantly elevated glucose levels',
  },
};

/**
 * Classify Blood Pressure based on WHO / AHA 2017 Guidelines
 */
export function classifyBloodPressure(systolic: number, diastolic: number): StatusCategory {
  if (systolic >= 180 || diastolic >= 120) {
    return BP_STATUS_CATEGORIES[MedicalSeverity.CRISIS];
  }
  if (systolic >= 140 || diastolic >= 90) {
    return BP_STATUS_CATEGORIES[MedicalSeverity.STAGE_2];
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return BP_STATUS_CATEGORIES[MedicalSeverity.STAGE_1];
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return BP_STATUS_CATEGORIES[MedicalSeverity.ELEVATED];
  }
  if (systolic < 90 || diastolic < 60) {
    return BP_STATUS_CATEGORIES[MedicalSeverity.HYPOTENSION];
  }
  return BP_STATUS_CATEGORIES[MedicalSeverity.NORMAL];
}

/**
 * Classify Blood Glucose according to ADA / WHO Guidelines
 * Values normalized to mg/dL for classification (1 mmol/L = 18.0182 mg/dL)
 */
export function classifyBloodGlucose(
  value: number,
  unit: 'mg/dL' | 'mmol/L',
  mealContext: 'FASTING' | 'BEFORE_MEAL' | 'POSTPRANDIAL' | 'RANDOM' | 'BEDTIME' = 'FASTING'
): StatusCategory {
  const mgDl = unit === 'mmol/L' ? value * 18.0182 : value;

  // Hypoglycemia threshold
  if (mgDl < 70) {
    return BP_STATUS_CATEGORIES[MedicalSeverity.HYPOGLYCEMIA];
  }

  if (mealContext === 'FASTING' || mealContext === 'BEFORE_MEAL') {
    if (mgDl < 100) {
      return BP_STATUS_CATEGORIES[MedicalSeverity.NORMAL];
    }
    if (mgDl <= 125) {
      return BP_STATUS_CATEGORIES[MedicalSeverity.PREDIABETES];
    }
    return BP_STATUS_CATEGORIES[MedicalSeverity.DIABETES];
  } else if (mealContext === 'POSTPRANDIAL') {
    // 2 hours after meal
    if (mgDl < 140) {
      return BP_STATUS_CATEGORIES[MedicalSeverity.NORMAL];
    }
    if (mgDl <= 199) {
      return BP_STATUS_CATEGORIES[MedicalSeverity.PREDIABETES];
    }
    return BP_STATUS_CATEGORIES[MedicalSeverity.DIABETES];
  } else {
    // Random check
    if (mgDl < 140) {
      return BP_STATUS_CATEGORIES[MedicalSeverity.NORMAL];
    }
    if (mgDl < 200) {
      return BP_STATUS_CATEGORIES[MedicalSeverity.PREDIABETES];
    }
    return BP_STATUS_CATEGORIES[MedicalSeverity.DIABETES];
  }
}
