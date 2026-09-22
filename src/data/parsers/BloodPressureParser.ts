import { ParsedBloodPressureOcr } from '../../domain/models/OcrResult';
import { RecognizedTextBlock, RecognizedTextLine } from '../../domain/models/OcrResult';
import { classifyBloodPressure } from '../../core/constants/medical-thresholds';

export interface BpParserOptions {
  minimumConfidence?: number;
}

/**
 * Normalizes 7-segment display OCR misinterpretations
 */
export function sanitizeSevenSegmentText(rawText: string): string {
  return rawText
    // Common 7-segment character misreads in numerical contexts
    .replace(/[oO]/g, '0')
    .replace(/[iIl]/g, '1')
    .replace(/[zZ]/g, '2')
    .replace(/[sS](?=\d)/g, '5') // Only replace S before digits
    .replace(/[bB](?=\d)/g, '8')
    .trim();
}

/**
 * Validates physiological plausibility of BP values
 */
export function isPhysiologicallyPlausibleBp(sys: number, dia: number, pulse?: number): boolean {
  if (sys < 60 || sys > 260) return false;
  if (dia < 35 || dia > 160) return false;
  if (sys <= dia + 10) return false; // Systolic must comfortably exceed diastolic
  if (pulse !== undefined && (pulse < 35 || pulse > 230)) return false;
  return true;
}

export class BloodPressureParser {
  /**
   * Main parsing entry point from OCR text or blocks
   */
  public parse(
    rawText: string,
    blocks?: RecognizedTextBlock[],
    options: BpParserOptions = {}
  ): ParsedBloodPressureOcr | null {
    // Collect all lines
    let lines: string[] = [];
    if (blocks && blocks.length > 0) {
      lines = blocks.flatMap((b) => b.lines.map((l) => l.text));
    } else {
      lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    }

    // Step 1: Attempt explicit label-based parsing (most reliable)
    const labelResult = this.parseWithLabels(lines);
    if (labelResult) {
      return labelResult;
    }

    // Step 2: Attempt positional / vertical layout parsing (standard 3-number Omron style)
    const positionalResult = this.parsePositionalLayout(lines, blocks);
    if (positionalResult) {
      return positionalResult;
    }

    // Step 3: Attempt unstructured regex number extraction
    const fallbackRegexResult = this.parseUnstructuredNumbers(rawText);
    if (fallbackRegexResult) {
      return fallbackRegexResult;
    }

    return null;
  }

  /**
   * Approach 1: Label-Based Parsing (SYS, DIA, PUL / PULSE)
   */
  private parseWithLabels(lines: string[]): ParsedBloodPressureOcr | null {
    let systolic: number | null = null;
    let diastolic: number | null = null;
    let pulse: number | undefined = undefined;
    const matchedLines: string[] = [];
    let labelHits = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      // Look for SYS / SYSTOLIC / BUYUK / SISTOLIK (ensure it is not DIA)
      if (
        (/\b(SYS|SYSTOLIC|BUYUK|BÜYÜK|SISTOLIK|SİSTOLİK)\b/i.test(upper) ||
          /SYS|BUYUK|BÜYÜK|SISTOL|SİSTOL/i.test(upper)) &&
        !/DIA|KUCUK|KÜÇÜK|DIYASTOL|DİYASTOL/i.test(upper)
      ) {
        labelHits++;
        matchedLines.push(line);
        // Find number on this line or next line
        const num = this.extractNumberFromLineOrNeighbour(lines, i);
        if (num !== null && num >= 70 && num <= 250) {
          systolic = num;
        }
      }

      // Look for DIA / DIASTOLIC / KUCUK / DIYASTOLIK (ensure it is not SYS)
      if (
        (/\b(DIA|DIASTOLIC|KUCUK|KÜÇÜK|DIYASTOLIK|DİYASTOLİK)\b/i.test(upper) ||
          /DIA|KUCUK|KÜÇÜK|DIYASTOL|DİYASTOL/i.test(upper)) &&
        !/SYS|BUYUK|BÜYÜK|SISTOL|SİSTOL/i.test(upper)
      ) {
        labelHits++;
        matchedLines.push(line);
        const num = this.extractNumberFromLineOrNeighbour(lines, i);
        if (num !== null && num >= 40 && num <= 150) {
          diastolic = num;
        }
      }

      // Look for PULSE / PUL / HR / BPM / NABIZ / KALP
      if (
        /PUL|PUL\.|PULSE|HEART|BPM|MIN|NABIZ|NABZ|ATIM|KALP/i.test(upper) &&
        !/SYS|DIA|BUYUK|BÜYÜK|KUCUK|KÜÇÜK/i.test(upper)
      ) {
        labelHits++;
        matchedLines.push(line);
        const num = this.extractNumberFromLineOrNeighbour(lines, i);
        if (num !== null && num >= 40 && num <= 200) {
          pulse = num;
        }
      }
    }

