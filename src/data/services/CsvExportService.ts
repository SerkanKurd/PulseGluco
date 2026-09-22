import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { HealthRecord, isBloodPressureRecord, isBloodGlucoseRecord } from '../../domain/models/HealthRecord';

export class CsvExportService {
  /**
   * Generates CSV format string from health records
   */
  public generateCsvContent(records: HealthRecord[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'Device_Type',
      'Systolic_mmHg',
      'Diastolic_mmHg',
      'Pulse_bpm',
      'Glucose_Value',
      'Glucose_Unit',
      'Meal_Tag',
      'Status_Classification',
      'Source',
      'Notes',
    ];

    const rows = records.map((r) => {
      const id = `"${r.id}"`;
      const timestamp = `"${r.timestamp}"`;
      const deviceType = `"${r.deviceType}"`;
      const source = `"${r.source}"`;
      const notes = `"${(r.notes || '').replace(/"/g, '""')}"`;
      const status = `"${r.status.label}"`;

      if (isBloodPressureRecord(r)) {
        return [
          id,
          timestamp,
          deviceType,
          r.systolic,
          r.diastolic,
          r.pulse || '',
          '',
          '',
          '',
          status,
          source,
          notes,
        ].join(',');
      } else if (isBloodGlucoseRecord(r)) {
        return [
          id,
          timestamp,
          deviceType,
          '',
          '',
          '',
          r.glucoseValue,
          `"${r.unit}"`,
          `"${r.mealTag}"`,
          status,
          source,
          notes,
        ].join(',');
      }
      return '';
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Saves CSV file to document directory and opens share dialog
   */
  public async exportAndShareCsv(records: HealthRecord[]): Promise<string> {
    const csvContent = this.generateCsvContent(records);
    const fileName = `PulseGluco_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    const filePath = `${FileSystem.documentDirectory || ''}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Health Records (CSV)',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return filePath;
  }
}

export const csvExportService = new CsvExportService();
