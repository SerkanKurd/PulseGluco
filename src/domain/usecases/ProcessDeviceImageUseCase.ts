import { IOcrEngine } from '../services/IOcrEngine';
import { SmartDeviceParser } from '../../data/parsers/SmartDeviceParser';
import { ImagePreprocessor } from '../../data/preprocessing/ImagePreprocessor';
import { OcrProcessingResult, BoundingBox } from '../models/OcrResult';
import { DeviceType } from '../models/HealthRecord';

export interface ProcessImageOptions {
  cropRegion?: BoundingBox;
  imageWidth?: number;
  imageHeight?: number;
  forcedDeviceType?: DeviceType;
}

/**
 * Reads a device screen entirely on the device. When the reading is missing or
 * not confident enough, the result is flagged with `needsUserInput` so the user
 * is asked for the values. Nothing is sent off the phone.
 */
export class ProcessDeviceImageUseCase {
  constructor(
    private ocrEngine: IOcrEngine,
    private smartParser: SmartDeviceParser,
    private preprocessor: ImagePreprocessor
  ) {}

  public async execute(imageUri: string, options?: ProcessImageOptions): Promise<OcrProcessingResult> {
    try {
      // 1. Crop to the viewfinder region and resize
      const prepResult = await this.preprocessor.prepareForOcr(imageUri, {
        cropRegion: options?.cropRegion,
        imageWidth: options?.imageWidth,
        imageHeight: options?.imageHeight,
      });

      // 2. On-device OCR
      let ocrResult = await this.ocrEngine.recognizeText(prepResult.processedUri, {
        hintDeviceType: options?.forcedDeviceType,
      });

      // 3. Parse with label matching, layout analysis and 7-segment corrections
      let parseResult = this.smartParser.parse(ocrResult.fullText, ocrResult.blocks, {
        forcedDeviceType: options?.forcedDeviceType,
      });

      // 3b. Digits may lie outside the crop: retry on the full image
      if (parseResult.needsUserInput && options?.cropRegion) {
        const fullOcrResult = await this.ocrEngine.recognizeText(imageUri, {
          hintDeviceType: options?.forcedDeviceType,
        });
        const fullParseResult = this.smartParser.parse(fullOcrResult.fullText, fullOcrResult.blocks, {
          forcedDeviceType: options?.forcedDeviceType,
        });
        if (
          fullParseResult.result &&
          (!parseResult.result || fullParseResult.result.confidence > parseResult.result.confidence)
        ) {
          ocrResult = fullOcrResult;
          parseResult = fullParseResult;
        }
      }

      return {
        success: Boolean(parseResult.result),
        result: parseResult.result ?? undefined,
        needsUserInput: parseResult.needsUserInput,
        confidenceScore: parseResult.result?.confidence ?? 0,
        rawExtractedText: ocrResult.fullText,
        processedImageUri: prepResult.processedUri,
      };
    } catch (error: any) {
      console.error('ProcessDeviceImageUseCase failed:', error);
      return {
        success: false,
        needsUserInput: true,
        confidenceScore: 0,
        errorMessage: error?.message || 'Error processing screen image',
        rawExtractedText: '',
      };
    }
  }
}