    if (systolic !== null && diastolic !== null && isPhysiologicallyPlausibleBp(systolic, diastolic, pulse)) {
      // Calculate confidence based on label presence and pulse capture
      let confidence = 0.85;
      if (labelHits >= 2) confidence += 0.08;
      if (pulse !== undefined) confidence += 0.05;
      confidence = Math.min(confidence, 0.99);

      return {
        deviceType: 'BLOOD_PRESSURE',
        systolic,
        diastolic,
        pulse,
        confidence,
        status: classifyBloodPressure(systolic, diastolic),
        rawMatchedLines: matchedLines,
      };
    }

    return null;
  }

  /**
   * Helper: Extracts a numeric value from the current line or adjacent line
   */
  private extractNumberFromLineOrNeighbour(lines: string[], index: number): number | null {
    const currentLine = lines[index];
    // Check current line for isolated digits
    const inlineMatches = currentLine.match(/\b\d{2,3}\b/g);
    if (inlineMatches && inlineMatches.length > 0) {
      // Return the most plausible reading number
      const num = parseInt(inlineMatches[inlineMatches.length - 1], 10);
      return num;
    }

    // Check adjacent next line
    if (index + 1 < lines.length) {
      const nextLine = lines[index + 1].trim();
      const sanitized = sanitizeSevenSegmentText(nextLine);
      const nextMatches = sanitized.match(/\b\d{2,3}\b/g);
      if (nextMatches && nextMatches.length > 0) {
        return parseInt(nextMatches[0], 10);
      }
    }

    // Check adjacent previous line
    if (index - 1 >= 0) {
      const prevLine = lines[index - 1].trim();
      const sanitized = sanitizeSevenSegmentText(prevLine);
      const prevMatches = sanitized.match(/\b\d{2,3}\b/g);
      if (prevMatches && prevMatches.length > 0) {
        return parseInt(prevMatches[prevMatches.length - 1], 10);
      }
    }

    return null;
  }

  /**
   * Approach 2: Positional / Vertical Layout Parsing
   * Common on Omron monitors: Large digit top (SYS), Large digit middle (DIA), Small digit bottom (Pulse)
   */
  private parsePositionalLayout(lines: string[], blocks?: RecognizedTextBlock[]): ParsedBloodPressureOcr | null {
    // Extract all integers with 2 or 3 digits
    const candidates: { value: number; line: string; y?: number }[] = [];

    lines.forEach((l, idx) => {
      const sanitized = sanitizeSevenSegmentText(l);
      const matches = sanitized.match(/\b\d{2,3}\b/g);
      if (matches) {
        for (const m of matches) {
          const val = parseInt(m, 10);
          if (val >= 40 && val <= 250) {
            candidates.push({ value: val, line: l, y: idx });
          }
        }
      }
    });

    if (candidates.length >= 2) {
      // Try triplets: (sys, dia, pulse)
      for (let i = 0; i <= candidates.length - 2; i++) {
        const sys = candidates[i].value;
        const dia = candidates[i + 1].value;
        const pulCandidate = candidates[i + 2]?.value;

        if (isPhysiologicallyPlausibleBp(sys, dia, pulCandidate)) {
          return {
            deviceType: 'BLOOD_PRESSURE',
            systolic: sys,
            diastolic: dia,
            pulse: pulCandidate,
            confidence: 0.82,
            status: classifyBloodPressure(sys, dia),
            rawMatchedLines: [candidates[i].line, candidates[i + 1].line],
          };
        }
      }
    }

    return null;
  }

  /**
   * Approach 3: Unstructured regex slash patterns e.g., "120/80" or "135 / 85 - 72"
   */
  private parseUnstructuredNumbers(text: string): ParsedBloodPressureOcr | null {
    const sanitized = sanitizeSevenSegmentText(text);

    // Matches e.g. "120/80" or "120 / 80" or "120/80/72"
    const slashMatch = sanitized.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})(?:\s*[\/\-]\s*(\d{2,3}))?/);
    if (slashMatch) {
      const sys = parseInt(slashMatch[1], 10);
      const dia = parseInt(slashMatch[2], 10);
      const pul = slashMatch[3] ? parseInt(slashMatch[3], 10) : undefined;

      if (isPhysiologicallyPlausibleBp(sys, dia, pul)) {
        return {
          deviceType: 'BLOOD_PRESSURE',
          systolic: sys,
          diastolic: dia,
          pulse: pul,
          confidence: 0.80,
          status: classifyBloodPressure(sys, dia),
          rawMatchedLines: [slashMatch[0]],
        };
      }
    }

    return null;
  }
}

export const bloodPressureParser = new BloodPressureParser();
