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

    // Filter out common noise patterns (time HH:MM, date DD/MM/YYYY, memory tags)
    // to avoid confusing clock minutes or dates with glucose readings.
    const cleanLines = lines.map((line) => {
      return line
        // Remove times like 10:45, 12:30:15
        .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b(?:\s*[ap]m)?/gi, ' ')
        // Remove dates like 24/09/2026, 24.09.26, 2026-09-24
        .replace(/\b\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}\b/g, ' ')
        // Remove memory or code prefixes like MEM 02, CODE 25, AVG 7
        .replace(/\b(?:MEM|MEMORY|CODE|AVG|DAY|M|C)\s*\d+\b/gi, ' ')
        .trim();
    }).filter(Boolean);

    let glucoseValue: number | null = null;

    // Pattern 1: Decimal numbers like 5.4, 6.8, 11.2 (for mmol/L)
    // Only consider decimal if it is in physiological range for mmol/L (1.1 - 33.3)
    const isMmol = unit === 'mmol/L';
    const decimalMatches: { val: number; line: string; score: number }[] = [];

    for (const line of cleanLines) {
      const sanitized = sanitizeSevenSegmentText(line);
      const decMatch = sanitized.match(/\b(\d{1,2})[.,](\d)\b/);
      if (decMatch) {
        const val = parseFloat(`${decMatch[1]}.${decMatch[2]}`);
        if (val >= 1.5 && val <= 33.0) {
          let score = 10;
          if (isMmol) score += 50;
          if (/mmol|mol/i.test(line)) score += 30;
          decimalMatches.push({ val, line, score });
        }
      }
    }

    if (decimalMatches.length > 0 && (isMmol || decimalMatches[0].score >= 40)) {
      decimalMatches.sort((a, b) => b.score - a.score);
      const best = decimalMatches[0];
      glucoseValue = best.val;
      matchedLines.push(best.line);
      const finalUnit: GlucoseUnit = 'mmol/L';
      return {
        deviceType: 'BLOOD_GLUCOSE',
        glucoseValue,
        unit: finalUnit,
        mealTag,
        confidence: isMmol ? 0.95 : 0.88,
        status: classifyBloodGlucose(glucoseValue, finalUnit, mealTag),
        rawMatchedLines: matchedLines,
      };
    }

    // Pattern 2: Integer numbers (mg/dL) e.g. 70 to 450
    // Score each candidate based on prominence, line isolation, and proximity to glucose keywords
    const candidates: { num: number; line: string; score: number }[] = [];

    cleanLines.forEach((line, idx) => {
      const sanitized = sanitizeSevenSegmentText(line);
      // Find all 2-3 digit numbers
      const matches = sanitized.match(/\b\d{2,3}\b/g);
      if (matches) {
        for (const m of matches) {
          const num = parseInt(m, 10);
          if (num >= 35 && num <= 500) {
            let score = 0;
            // High score if line contains glucose keywords or units
            if (/mg[\/.]?d[l1i]|mgdl|seker|şeker|glukoz|glikoz|sugar/i.test(line)) {
              score += 60;
            }
            // Check adjacent lines for units or labels
            if (idx > 0 && /mg[\/.]?d[l1i]|mgdl|seker|şeker|glukoz|glikoz|sugar/i.test(cleanLines[idx - 1])) {
              score += 40;
            }
            if (idx + 1 < cleanLines.length && /mg[\/.]?d[l1i]|mgdl|seker|şeker|glukoz|glikoz|sugar/i.test(cleanLines[idx + 1])) {
              score += 40;
            }
            // Isolated numbers (e.g. line is just "105" or "105 mg/dL")
            if (/^\s*\d{2,3}\s*$/.test(line)) {
              score += 35;
            } else if (/^\s*(?:mg\/dl\s*)?\d{2,3}(?:\s*mg\/dl)?\s*$/i.test(line)) {
              score += 50;
            }
            // Plausible fasting / postprandial glucose range (70 - 250) gets higher likelihood
            if (num >= 65 && num <= 260) {
              score += 20;
            }

            candidates.push({ num, line, score });
          }
        }
      }
    });

    if (candidates.length > 0) {
      // Sort descending by score
      candidates.sort((a, b) => b.score - a.score);
      const topCandidate = candidates[0];
      glucoseValue = topCandidate.num;
      matchedLines.push(topCandidate.line);
    }

    if (glucoseValue !== null) {
      const finalUnit: GlucoseUnit = unit;
      let confidence = 0.86;
      if (
        /mg[\/.]?d[l1i]|mgdl|seker|şeker|glukoz|glikoz|sugar/i.test(rawText)
      ) {
        confidence += 0.08;
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
    if (lower.includes('mmol') || lower.includes('mmol/l') || lower.includes('mmo1')) {
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
