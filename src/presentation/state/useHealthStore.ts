import { create } from 'zustand';
import { Alert } from 'react-native';
import {
  HealthRecord,
  BloodPressureRecord,
  BloodGlucoseRecord,
  DeviceType,
  GlucoseUnit,
  MealTag,
  isBloodPressureRecord,
  isBloodGlucoseRecord,
} from '../../domain/models/HealthRecord';
import { ParsedOcrResult } from '../../domain/models/OcrResult';
import { healthRecordRepository } from '../../data/repositories/HealthRecordRepositoryImpl';
import { mlKitOcrEngine } from '../../data/services/MlKitOcrEngine';
import { geminiVisionFallback } from '../../data/services/GeminiVisionFallbackService';
import { smartDeviceParser } from '../../data/parsers/SmartDeviceParser';
import { imagePreprocessor } from '../../data/preprocessing/ImagePreprocessor';
import { ProcessDeviceImageUseCase } from '../../domain/usecases/ProcessDeviceImageUseCase';
import { SaveHealthRecordUseCase } from '../../domain/usecases/SaveHealthRecordUseCase';
import { GetAnalyticsUseCase, AnalyticsViewData } from '../../domain/usecases/GetAnalyticsUseCase';
import { classifyBloodPressure, classifyBloodGlucose } from '../../core/constants/medical-thresholds';
import { ThemeMode } from '../../core/constants/theme';
import { SupportedLocale } from '../../core/i18n/translations';

const processImageUseCase = new ProcessDeviceImageUseCase(
  mlKitOcrEngine,
  geminiVisionFallback,
  smartDeviceParser,
  imagePreprocessor
);

const saveRecordUseCase = new SaveHealthRecordUseCase(healthRecordRepository);
const getAnalyticsUseCase = new GetAnalyticsUseCase(healthRecordRepository);

export interface VerificationState {
  isVisible: boolean;
  capturedImageUri: string | null;
  parsedResult: ParsedOcrResult | null;
  rawOcrText: string;
  confidence: number;
  usedFallback: boolean;
  deviceType: DeviceType;
  systolic: number;
  diastolic: number;
  pulse?: number;
  glucoseValue: number;
  unit: GlucoseUnit;
  mealTag: MealTag;
  notes: string;
}

export interface HealthState {
  records: HealthRecord[];
  analytics: AnalyticsViewData | null;
  isLoading: boolean;
  isProcessingOcr: boolean;
  activeFilter: 'ALL' | 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'PULSE';
  selectedDaysRange: 7 | 14 | 30 | 90;
  activeTab: 'dashboard' | 'camera' | 'analytics' | 'export';
  forcedScanMode: DeviceType | 'AUTO';
  locale: SupportedLocale;
  themeMode: ThemeMode;
  verification: VerificationState;

  // Actions
  initializeStore: () => Promise<void>;
  setLocale: (locale: SupportedLocale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  loadRecords: () => Promise<void>;
  loadAnalytics: (days?: 7 | 14 | 30 | 90) => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'camera' | 'analytics' | 'export') => void;
  setActiveFilter: (filter: 'ALL' | 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'PULSE') => void;
  setForcedScanMode: (mode: DeviceType | 'AUTO') => void;
  processCapturedImage: (imageUri: string, width?: number, height?: number) => Promise<boolean>;
  updateVerificationField: <K extends keyof VerificationState>(field: K, value: VerificationState[K]) => void;
  confirmAndSaveVerification: () => Promise<void>;
  dismissVerification: () => void;
  openManualEntry: (deviceType?: DeviceType) => void;
  deleteRecord: (id: string) => Promise<void>;
  resetToDemoData: () => Promise<void>;
}

const initialVerificationState: VerificationState = {
  isVisible: false,
  capturedImageUri: null,
  parsedResult: null,
  rawOcrText: '',
  confidence: 0,
  usedFallback: false,
  deviceType: 'BLOOD_PRESSURE',
  systolic: 120,
  diastolic: 80,
  pulse: 72,
  glucoseValue: 100,
  unit: 'mg/dL',
  mealTag: 'FASTING',
  notes: '',
};

