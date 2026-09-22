import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { IExportService, ExportReportOptions } from '../../domain/services/IExportService';
import { HealthRecord, isBloodPressureRecord, isBloodGlucoseRecord } from '../../domain/models/HealthRecord';
import { formatDateTime, formatBloodPressure, formatGlucose, formatPulse } from '../../core/utils/formatters';

export class PdfExportService implements Partial<IExportService> {
  /**
   * Generates a medical PDF report from health records
   */
  public async generatePdf(options: ExportReportOptions): Promise<string> {
    const { records, summary, patientName = 'Health Tracker User', dateRangeLabel } = options;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PulseGluco Medical Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E293B;
      padding: 32px;
      line-height: 1.5;
      background-color: #FFFFFF;
    }
    .header {
      border-bottom: 2px solid #0D9488;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #0D9488;
      margin: 0;
    }
    .report-subtitle {
      font-size: 14px;
      color: #64748B;
      margin-top: 4px;
    }
    .meta-box {
      text-align: right;
      font-size: 13px;
      color: #475569;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .summary-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 16px;
    }
    .summary-card h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 16px;
      color: #0F766E;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dotted #E2E8F0;
      font-size: 13px;
    }
    .table-container {
      margin-top: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background-color: #0D9488;
      color: white;
      text-align: left;
      padding: 10px;
      font-weight: 600;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #E2E8F0;
    }
    tr:nth-child(even) td {
      background-color: #F8FAFC;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #E2E8F0;
      padding-top: 12px;
      font-size: 11px;
      color: #94A3B8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">PulseGluco Health Report</h1>
      <div class="report-subtitle">Personal Blood Pressure & Blood Glucose Logbook</div>
    </div>
    <div class="meta-box">
      <div><strong>Patient:</strong> ${patientName}</div>
      <div><strong>Period:</strong> ${dateRangeLabel}</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <h3>Blood Pressure Overview</h3>
      ${
        summary.bpSummary
          ? `
        <div class="stat-row"><span>Total Readings:</span> <strong>${summary.bpSummary.count}</strong></div>
        <div class="stat-row"><span>Average:</span> <strong>${Math.round(summary.bpSummary.avgSystolic)}/${Math.round(summary.bpSummary.avgDiastolic)} mmHg</strong></div>
        <div class="stat-row"><span>Min - Max (SYS):</span> <strong>${summary.bpSummary.minSystolic} - ${summary.bpSummary.maxSystolic} mmHg</strong></div>
        <div class="stat-row"><span>Average Pulse:</span> <strong>${summary.bpSummary.avgPulse ? Math.round(summary.bpSummary.avgPulse) + ' bpm' : 'N/A'}</strong></div>
        <div class="stat-row"><span>Normal Readings:</span> <strong>${summary.bpSummary.normalCount} (${Math.round((summary.bpSummary.normalCount / summary.bpSummary.count) * 100)}%)</strong></div>
      `
          : '<p style="color:#64748B;font-size:13px;">No Blood Pressure readings recorded.</p>'
      }
    </div>

    <div class="summary-card">
      <h3>Blood Glucose Overview</h3>
      ${
        summary.glucoseSummary
          ? `
        <div class="stat-row"><span>Total Readings:</span> <strong>${summary.glucoseSummary.count}</strong></div>
        <div class="stat-row"><span>Average Glucose:</span> <strong>${Math.round(summary.glucoseSummary.avgGlucoseMgDl)} mg/dL</strong></div>
        <div class="stat-row"><span>Min - Max:</span> <strong>${summary.glucoseSummary.minGlucoseMgDl} - ${summary.glucoseSummary.maxGlucoseMgDl} mg/dL</strong></div>
        <div class="stat-row"><span>Fasting Readings:</span> <strong>${summary.glucoseSummary.fastingCount}</strong></div>
        <div class="stat-row"><span>Normal Range:</span> <strong>${summary.glucoseSummary.normalCount} (${Math.round((summary.glucoseSummary.normalCount / summary.glucoseSummary.count) * 100)}%)</strong></div>
      `
          : '<p style="color:#64748B;font-size:13px;">No Blood Glucose readings recorded.</p>'
      }
    </div>
  </div>

  <div class="table-container">
    <h3>Detailed Log (${records.length} records)</h3>
    <table>
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Measurement Type</th>
          <th>Primary Value</th>
          <th>Secondary / Tag</th>
          <th>WHO / ADA Status</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        ${records
          .map((r) => {
            if (isBloodPressureRecord(r)) {
              return `
                <tr>
                  <td>${formatDateTime(r.timestamp)}</td>
                  <td><strong>Blood Pressure</strong></td>
                  <td>${formatBloodPressure(r.systolic, r.diastolic)}</td>
                  <td>${formatPulse(r.pulse)}</td>
                  <td>
                    <span class="badge" style="background-color: ${r.status.backgroundColor}; color: ${r.status.color};">
                      ${r.status.label}
                    </span>
                  </td>
                  <td>${r.source}</td>
                </tr>
              `;
            } else if (isBloodGlucoseRecord(r)) {
              return `
                <tr>
                  <td>${formatDateTime(r.timestamp)}</td>
                  <td><strong>Blood Glucose</strong></td>
                  <td>${formatGlucose(r.glucoseValue, r.unit)}</td>
                  <td>${r.mealTag}</td>
                  <td>
                    <span class="badge" style="background-color: ${r.status.backgroundColor}; color: ${r.status.color};">
                      ${r.status.label}
                    </span>
                  </td>
                  <td>${r.source}</td>
                </tr>
              `;
            }
            return '';
          })
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    PulseGluco • Confidential Medical Tracking Document • Keep for your physician consultations
  </div>
</body>
</html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    return uri;
  }

  public async sharePdf(pdfUri: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this platform/device');
    }
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share PulseGluco Health Report',
      UTI: 'com.adobe.pdf',
    });
  }
}

export const pdfExportService = new PdfExportService();
