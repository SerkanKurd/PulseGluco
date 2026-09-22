import { HealthRecord } from '../models/HealthRecord';
import { AnalyticsSummary } from '../repositories/IHealthRecordRepository';

export interface ExportReportOptions {
  records: HealthRecord[];
  summary: AnalyticsSummary;
  patientName?: string;
  dateRangeLabel: string;
}

export interface IExportService {
  generatePdf(options: ExportReportOptions): Promise<string>; // Returns URI of created PDF
  generateCsv(records: HealthRecord[]): Promise<string>; // Returns CSV content or URI
  shareFile(fileUri: string, mimeType: string, dialogTitle: string): Promise<void>;
}
