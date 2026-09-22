import { IHealthRecordRepository, AnalyticsSummary } from '../repositories/IHealthRecordRepository';
import { HealthRecord, BloodPressureRecord, BloodGlucoseRecord, isBloodPressureRecord, isBloodGlucoseRecord } from '../models/HealthRecord';

export interface ChartDataPoint {
  id: string;
  timestamp: string;
  label: string;
  value: number;
  secondaryValue?: number;
  pulse?: number;
  color: string;
  statusLabel: string;
  tag?: string;
}

export interface AnalyticsViewData {
  summary: AnalyticsSummary;
  bpChartData: ChartDataPoint[];
  glucoseChartData: ChartDataPoint[];
  recentRecords: HealthRecord[];
}

export class GetAnalyticsUseCase {
  constructor(private repository: IHealthRecordRepository) {}

  public async execute(days: number = 14): Promise<AnalyticsViewData> {
    const summary = await this.repository.getAnalyticsSummary(days);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const records = await this.repository.getAllRecords({ startDate: cutoffDate });

    // Chronological order for charts (oldest to newest)
    const chronologicalRecords = [...records].reverse();

    const bpChartData: ChartDataPoint[] = chronologicalRecords
      .filter(isBloodPressureRecord)
      .map((r: BloodPressureRecord) => {
        const d = new Date(r.timestamp);
        return {
          id: r.id,
          timestamp: r.timestamp,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          value: r.systolic,
          secondaryValue: r.diastolic,
          pulse: r.pulse,
          color: r.status.color,
          statusLabel: r.status.label,
        };
      });

    const glucoseChartData: ChartDataPoint[] = chronologicalRecords
      .filter(isBloodGlucoseRecord)
      .map((r: BloodGlucoseRecord) => {
        const d = new Date(r.timestamp);
        const mgValue = r.unit === 'mmol/L' ? Math.round(r.glucoseValue * 18.0182) : r.glucoseValue;
        return {
          id: r.id,
          timestamp: r.timestamp,
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          value: mgValue,
          color: r.status.color,
          statusLabel: r.status.label,
          tag: r.mealTag,
        };
      });

    return {
      summary,
      bpChartData,
      glucoseChartData,
      recentRecords: records.slice(0, 20),
    };
  }
}
