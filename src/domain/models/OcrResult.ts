import { DeviceType, GlucoseUnit, MealTag } from './HealthRecord';
import { StatusCategory } from '../../core/constants/medical-thresholds';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecognizedTextLine {
  text: string;
  confidence?: number;
  boundingBox?: BoundingBox;
}

export interface RecognizedTextBlock {
  text: string;
  lines: RecognizedTextLine[];
  boundingBox?: BoundingBox;
}

export interface ParsedBloodPressureOcr {
  deviceType: 'BLOOD_PRESSURE';
  systolic: number;
  diastolic: number;
  pulse?: number;
  confidence: number;
  status: StatusCategory;
  rawMatchedLines: string[];
}

export interface ParsedBloodGlucoseOcr {
  deviceType: 'BLOOD_GLUCOSE';
  glucoseValue: number;
  unit: GlucoseUnit;
  mealTag: MealTag;
  confidence: number;
  status: StatusCategory;
  rawMatchedLines: string[];
}

export type ParsedOcrResult = ParsedBloodPressureOcr | ParsedBloodGlucoseOcr;

export interface OcrProcessingResult {
  success: boolean;
  result?: ParsedOcrResult;
  usedFallback: boolean;
  confidenceScore: number;
  errorMessage?: string;
  rawExtractedText: string;
  processedImageUri?: string;
}
