import { RecognizedTextBlock } from '../models/OcrResult';

export interface OcrEngineResult {
  blocks: RecognizedTextBlock[];
  fullText: string;
}

export interface IOcrEngine {
  recognizeText(imageUri: string): Promise<OcrEngineResult>;
}
