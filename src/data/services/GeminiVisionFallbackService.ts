import { IVisionFallbackService, FallbackVisionRequest } from '../../domain/services/IVisionFallbackService';
import { ParsedOcrResult } from '../../domain/models/OcrResult';
import { classifyBloodPressure, classifyBloodGlucose, classifyPulse } from '../../core/constants/medical-thresholds';
import * as FileSystem from 'expo-file-system/legacy';

export class GeminiVisionFallbackService implements IVisionFallbackService {
  private apiKey: string;
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor(apiKey: string = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '') {
    this.apiKey = apiKey;
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async parseWithVisionLLM(request: FallbackVisionRequest): Promise<ParsedOcrResult | null> {
    if (!this.apiKey) {
      console.warn('Gemini API key not configured for vision fallback service.');
      return null;
    }

    try {
      let base64Data = request.imageBase64;
      if (!base64Data && request.imageUri) {
        base64Data = await FileSystem.readAsStringAsync(request.imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (!base64Data) {
        throw new Error('Image base64 payload is missing.');
      }

      const prompt = `You are a medical OCR specialist. Examine this medical device screen (blood pressure monitor, blood glucose meter, or pulse oximeter).
Accurately read the digital numbers even if the 7-segment display has low contrast, broken segments, or glare.
${request.hintDeviceType ? `Hint: User selected device mode is ${request.hintDeviceType}.` : ''}

Respond STRICTLY with a valid JSON object in one of these formats:

If Blood Pressure Monitor:
{
  "deviceType": "BLOOD_PRESSURE",
  "systolic": 120,
  "diastolic": 80,
  "pulse": 72,
  "confidence": 0.95
}

If Blood Glucose Meter:
{
  "deviceType": "BLOOD_GLUCOSE",
  "glucoseValue": 105,
  "unit": "mg/dL" or "mmol/L",
  "mealTag": "FASTING" or "POSTPRANDIAL" or "RANDOM",
  "confidence": 0.95
}

If Fingertip Pulse Oximeter or Pulse Monitor:
{
  "deviceType": "PULSE",
  "pulse": 72,
  "spo2": 98,
  "confidence": 0.95
}

If the image is unreadable, return:
{
  "error": "UNREADABLE"
}
`;

      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        console.error('Gemini Vision API error:', response.status, await response.text());
        return null;
      }

      const responseData = await response.json();
      const textOutput = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) return null;

      const parsedJson = JSON.parse(textOutput);
      if (parsedJson.error) return null;

      if (parsedJson.deviceType === 'BLOOD_PRESSURE') {
        const sys = Number(parsedJson.systolic);
        const dia = Number(parsedJson.diastolic);
        const pul = parsedJson.pulse ? Number(parsedJson.pulse) : undefined;
        return {
          deviceType: 'BLOOD_PRESSURE',
          systolic: sys,
          diastolic: dia,
          pulse: pul,
          confidence: Number(parsedJson.confidence) || 0.95,
          status: classifyBloodPressure(sys, dia),
          rawMatchedLines: [`[Vision AI] SYS: ${sys}, DIA: ${dia}${pul ? `, PULSE: ${pul}` : ''}`],
        };
      } else if (parsedJson.deviceType === 'BLOOD_GLUCOSE') {
        const val = Number(parsedJson.glucoseValue);
        const unit = parsedJson.unit === 'mmol/L' ? 'mmol/L' : 'mg/dL';
        const mealTag = parsedJson.mealTag || 'FASTING';
        return {
          deviceType: 'BLOOD_GLUCOSE',
          glucoseValue: val,
          unit,
          mealTag,
          confidence: Number(parsedJson.confidence) || 0.95,
          status: classifyBloodGlucose(val, unit, mealTag),
          rawMatchedLines: [`[Vision AI] Glucose: ${val} ${unit}`],
        };
      } else if (parsedJson.deviceType === 'PULSE') {
        const pul = Number(parsedJson.pulse) || 72;
        const spo2 = parsedJson.spo2 ? Number(parsedJson.spo2) : undefined;
        return {
          deviceType: 'PULSE',
          pulse: pul,
          spo2,
          confidence: Number(parsedJson.confidence) || 0.95,
          status: classifyPulse(pul),
          rawMatchedLines: [`[Vision AI] Pulse: ${pul} bpm${spo2 ? `, SpO2: ${spo2}%` : ''}`],
        };
      }

      return null;
    } catch (err) {
      console.error('Gemini Vision fallback execution failed:', err);
      return null;
    }
  }
}

export const geminiVisionFallback = new GeminiVisionFallbackService();
