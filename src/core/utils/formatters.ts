/**
 * Formatting utilities for medical values, dates, and units
 */

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateOnly(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatBloodPressure(systolic: number, diastolic: number): string {
  return `${Math.round(systolic)}/${Math.round(diastolic)} mmHg`;
}

export function formatPulse(pulse?: number): string {
  return pulse ? `${Math.round(pulse)} bpm` : '-- bpm';
}

export function formatGlucose(value: number, unit: 'mg/dL' | 'mmol/L'): string {
  const formattedVal = unit === 'mmol/L' ? value.toFixed(1) : Math.round(value).toString();
  return `${formattedVal} ${unit}`;
}

export function convertGlucose(
  value: number,
  fromUnit: 'mg/dL' | 'mmol/L',
  toUnit: 'mg/dL' | 'mmol/L'
): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
    return Number((value / 18.0182).toFixed(1));
  }
  return Math.round(value * 18.0182);
}
