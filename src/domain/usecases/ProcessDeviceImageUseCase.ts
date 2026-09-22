import { IOcrEngine } from '../services/IOcrEngine';
import { IVisionFallbackService } from '../services/IVisionFallbackService';
import { SmartDeviceParser } from '../../data/parsers/SmartDeviceParser';
import { ImagePreprocessor } from '../../data/preprocessing/ImagePreprocessor';
import { OcrProcessingResult, ParsedOcrResult, BoundingBox } from '../models/OcrResult';
import { DeviceType } from '../models/HealthRecord';

export interface ProcessImageOptions {
  cropRegion?: BoundingBox;
  imageWidth?: number;
  imageHeight?: number;
  forcedDeviceType?: DeviceType;
}

export class ProcessDeviceImageUseCase {
  constructor(
    private ocrEngine: IOcrEngine,
    private fallbackService: IVisionFallbackService,
    private smartParser: SmartDeviceParser,
    private preprocessor: ImagePreprocessor
  ) {}

  public async execute(imageUri: string, options?: ProcessImageOptions): Promise<OcrProcessingResult> {
    try {
      // 1. Preprocess image (crop to viewfinder region, reduce noise, optimize contrast)
      const prepResult = await this.preprocessor.prepareForOcr(imageUri, {
        cropRegion: options?.cropRegion,
        imageWidth: options?.imageWidth,
        imageHeight: options?.imageHeight,
      });

      // 2. Run Primary On-Device OCR Engine
      const ocrResult = await this.ocrEngine.recognizeText(prepResult.processedUri);

      // 3. Run Smart Parser with spatial layout, label matching, and 7-segment digit correction
      const parseResult = this.smartParser.parse(ocrResult.fullText, ocrResult.blocks, {
        forcedDeviceType: options?.forcedDeviceType,
      });

      // 4. Check if confidence is adequate (>= 0.75) or if Fallback Service is required
      if (!parseResult.needsFallback && parseResult.result) {
        return {
          success: true,
          result: parseResult.result,
          usedFallback: false,
          confidenceScore: parseResult.result.confidence,
          rawExtractedText: ocrResult.fullText,
          processedImageUri: prepResult.processedUri,
        };
      }

      // 5. Trigger LLM Vision Fallback Service when on-device confidence is low or unreadable
      console.log('On-device OCR confidence low or unreadable. Invoking Vision LLM fallback...');
      const fallbackResult: ParsedOcrResult | null = await this.fallbackService.parseWithVisionLLM({
        imageUri: prepResult.processedUri,
        hintDeviceType: options?.forcedDeviceType,
        primaryOcrText: ocrResult.fullText,
      });

      if (fallbackResult) {
        return {
          success: true,
          result: fallbackResult,
          usedFallback: true,
          confidenceScore: fallbackResult.confidence,
          rawExtractedText: ocrResult.fullText,
          processedImageUri: prepResult.processedUri,
        };
      }

      // If fallback also did not return a result, return the partial on-device result if any
      if (parseResult.result) {
        return {
          success: true,
          result: parseResult.result,
          usedFallback: false,
          confidenceScore: parseResult.result.confidence,
          rawExtractedText: ocrResult.fullText,
          processedImageUri: prepResult.processedUri,
        };
      }

      return {
        success: false,
        usedFallback: true,
        confidenceScore: 0,
        errorMessage: 'Unable to recognize device measurement. Please verify alignment or enter values manually.',
        rawExtractedText: ocrResult.fullText,
        processedImageUri: prepResult.processedUri,
      };
    } catch (error: any) {
      console.error('ProcessDeviceImageUseCase failed:', error);
      return {
        success: false,
        usedFallback: false,
        confidenceScore: 0,
        errorMessage: error?.message || 'Error processing screen image',
        rawExtractedText: '',
      };
    }
  }
}
