import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { HealthRecord, isBloodPressureRecord, isBloodGlucoseRecord } from '../../domain/models/HealthRecord';
import { StatusBadge } from './StatusBadge';
import { formatTimeOnly, formatDateOnly, formatBloodPressure, formatGlucose, formatPulse } from '../../core/utils/formatters';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';

interface SummaryCardProps {
  title: string;
  type: 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE';
  latestRecord?: HealthRecord;
  onPressAction?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  type,
  latestRecord,
  onPressAction,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const isBp = type === 'BLOOD_PRESSURE';

  const mealTagLabels: Record<string, string> = {
    FASTING: t.verification.fasting,
    BEFORE_MEAL: t.verification.preMeal,
    POSTPRANDIAL: t.verification.postMeal,
    RANDOM: t.verification.random,
    BEDTIME: t.verification.bedtime,
  };

  const iconBg = isBp
    ? isDark ? 'rgba(244, 63, 94, 0.2)' : colors.pulseLight
    : isDark ? 'rgba(245, 158, 11, 0.2)' : colors.glucoseLight;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Text style={styles.iconText}>{isBp ? '❤️' : '🩸'}</Text>
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              {latestRecord
                ? `${formatDateOnly(latestRecord.timestamp)} • ${formatTimeOnly(latestRecord.timestamp)}`
                : t.dashboard.noRecentReadings}
            </Text>
          </View>
        </View>

        {latestRecord && <StatusBadge status={latestRecord.status} size="small" />}
      </View>

      {latestRecord ? (
        <View style={styles.body}>
          <View style={styles.valueRow}>
            {isBloodPressureRecord(latestRecord) && (
              <>
                <Text style={[styles.primaryValue, { color: colors.textPrimary }]}>
                  {Math.round(latestRecord.systolic)}/{Math.round(latestRecord.diastolic)}
                </Text>
                <Text style={[styles.unitText, { color: colors.textSecondary }]}>mmHg</Text>
              </>
            )}

            {isBloodGlucoseRecord(latestRecord) && (
              <>
                <Text style={[styles.primaryValue, { color: colors.textPrimary }]}>
                  {latestRecord.unit === 'mmol/L'
                    ? latestRecord.glucoseValue.toFixed(1)
                    : Math.round(latestRecord.glucoseValue)}
                </Text>
                <Text style={[styles.unitText, { color: colors.textSecondary }]}>{latestRecord.unit}</Text>
              </>
            )}
          </View>

          <View style={styles.metaRow}>
            {isBloodPressureRecord(latestRecord) && (
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {t.dashboard.pulseBpm}: {formatPulse(latestRecord.pulse)}
                </Text>
              </View>
            )}

            {isBloodGlucoseRecord(latestRecord) && (
              <View style={[styles.metaPill, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {mealTagLabels[latestRecord.mealTag] || latestRecord.mealTag}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.sourcePill,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                {latestRecord.source === 'OCR_AUTO'
                  ? `📷 ${t.verification.onDeviceOcr}`
                  : latestRecord.source === 'OCR_FALLBACK'
                  ? `✨ ${t.verification.visionAiFallback}`
                  : `✍️ ${t.verification.manualVerification}`}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyPrompt, { color: colors.textSecondary }]}>
            {t.dashboard.scanDevicePrompt}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  body: {
    marginTop: SPACING.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  primaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metaPill: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sourcePill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  sourceText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyBody: {
    paddingVertical: SPACING.sm,
  },
  emptyPrompt: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
