import { create } from 'zustand';
import { Alert } from 'react-native';
import {
  HealthRecord,
  DeviceType,
  GlucoseUnit,
  MealTag,
  RecordSource,
} from '../../domain/models/HealthRecord';
import { ParsedOcrResult } from '../../domain/models/OcrResult';
import { healthRecordRepository } from '../../data/repositories/HealthRecordRepositoryImpl';
import { mlKitOcrEngine } from '../../data/services/MlKitOcrEngine';
import { smartDeviceParser } from '../../data/parsers/SmartDeviceParser';
import { imagePreprocessor } from '../../data/preprocessing/ImagePreprocessor';
import { ProcessDeviceImageUseCase } from '../../domain/usecases/ProcessDeviceImageUseCase';
import { SaveHealthRecordUseCase, InvalidMeasurementError } from '../../domain/usecases/SaveHealthRecordUseCase';
import { GetAnalyticsUseCase, AnalyticsViewData } from '../../domain/usecases/GetAnalyticsUseCase';
import { ThemeMode } from '../../core/constants/theme';
import { SupportedLocale, DEFAULT_LOCALE, translations } from '../../core/i18n/translations';
import { measurementIssueMessage } from '../../core/i18n/measurementMessages';

const processImageUseCase = new ProcessDeviceImageUseCase(
  mlKitOcrEngine,
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
  /** The screen could not be read reliably; the user has to type the values. */
  needsUserInput: boolean;
  /** Set when editing an existing record. */
  editingRecordId: string | null;
  /** Original timestamp/source kept when editing. */
  timestamp: string | null;
  originalSource: RecordSource | null;
  deviceType: DeviceType;
  /** null = not read / not entered yet. Never pre-filled with a guess. */
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  glucoseValue: number | null;
  unit: GlucoseUnit;
  mealTag: MealTag;
  notes: string;
}

export interface HealthState {
  records: HealthRecord[];
  analytics: AnalyticsViewData | null;
  isLoading: boolean;
  isProcessingOcr: boolean;
  activeFilter: 'ALL' | DeviceType;
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
  setActiveFilter: (filter: 'ALL' | DeviceType) => void;
  setForcedScanMode: (mode: DeviceType | 'AUTO') => void;
  processCapturedImage: (imageUri: string, width?: number, height?: number) => Promise<boolean>;
  updateVerificationField: <K extends keyof VerificationState>(field: K, value: VerificationState[K]) => void;
  confirmAndSaveVerification: () => Promise<void>;
  dismissVerification: () => void;
  openManualEntry: (deviceType?: DeviceType) => void;
  openEditRecord: (record: HealthRecord) => void;
  deleteRecord: (id: string) => Promise<void>;
  resetToDemoData: () => Promise<void>;
}

