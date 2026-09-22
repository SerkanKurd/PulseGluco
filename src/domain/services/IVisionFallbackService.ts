import { ParsedOcrResult } from '../models/OcrResult';
import { DeviceType } from '../models/HealthRecord';

export interface FallbackVisionRequest {
  imageUri: string;
  imageBase64?: string;
  hintDeviceType?: DeviceType;
  primaryOcrText?: string;
}

export interface IVisionFallbackService {
  parseWithVisionLLM(request: FallbackVisionRequest): Promise<ParsedOcrResult | null>;
}
