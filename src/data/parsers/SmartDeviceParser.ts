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

    // 1. Check for explicit Blood Pressure keywords
    const bpKeywords = ['sys', 'dia', 'sistol', 'diyastol', 'buyuk', 'büyük', 'kucuk', 'küçük', 'mmhg', 'omron', 'cuff', 'tansiyon', 'pressure'];
    const bpScore = bpKeywords.reduce((count, kw) => (lower.includes(kw) ? count + 1 : count), 0);

    // 2. Check for explicit Glucose keywords
    const glucoseKeywords = [
      'mg/dl', 'mgdl', 'mg/d', 'mg/di', 'mg/d1', 'mg/l', 'mmol', 'mmo1',
      'glucose', 'sugar', 'seker', 'şeker', 'glukoz', 'glikoz',
      'onetouch', 'accu-chek', 'accu-check', 'freestyle', 'contour', 'glucomen',
      'aclik', 'açlık', 'tokluk', 'keton'
    ];
    const glucoseScore = glucoseKeywords.reduce((count, kw) => (lower.includes(kw) ? count + 1 : count), 0);

    // Decimals like 5.4, 6.8 indicate mmol/L glucose
    const hasDecimal = /\b\d{1,2}[.,]\d\b/.test(rawText) && !/\b\d{1,2}:\d{2}\b/.test(rawText);
    const effectiveGlucoseScore = glucoseScore + (hasDecimal ? 2 : 0);

    // Highest score wins
    if (effectiveGlucoseScore > bpScore) {
      return 'BLOOD_GLUCOSE';
    }
    if (bpScore > 0) {
      return 'BLOOD_PRESSURE';
    }

    // Ambiguity resolution: check if multiple 2-3 digit numbers exist outside timestamps
    const strippedText = rawText.replace(/\b\d{1,2}:\d{2}\b/g, ' ').replace(/\b\d{1,2}[./\-]\d{1,2}\b/g, ' ');
    const numberMatches = strippedText.match(/\b\d{2,3}\b/g);
    if (numberMatches && numberMatches.length >= 2) {
      return 'BLOOD_PRESSURE';
    } else if (numberMatches && numberMatches.length === 1) {
      const val = parseInt(numberMatches[0], 10);
      if (val >= 40 && val <= 400) {
        return 'BLOOD_GLUCOSE';
      }
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
    needsUserInput: boolean;
    detectedType: DeviceType;
  } {
    const detectedType = options?.forcedDeviceType ?? this.detectDeviceType(rawText);
    const threshold = options?.confidenceThreshold ?? this.defaultConfidenceThreshold;

    let result: ParsedOcrResult | null = null;

    if (detectedType === 'BLOOD_PRESSURE') {
      result = bloodPressureParser.parse(rawText, blocks);
      // If BP parsing failed but the user hadn't forced BP, try glucose
      if (!result && !options?.forcedDeviceType) {
        result = bloodGlucoseParser.parse(rawText, blocks);
      }
    } else {
      result = bloodGlucoseParser.parse(rawText, blocks);
      // If glucose parsing failed and not forced, try BP
      if (!result && !options?.forcedDeviceType) {
        result = bloodPressureParser.parse(rawText, blocks);
      }
    }

    // Low confidence or no result: the user must enter the values
    const needsUserInput = !result || result.confidence < threshold;

    return {
      result,
      needsUserInput,
      detectedType: result?.deviceType ?? detectedType,
    };
  }
}

export const smartDeviceParser = new SmartDeviceParser();