export const useHealthStore = create<HealthState>((set, get) => ({
  records: [],
  analytics: null,
  isLoading: false,
  isProcessingOcr: false,
  activeFilter: 'ALL',
  selectedDaysRange: 14,
  activeTab: 'dashboard',
  forcedScanMode: 'AUTO',
  locale: 'tr',
  themeMode: 'system',
  verification: initialVerificationState,

  initializeStore: async () => {
    set({ isLoading: true });
    try {
      await get().loadRecords();
      await get().loadAnalytics(get().selectedDaysRange);
    } finally {
      set({ isLoading: false });
    }
  },

  setLocale: (locale: SupportedLocale) => set({ locale }),

  setThemeMode: (mode: ThemeMode) => set({ themeMode: mode }),

  toggleThemeMode: () => {
    const current = get().themeMode;
    const next = current === 'dark' ? 'light' : 'dark';
    set({ themeMode: next });
  },

  loadRecords: async () => {
    const records = await healthRecordRepository.getAllRecords();
    set({ records });
  },

  loadAnalytics: async (days) => {
    const targetDays = days || get().selectedDaysRange;
    const analytics = await getAnalyticsUseCase.execute(targetDays);
    set({ analytics, selectedDaysRange: targetDays });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  setForcedScanMode: (mode) => set({ forcedScanMode: mode }),

  processCapturedImage: async (imageUri: string, width?: number, height?: number) => {
    set({ isProcessingOcr: true });
    try {
      const mode = get().forcedScanMode;
      const forced: DeviceType | undefined = mode === 'AUTO' ? undefined : mode;

      // Generous viewfinder bounding box region (90% width, 76% height)
      // to ensure bottom digits (pulse on BP monitors) and indicators are never clipped
      const cropRegion = {
        x: 0.05,
        y: 0.12,
        width: 0.90,
        height: 0.76,
      };

      const result = await processImageUseCase.execute(imageUri, {
        cropRegion,
        imageWidth: width,
        imageHeight: height,
        forcedDeviceType: forced,
      });

      if (result.success && result.result) {
        const parsed = result.result;
        if (parsed.deviceType === 'BLOOD_PRESSURE') {
          set({
            verification: {
              isVisible: true,
              capturedImageUri: result.processedImageUri || imageUri,
              parsedResult: parsed,
              rawOcrText: result.rawExtractedText,
              confidence: result.confidenceScore,
              usedFallback: result.usedFallback,
              deviceType: 'BLOOD_PRESSURE',
              systolic: parsed.systolic,
              diastolic: parsed.diastolic,
              pulse: parsed.pulse || 72,
              glucoseValue: 100,
              unit: 'mg/dL',
              mealTag: 'FASTING',
              notes: result.usedFallback ? 'Verified with Vision AI fallback' : 'Auto-detected via on-device OCR',
            },
          });
        } else if (parsed.deviceType === 'PULSE') {
          set({
            verification: {
              isVisible: true,
              capturedImageUri: result.processedImageUri || imageUri,
              parsedResult: parsed,
              rawOcrText: result.rawExtractedText,
              confidence: result.confidenceScore,
              usedFallback: result.usedFallback,
              deviceType: 'PULSE',
              systolic: 120,
              diastolic: 80,
              pulse: parsed.pulse,
              glucoseValue: 100,
              unit: 'mg/dL',
              mealTag: 'FASTING',
              notes: result.usedFallback ? 'Verified with Vision AI fallback' : 'Auto-detected via on-device OCR',
            },
          });
        } else {
          set({
            verification: {
              isVisible: true,
              capturedImageUri: result.processedImageUri || imageUri,
              parsedResult: parsed,
              rawOcrText: result.rawExtractedText,
              confidence: result.confidenceScore,
              usedFallback: result.usedFallback,
              deviceType: 'BLOOD_GLUCOSE',
              systolic: 120,
              diastolic: 80,
              pulse: 72,
              glucoseValue: parsed.glucoseValue,
              unit: parsed.unit,
              mealTag: parsed.mealTag,
              notes: result.usedFallback ? 'Verified with Vision AI fallback' : 'Auto-detected via on-device OCR',
            },
          });
        }
        return true;
      } else {
        // Fallback to manual entry modal with image attached
        const fallbackDeviceType: DeviceType = forced || 'BLOOD_PRESSURE';
        set({
          verification: {
            ...initialVerificationState,
            isVisible: true,
            deviceType: fallbackDeviceType,
            capturedImageUri: result.processedImageUri || imageUri,
            rawOcrText: result.rawExtractedText || 'No text detected',
            confidence: 0,
            notes: 'Values could not be detected automatically. Please verify or edit manually.',
          },
        });
        return false;
      }
    } finally {
      set({ isProcessingOcr: false });
    }
  },

  updateVerificationField: (field, value) => {
    set((state) => ({
      verification: {
        ...state.verification,
        [field]: value,
      },
    }));
  },

  confirmAndSaveVerification: async () => {
    const v = get().verification;
    set({ isLoading: true });

    try {
      if (v.deviceType === 'BLOOD_PRESSURE') {
        const sys = Number(v.systolic);
        const dia = Number(v.diastolic);
        if (!sys || sys <= 0 || !dia || dia <= 0) {
          Alert.alert('Incomplete Reading', 'Please enter both Systolic and Diastolic values.');
          set({ isLoading: false });
          return;
        }

        await saveRecordUseCase.saveBloodPressure({
          systolic: sys,
          diastolic: dia,
          pulse: v.pulse ? Number(v.pulse) : undefined,
          imageUri: v.capturedImageUri || undefined,
          rawOcrText: v.rawOcrText,
          ocrConfidence: v.confidence,
          source: v.usedFallback ? 'OCR_FALLBACK' : v.confidence > 0 ? 'OCR_AUTO' : 'MANUAL',
          notes: v.notes,
        });
      } else if (v.deviceType === 'PULSE') {
        const pul = Number(v.pulse);
        if (!pul || pul <= 0) {
          Alert.alert('Incomplete Reading', 'Please enter a valid pulse rate.');
          set({ isLoading: false });
          return;
        }

        await saveRecordUseCase.savePulse({
          pulse: pul,
          spo2: v.parsedResult && 'spo2' in v.parsedResult ? (v.parsedResult as any).spo2 : undefined,
          imageUri: v.capturedImageUri || undefined,
          rawOcrText: v.rawOcrText,
          ocrConfidence: v.confidence,
          source: v.usedFallback ? 'OCR_FALLBACK' : v.confidence > 0 ? 'OCR_AUTO' : 'MANUAL',
          notes: v.notes,
        });
      } else {
        const gluc = Number(v.glucoseValue);
        if (!gluc || gluc <= 0) {
          Alert.alert('Incomplete Reading', 'Please enter a valid Blood Glucose number.');
          set({ isLoading: false });
          return;
        }

        await saveRecordUseCase.saveBloodGlucose({
          glucoseValue: gluc,
          unit: v.unit,
          mealTag: v.mealTag,
          imageUri: v.capturedImageUri || undefined,
          rawOcrText: v.rawOcrText,
          ocrConfidence: v.confidence,
          source: v.usedFallback ? 'OCR_FALLBACK' : v.confidence > 0 ? 'OCR_AUTO' : 'MANUAL',
          notes: v.notes,
        });
      }

      set({ verification: initialVerificationState, activeTab: 'dashboard' });
      await get().loadRecords();
      await get().loadAnalytics();
      Alert.alert('Saved Successfully', 'Your measurement has been saved to your offline logbook.');
    } catch (err: any) {
      console.error('Failed to save record:', err);
      Alert.alert('Save Failed', err?.message || 'Could not save the measurement. Please try again.');
    } finally {
      set({ isLoading: false });
    }
  },

  dismissVerification: () => {
    set({ verification: initialVerificationState });
  },

  openManualEntry: (deviceType?: DeviceType) => {
    const type: DeviceType = deviceType || 'BLOOD_PRESSURE';
    set({
      verification: {
        ...initialVerificationState,
        isVisible: true,
        deviceType: type,
        systolic: type === 'BLOOD_PRESSURE' ? 120 : 0,
        diastolic: type === 'BLOOD_PRESSURE' ? 80 : 0,
        pulse: type === 'BLOOD_PRESSURE' || type === 'PULSE' ? 72 : undefined,
        glucoseValue: type === 'BLOOD_GLUCOSE' ? 100 : 0,
        confidence: 0,
        notes: 'Manual entry',
      },
    });
  },

  deleteRecord: async (id: string) => {
    await healthRecordRepository.deleteRecord(id);
    await get().loadRecords();
    await get().loadAnalytics();
  },

  resetToDemoData: async () => {
    set({ isLoading: true });
    try {
      await healthRecordRepository.clearAllRecords();
      await healthRecordRepository.seedDemoData();
      await get().loadRecords();
      await get().loadAnalytics();
    } finally {
      set({ isLoading: false });
    }
  },
}));
