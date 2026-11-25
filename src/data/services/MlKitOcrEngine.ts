import { IOcrEngine, OcrEngineOptions, OcrEngineResult } from '../../domain/services/IOcrEngine';
import { RecognizedTextBlock } from '../../domain/models/OcrResult';

const EMPTY_RESULT: OcrEngineResult = { blocks: [], fullText: '' };

/**
 * On-device text recognition. The image never leaves the phone.
 *
 * Uses the native ML Kit module when it is linked (development / store builds).
 * When it is not available (e.g. Expo Go) or recognition fails, an empty result
 * is returned so the UI asks the user to enter the values. It never invents values.
 */
export class MlKitOcrEngine implements IOcrEngine {
  public async recognizeText(imageUri: string, _options?: OcrEngineOptions): Promise<OcrEngineResult> {
    let MLKit: any;
    try {
      MLKit = require('@react-native-ml-kit/text-recognition');
    } catch {
      return EMPTY_RESULT;
    }

    const recognize = MLKit?.default?.recognize;
    if (typeof recognize !== 'function') {
      return EMPTY_RESULT;
    }

    try {
      const result = await recognize(imageUri);
      const blocks: RecognizedTextBlock[] = (result?.blocks || []).map((b: any) => ({
        text: b.text,
        lines: (b.lines || []).map((l: any) => ({
          text: l.text,
          confidence: l.confidence,
        })),
      }));
      return {
        blocks,
        fullText: result?.text || '',
      };
    } catch (error) {
      console.warn('On-device text recognition failed:', error);
      return EMPTY_RESULT;
    }
  }
}

export const mlKitOcrEngine = new MlKitOcrEngine();
