import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { ColorTheme, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { useTheme } from '../../core/theme/useTheme';
import { useHealthStore } from '../state/useHealthStore';
import { TrendChart } from '../components/TrendChart';
import { useTranslation } from '../../core/i18n/useTranslation';

export const AnalyticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { analytics, selectedDaysRange, loadAnalytics, isLoading } = useHealthStore();
  const [metricTab, setMetricTab] = useState<'BP' | 'GLUCOSE'>('BP');

  useEffect(() => {
    loadAnalytics(selectedDaysRange);
  }, [selectedDaysRange]);

  const ranges: (7 | 14 | 30 | 90)[] = [7, 14, 30, 90];

  const bpSummary = analytics?.summary?.bpSummary;
  const glucoseSummary = analytics?.summary?.glucoseSummary;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadAnalytics(selectedDaysRange)} />
        }
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.analytics.title}</Text>
          <Text style={styles.subtitle}>{t.analytics.subtitle}</Text>
        </View>

        {/* Time Period Selector Tabs */}
        <View style={styles.rangeSelector}>
          {ranges.map((days) => (
            <TouchableOpacity
              key={days}
              style={[styles.rangeTab, selectedDaysRange === days && styles.rangeTabActive]}
              onPress={() => loadAnalytics(days)}
            >
              <Text
                style={[styles.rangeTabText, selectedDaysRange === days && styles.rangeTabTextActive]}
              >
                {days} {t.analytics.days}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Metric Switcher (Blood Pressure vs Blood Glucose) */}
        <View style={styles.metricSwitcher}>
          <TouchableOpacity
            style={[styles.metricSwitchBtn, metricTab === 'BP' && styles.metricSwitchBtnActive]}
            onPress={() => setMetricTab('BP')}
          >
            <Text
              style={[styles.metricSwitchText, metricTab === 'BP' && styles.metricSwitchTextActive]}
            >
              {t.analytics.bloodPressureTab}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.metricSwitchBtn, metricTab === 'GLUCOSE' && styles.metricSwitchBtnActive]}
            onPress={() => setMetricTab('GLUCOSE')}
          >
            <Text
              style={[styles.metricSwitchText, metricTab === 'GLUCOSE' && styles.metricSwitchTextActive]}
            >
              {t.analytics.bloodGlucoseTab}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Trend Chart */}
        {metricTab === 'BP' ? (
          <View style={styles.chartSection}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.sectionHeading}>{t.analytics.bpHeading}</Text>
              <Text style={styles.chartSubheading}>{t.analytics.bpSubheading}</Text>
            </View>
            <TrendChart
              type="BLOOD_PRESSURE"
              data={analytics?.bpChartData || []}
            />

            {/* Key Statistics Grid */}
            <Text style={[styles.sectionHeading, { marginTop: SPACING.lg }]}>{t.analytics.bpStatsSummary}</Text>
            {bpSummary ? (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.avgBp}</Text>
                  <Text style={styles.statValue}>
                    {bpSummary.avgSystolic}/{bpSummary.avgDiastolic}
                  </Text>
                  <Text style={styles.statUnit}>mmHg</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.minMaxSys}</Text>
                  <Text style={styles.statValue}>
                    {bpSummary.minSystolic} - {bpSummary.maxSystolic}
                  </Text>
                  <Text style={styles.statUnit}>mmHg</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.avgPulse}</Text>
                  <Text style={styles.statValue}>{bpSummary.avgPulse || '--'}</Text>
                  <Text style={styles.statUnit}>bpm</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.inTargetNormal}</Text>
                  <Text style={[styles.statValue, { color: colors.statusNormal }]}>
                    {Math.round((bpSummary.normalCount / bpSummary.count) * 100)}%
                  </Text>
                  <Text style={styles.statUnit}>{bpSummary.normalCount} / {bpSummary.count} logs</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyPrompt}>{t.analytics.noRecordsPeriod}</Text>
            )}

            {/* WHO Stage Distribution Breakdown */}
            {bpSummary && (
              <View style={styles.distributionCard}>
                <Text style={styles.distTitle}>{t.analytics.whoDistribution}</Text>
                <View style={styles.distBar}>
                  <View
                    style={{
                      flex: bpSummary.normalCount || 0.1,
                      backgroundColor: colors.statusNormal,
                      height: 12,
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                    }}
                  />
                  <View
                    style={{
                      flex: bpSummary.elevatedCount || 0.1,
                      backgroundColor: colors.statusElevated,
                      height: 12,
                    }}
                  />
                  <View
                    style={{
                      flex: bpSummary.stage1Count || 0.1,
                      backgroundColor: colors.statusStage1,
                      height: 12,
                    }}
                  />
                  <View
                    style={{
                      flex: bpSummary.stage2Count || 0.1,
                      backgroundColor: colors.statusStage2,
                      height: 12,
                      borderTopRightRadius: 6,
                      borderBottomRightRadius: 6,
                    }}
                  />
                </View>

                <View style={styles.distLegendGrid}>
                  <View style={styles.distLegendItem}>
                    <View style={[styles.distDot, { backgroundColor: colors.statusNormal }]} />
                    <Text style={styles.distText}>{t.status.normal}: {bpSummary.normalCount}</Text>
                  </View>
                  <View style={styles.distLegendItem}>
                    <View style={[styles.distDot, { backgroundColor: colors.statusElevated }]} />
                    <Text style={styles.distText}>{t.status.elevated}: {bpSummary.elevatedCount}</Text>
                  </View>
                  <View style={styles.distLegendItem}>
                    <View style={[styles.distDot, { backgroundColor: colors.statusStage1 }]} />
                    <Text style={styles.distText}>{t.status.stage1}: {bpSummary.stage1Count}</Text>
                  </View>
                  <View style={styles.distLegendItem}>
                    <View style={[styles.distDot, { backgroundColor: colors.statusStage2 }]} />
                    <Text style={styles.distText}>{t.status.stage2}: {bpSummary.stage2Count}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.chartSection}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.sectionHeading}>{t.analytics.glucoseHeading}</Text>
              <Text style={styles.chartSubheading}>{t.analytics.glucoseSubheading}</Text>
            </View>
            <TrendChart
              type="BLOOD_GLUCOSE"
              data={analytics?.glucoseChartData || []}
            />

            {/* Glucose Statistics Grid */}
            <Text style={[styles.sectionHeading, { marginTop: SPACING.lg }]}>{t.analytics.glucoseSummary}</Text>
            {glucoseSummary ? (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.avgGlucose}</Text>
                  <Text style={styles.statValue}>{glucoseSummary.avgGlucoseMgDl}</Text>
                  <Text style={styles.statUnit}>mg/dL</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.minMaxGlucose}</Text>
                  <Text style={styles.statValue}>
                    {glucoseSummary.minGlucoseMgDl} - {glucoseSummary.maxGlucoseMgDl}
                  </Text>
                  <Text style={styles.statUnit}>mg/dL</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.fastingCount}</Text>
                  <Text style={styles.statValue}>{glucoseSummary.fastingCount}</Text>
                  <Text style={styles.statUnit}>measurements</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>{t.analytics.glucoseNormalRange}</Text>
                  <Text style={[styles.statValue, { color: colors.statusNormal }]}>
                    {Math.round((glucoseSummary.normalCount / glucoseSummary.count) * 100)}%
                  </Text>
                  <Text style={styles.statUnit}>{glucoseSummary.normalCount} / {glucoseSummary.count} logs</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyPrompt}>{t.analytics.noRecordsPeriod}</Text>
            )}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: SPACING.lg,
    },
    header: {
      paddingTop: SPACING.md,
      paddingBottom: SPACING.sm,
    },
    title: {
      fontSize: TYPOGRAPHY.fontSizes.xxl,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rangeSelector: {
      flexDirection: 'row',
      gap: SPACING.xs,
      marginVertical: SPACING.md,
    },
    rangeTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
    },
    rangeTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rangeTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    rangeTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    metricSwitcher: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: RADIUS.md,
      padding: 3,
      marginBottom: SPACING.md,
    },
    metricSwitchBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: RADIUS.sm,
    },
    metricSwitchBtnActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    metricSwitchText: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    metricSwitchTextActive: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    chartSection: {
      marginTop: SPACING.xs,
    },
    chartHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: SPACING.xs,
    },
    sectionHeading: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
    },
    chartSubheading: {
      fontSize: 11,
      color: colors.textMuted,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
      marginTop: SPACING.xs,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 4,
    },
    statUnit: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    distributionCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginTop: SPACING.md,
    },
    distTitle: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    distBar: {
      flexDirection: 'row',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: SPACING.md,
    },
    distLegendGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
    },
    distLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    distDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    distText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    emptyPrompt: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: SPACING.xs,
    },
  });
