import { RecognizedTextBlock } from '../models/OcrResult';
import { DeviceType } from '../models/HealthRecord';

export interface OcrEngineOptions {
  base64?: string;
  hintDeviceType?: DeviceType;
}

export interface OcrEngineResult {
  blocks: RecognizedTextBlock[];
  fullText: string;
}

export interface IOcrEngine {
  recognizeText(imageUri: string, options?: OcrEngineOptions): Promise<OcrEngineResult>;
}
