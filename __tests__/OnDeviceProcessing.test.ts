import { ProcessDeviceImageUseCase } from '../src/domain/usecases/ProcessDeviceImageUseCase';
import { SaveHealthRecordUseCase, InvalidMeasurementError } from '../src/domain/usecases/SaveHealthRecordUseCase';
import { SmartDeviceParser } from '../src/data/parsers/SmartDeviceParser';
import { IOcrEngine, OcrEngineResult } from '../src/domain/services/IOcrEngine';
import { IHealthRecordRepository } from '../src/domain/repositories/IHealthRecordRepository';
import { HealthRecord } from '../src/domain/models/HealthRecord';

const fakePreprocessor = {
  prepareForOcr: async (uri: string) => ({ processedUri: uri, width: 100, height: 100, originalUri: uri }),
} as any;

const engineReturning = (fullText: string): IOcrEngine => ({
  recognizeText: async (): Promise<OcrEngineResult> => ({
    fullText,
    blocks: fullText ? [{ text: fullText, lines: fullText.split('\n').map((text) => ({ text })) }] : [],
  }),
});

describe('ProcessDeviceImageUseCase (on-device only)', () => {
  it('asks the user when the OCR engine returns nothing', async () => {
    const useCase = new ProcessDeviceImageUseCase(engineReturning(''), new SmartDeviceParser(), fakePreprocessor);
    const result = await useCase.execute('file://screen.jpg', { cropRegion: { x: 0, y: 0, width: 1, height: 1 } });
    expect(result.success).toBe(false);
    expect(result.needsUserInput).toBe(true);
    expect(result.result).toBeUndefined();
  });

  it('returns a confident reading without asking', async () => {
    const text = 'OMRON\nSYS mmHg\n128\nDIA mmHg\n84\nPULSE /min\n70';
    const useCase = new ProcessDeviceImageUseCase(engineReturning(text), new SmartDeviceParser(), fakePreprocessor);
    const result = await useCase.execute('file://screen.jpg');
    expect(result.success).toBe(true);
    expect(result.needsUserInput).toBe(false);
    expect(result.result?.deviceType).toBe('BLOOD_PRESSURE');
  });
});

describe('MlKitOcrEngine', () => {
  it('returns an empty result instead of invented values when ML Kit is not installed', async () => {
    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }), { virtual: true });
    const { MlKitOcrEngine } = require('../src/data/services/MlKitOcrEngine');
    const result = await new MlKitOcrEngine().recognizeText('file://x.jpg', { hintDeviceType: 'BLOOD_PRESSURE' });
    expect(result).toEqual({ blocks: [], fullText: '' });
  });
});

describe('SaveHealthRecordUseCase', () => {
  const makeRepo = () => {
    const saved: HealthRecord[] = [];
    const updated: HealthRecord[] = [];
    const repo = {
      saveRecord: jest.fn(async (r: HealthRecord) => {
        saved.push(r);
        return r;
      }),
      updateRecord: jest.fn(async (r: HealthRecord) => {
        updated.push(r);
        return r;
      }),
    } as unknown as IHealthRecordRepository;
    return { repo, saved, updated };
  };

  it('rejects implausible values and does not save them', async () => {
    const { repo, saved } = makeRepo();
    const useCase = new SaveHealthRecordUseCase(repo);
    await expect(useCase.saveBloodPressure({ systolic: 1240, diastolic: 82 })).rejects.toBeInstanceOf(
      InvalidMeasurementError
    );
    expect(saved).toHaveLength(0);
  });

  it('updates an existing record keeping its id and timestamp', async () => {
    const { repo, updated, saved } = makeRepo();
    const useCase = new SaveHealthRecordUseCase(repo);
    const record = await useCase.saveBloodGlucose({
      id: 'gluc-1',
      timestamp: '2026-11-20T08:00:00.000Z',
      glucoseValue: 112,
      unit: 'mg/dL',
      mealTag: 'FASTING',
    });
    expect(saved).toHaveLength(0);
    expect(updated).toHaveLength(1);
    expect(record.id).toBe('gluc-1');
    expect(record.timestamp).toBe('2026-11-20T08:00:00.000Z');
    expect(record.status.key).toBe('PREDIABETES');
  });
});
