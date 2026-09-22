import { ParsedBloodGlucoseOcr } from '../../domain/models/OcrResult';
import { RecognizedTextBlock } from '../../domain/models/OcrResult';
import { GlucoseUnit, MealTag } from '../../domain/models/HealthRecord';
import { classifyBloodGlucose } from '../../core/constants/medical-thresholds';
import { sanitizeSevenSegmentText } from './BloodPressureParser';

export class BloodGlucoseParser {
  /**
   * Main parsing entry point for Blood Glucose
   */
  public parse(rawText: string, blocks?: RecognizedTextBlock[]): ParsedBloodGlucoseOcr | null {
    let lines: string[] = [];
    if (blocks && blocks.length > 0) {
      lines = blocks.flatMap((b) => b.lines.map((l) => l.text));
    } else {
      lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    }

    const matchedLines: string[] = [];
    const unit = this.detectUnit(rawText);
    const mealTag = this.detectMealTag(rawText);

    // Look for decimal number first if mmol/L is suspected or dot is present
    let glucoseValue: number | null = null;

    // Pattern 1: Decimal numbers like 5.4, 6.8, 11.2 (for mmol/L)
    const decimalMatch = rawText.match(/\b(\d{1,2})[.,](\d)\b/);
    if (decimalMatch) {
      const val = parseFloat(`${decimalMatch[1]}.${decimalMatch[2]}`);
      if (val >= 1.1 && val <= 33.3) {
        glucoseValue = val;
        matchedLines.push(decimalMatch[0]);
        const finalUnit: GlucoseUnit = 'mmol/L';
        return {
          deviceType: 'BLOOD_GLUCOSE',
          glucoseValue: val,
          unit: finalUnit,
          mealTag,
          confidence: unit === 'mmol/L' ? 0.94 : 0.88,
          status: classifyBloodGlucose(val, finalUnit, mealTag),
          rawMatchedLines: matchedLines,
        };
      }
    }

    // Pattern 2: Integer numbers (mg/dL) e.g. 95, 115, 140, 210
    // Check line by line for prominent numbers
    for (const line of lines) {
      const sanitized = sanitizeSevenSegmentText(line);
      const matches = sanitized.match(/\b\d{2,3}\b/g);
      if (matches) {
        for (const m of matches) {
          const num = parseInt(m, 10);
          // Common glucose range in mg/dL: 30 to 500
          if (num >= 30 && num <= 500) {
            glucoseValue = num;
            matchedLines.push(line);
            break;
          }
        }
      }
      if (glucoseValue !== null) break;
    }

    if (glucoseValue !== null) {
      const finalUnit: GlucoseUnit = unit;
      let confidence = 0.85;
      if (
        rawText.toLowerCase().includes('mg/dl') ||
        rawText.toLowerCase().includes('mgdl') ||
        rawText.toLowerCase().includes('seker') ||
        rawText.toLowerCase().includes('şeker') ||
        rawText.toLowerCase().includes('glukoz') ||
        rawText.toLowerCase().includes('glikoz')
      ) {
        confidence += 0.1;
      }
      if (mealTag !== 'RANDOM') {
        confidence += 0.04;
      }

      return {
        deviceType: 'BLOOD_GLUCOSE',
        glucoseValue,
        unit: finalUnit,
        mealTag,
        confidence: Math.min(confidence, 0.98),
        status: classifyBloodGlucose(glucoseValue, finalUnit, mealTag),
        rawMatchedLines: matchedLines,
      };
    }

    return null;
  }

  /**
   * Detect measurement unit (mg/dL vs mmol/L)
   */
  public detectUnit(text: string): GlucoseUnit {
    const lower = text.toLowerCase();
    if (lower.includes('mmol') || lower.includes('mmol/l')) {
      return 'mmol/L';
    }
    // Default worldwide standard often mg/dL unless mmol detected
    return 'mg/dL';
  }

  /**
   * Detect meal timing context (Fasting vs Postprandial vs Before Meal)
   */
  public detectMealTag(text: string): MealTag {
    const lower = text.toLowerCase();

    if (
      lower.includes('fasting') ||
      lower.includes('before breakfast') ||
      lower.includes('pre-meal') ||
      lower.includes('pre meal') ||
      lower.includes('before meal') ||
      lower.includes('aclik') ||
      lower.includes('açlık') ||
      lower.includes('yemek oncesi') ||
      lower.includes('yemek öncesi') ||
      /\bac\b/.test(lower)
    ) {
      return 'FASTING';
    }

    if (
      lower.includes('postprandial') ||
      lower.includes('after meal') ||
      lower.includes('after food') ||
      lower.includes('post-meal') ||
      lower.includes('post meal') ||
      lower.includes('tokluk') ||
      lower.includes('yemek sonrasi') ||
      lower.includes('yemek sonrası') ||
      /\bpc\b/.test(lower)
    ) {
      return 'POSTPRANDIAL';
    }

    if (
      lower.includes('bedtime') ||
      lower.includes('night') ||
      lower.includes('sleep') ||
      lower.includes('gece') ||
      lower.includes('uyku') ||
      lower.includes('yatmadan')
    ) {
      return 'BEDTIME';
    }

    return 'RANDOM';
  }
}

export const bloodGlucoseParser = new BloodGlucoseParser();