const initialVerificationState: VerificationState = {
  isVisible: false,
  capturedImageUri: null,
  parsedResult: null,
  rawOcrText: '',
  confidence: 0,
  needsUserInput: false,
  editingRecordId: null,
  timestamp: null,
  originalSource: null,
  deviceType: 'BLOOD_PRESSURE',
  systolic: null,
  diastolic: null,
  pulse: null,
  glucoseValue: null,
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
  locale: DEFAULT_LOCALE,
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

      // Generous viewfinder region (90% width, 76% height) so the pulse row on BP monitors is not clipped
      const cropRegion = { x: 0.05, y: 0.12, width: 0.9, height: 0.76 };

      const result = await processImageUseCase.execute(imageUri, {
        cropRegion,
        imageWidth: width,
        imageHeight: height,
        forcedDeviceType: forced,
      });

      const parsed: ParsedOcrResult | undefined = result.result;
      // Only trusted readings are pre-filled. Otherwise the user is asked for the values.
      const trusted = parsed && !result.needsUserInput ? parsed : undefined;
      const deviceType: DeviceType = parsed?.deviceType ?? forced ?? 'BLOOD_PRESSURE';

      set({
        verification: {
          ...initialVerificationState,
          isVisible: true,
          capturedImageUri: result.processedImageUri || imageUri,
          parsedResult: parsed ?? null,
          rawOcrText: result.rawExtractedText,
          confidence: trusted ? result.confidenceScore : 0,
          needsUserInput: !trusted,
          deviceType,
          systolic: trusted?.deviceType === 'BLOOD_PRESSURE' ? trusted.systolic : null,
          diastolic: trusted?.deviceType === 'BLOOD_PRESSURE' ? trusted.diastolic : null,
          pulse: trusted?.deviceType === 'BLOOD_PRESSURE' ? trusted.pulse ?? null : null,
          glucoseValue: trusted?.deviceType === 'BLOOD_GLUCOSE' ? trusted.glucoseValue : null,
          unit: parsed?.deviceType === 'BLOOD_GLUCOSE' ? parsed.unit : initialVerificationState.unit,
          mealTag: parsed?.deviceType === 'BLOOD_GLUCOSE' ? parsed.mealTag : initialVerificationState.mealTag,
        },
      });
      return Boolean(trusted);
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
    const t = translations[get().locale] ?? translations[DEFAULT_LOCALE];

    // A value the user typed or corrected is a manual value
    const ocrUntouched =
      v.confidence > 0 &&
      v.parsedResult !== null &&
      (v.parsedResult.deviceType === 'BLOOD_PRESSURE'
        ? v.deviceType === 'BLOOD_PRESSURE' &&
          v.systolic === v.parsedResult.systolic &&
          v.diastolic === v.parsedResult.diastolic &&
          (v.pulse ?? null) === (v.parsedResult.pulse ?? null)
        : v.deviceType === 'BLOOD_GLUCOSE' && v.glucoseValue === v.parsedResult.glucoseValue);
    const source: RecordSource = v.editingRecordId
      ? v.originalSource === 'OCR_AUTO' && ocrUntouched
        ? 'OCR_AUTO'
        : 'MANUAL'
      : ocrUntouched
      ? 'OCR_AUTO'
      : 'MANUAL';

    const common = {
      id: v.editingRecordId ?? undefined,
      timestamp: v.timestamp ?? undefined,
      imageUri: v.capturedImageUri || undefined,
      rawOcrText: v.rawOcrText || undefined,
      ocrConfidence: v.confidence || undefined,
      source,
      notes: v.notes.trim() || undefined,
    };

    set({ isLoading: true });
    try {
      if (v.deviceType === 'BLOOD_PRESSURE') {
        await saveRecordUseCase.saveBloodPressure({
          ...common,
          systolic: v.systolic ?? 0,
          diastolic: v.diastolic ?? 0,
          pulse: v.pulse ?? undefined,
        });
      } else {
        await saveRecordUseCase.saveBloodGlucose({
          ...common,
          glucoseValue: v.glucoseValue ?? 0,
          unit: v.unit,
          mealTag: v.mealTag,
        });
      }

      const wasEditing = Boolean(v.editingRecordId);
      set({ verification: initialVerificationState, activeTab: 'dashboard' });
      await get().loadRecords();
      await get().loadAnalytics();
      if (!wasEditing) {
        Alert.alert(t.common.savedSuccessfully, t.common.savedMessage);
      }
    } catch (err: any) {
      if (err instanceof InvalidMeasurementError) {
        const messages = err.issues.map((issue) => measurementIssueMessage(t, issue, v.unit));
        Alert.alert(t.common.checkValuesTitle, messages.join('\n'));
      } else {
        console.error('Failed to save record:', err);
        Alert.alert(t.common.error, t.common.saveFailed);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  dismissVerification: () => {
    set({ verification: initialVerificationState });
  },

  openManualEntry: (deviceType?: DeviceType) => {
    set({
      verification: {
        ...initialVerificationState,
        isVisible: true,
        deviceType: deviceType || 'BLOOD_PRESSURE',
      },
    });
  },

  openEditRecord: (record: HealthRecord) => {
    const base = {
      ...initialVerificationState,
      isVisible: true,
      editingRecordId: record.id,
      timestamp: record.timestamp,
      originalSource: record.source,
      capturedImageUri: record.imageUri ?? null,
      rawOcrText: record.rawOcrText ?? '',
      notes: record.notes ?? '',
    };
    if (record.deviceType === 'BLOOD_PRESSURE') {
      set({
        verification: {
          ...base,
          deviceType: 'BLOOD_PRESSURE',
          systolic: record.systolic,
          diastolic: record.diastolic,
          pulse: record.pulse ?? null,
        },
      });
    } else {
      set({
        verification: {
          ...base,
          deviceType: 'BLOOD_GLUCOSE',
          glucoseValue: record.glucoseValue,
          unit: record.unit,
          mealTag: record.mealTag,
        },
      });
    }
  },

  deleteRecord: async (id: string) => {
    await healthRecordRepository.deleteRecord(id);
    await get().loadRecords();
    await get().loadAnalytics();
  },

  /** Development only: wipes the logbook and fills it with demo records. */
  resetToDemoData: async () => {
    if (!__DEV__) return;
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
