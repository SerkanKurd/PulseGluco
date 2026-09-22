import { ParsedOcrResult, RecognizedTextBlock } from '../../domain/models/OcrResult';
import { DeviceType } from '../../domain/models/HealthRecord';
import { bloodPressureParser } from './BloodPressureParser';
import { bloodGlucoseParser } from './BloodGlucoseParser';

export interface SmartParseOptions {
  forcedDeviceType?: DeviceType;
  confidenceThreshold?: number;
}

export class SmartDeviceParser {
  private readonly defaultConfidenceThreshold = 0.75;

  /**
   * Determine device type from OCR contents if not explicitly forced by user mode
   */
  public detectDeviceType(rawText: string): DeviceType {
    const lower = rawText.toLowerCase();

    // Check for explicit Blood Pressure keywords
    const bpKeywords = ['sys', 'dia', 'pul', 'pulse', 'mmhg', 'bpm', 'omron', 'cuff', 'pressure'];
    const bpScore = bpKeywords.reduce((count, kw) => (lower.includes(kw) ? count + 1 : count), 0);

    // Check for explicit Glucose keywords
    const glucoseKeywords = ['mg/dl', 'mmol', 'glucose', 'sugar', 'onetouch', 'accu-chek', 'freestyle', 'contour'];
    const glucoseScore = glucoseKeywords.reduce((count, kw) => (lower.includes(kw) ? count + 1 : count), 0);

    if (glucoseScore > bpScore) {
      return 'BLOOD_GLUCOSE';
    }
    if (bpScore > 0) {
      return 'BLOOD_PRESSURE';
    }

    // Default to blood pressure if ambiguous but contains multiple 2-3 digit numbers
    const numberMatches = rawText.match(/\b\d{2,3}\b/g);
    if (numberMatches && numberMatches.length >= 2) {
      return 'BLOOD_PRESSURE';
    }

    return 'BLOOD_PRESSURE';
  }

  /**
   * Primary parse method coordinating on-device OCR parsers
   */
  public parse(
    rawText: string,
    blocks?: RecognizedTextBlock[],
    options?: SmartParseOptions
  ): {
    result: ParsedOcrResult | null;
    needsFallback: boolean;
    detectedType: DeviceType;
  } {
    const detectedType = options?.forcedDeviceType ?? this.detectDeviceType(rawText);
    const threshold = options?.confidenceThreshold ?? this.defaultConfidenceThreshold;

    let result: ParsedOcrResult | null = null;

    if (detectedType === 'BLOOD_PRESSURE') {
      result = bloodPressureParser.parse(rawText, blocks);
      // If BP parsing failed but user hadn't forced BP, try glucose
      if (!result && !options?.forcedDeviceType) {
        result = bloodGlucoseParser.parse(rawText, blocks);
      }
    } else {
      result = bloodGlucoseParser.parse(rawText, blocks);
      // If Glucose parsing failed and not forced, try BP
      if (!result && !options?.forcedDeviceType) {
        result = bloodPressureParser.parse(rawText, blocks);
      }
    }

    const needsFallback = !result || result.confidence < threshold;

    return {
      result,
      needsFallback,
      detectedType: result?.deviceType ?? detectedType,
    };
  }
}

export const smartDeviceParser = new SmartDeviceParser();
