import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, ColorTheme } from '../../core/constants/theme';
import { useHealthStore } from '../state/useHealthStore';
import { SummaryCard } from '../components/SummaryCard';
import { StatusBadge } from '../components/StatusBadge';
import { VerificationModal } from '../components/VerificationModal';
import {
  isBloodPressureRecord,
  isBloodGlucoseRecord,
  HealthRecord,
} from '../../domain/models/HealthRecord';
import {
  formatDateTime,
  formatBloodPressure,
  formatGlucose,
  formatPulse,
} from '../../core/utils/formatters';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';

export const DashboardScreen: React.FC = () => {
  const {
    records,
    isLoading,
    activeFilter,
    loadRecords,
    loadAnalytics,
    setActiveFilter,
    setActiveTab,
    deleteRecord,
    resetToDemoData,
    openManualEntry,
    verification,
    updateVerificationField,
    confirmAndSaveVerification,
    dismissVerification,
  } = useHealthStore();

  const { t, locale, setLocale } = useTranslation();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const mealTagLabels: Record<string, string> = {
    FASTING: t.verification.fasting,
    BEFORE_MEAL: t.verification.preMeal,
    POSTPRANDIAL: t.verification.postMeal,
    RANDOM: t.verification.random,
    BEDTIME: t.verification.bedtime,
  };

  useEffect(() => {
    loadRecords();
    loadAnalytics();
  }, []);

  const latestBp = records.find(isBloodPressureRecord);
  const latestGlucose = records.find(isBloodGlucoseRecord);

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'BLOOD_PRESSURE') return isBloodPressureRecord(r);
    if (activeFilter === 'BLOOD_GLUCOSE') return isBloodGlucoseRecord(r);
    return true;
  });

  const handleDelete = (id: string) => {
    Alert.alert(t.common.deleteConfirmTitle, t.common.deleteConfirmMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: () => deleteRecord(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadRecords} />}
      >
        {/* App Bar Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>PulseGluco</Text>
            <Text style={styles.brandSubtitle}>{t.common.appSubtitle}</Text>
          </View>
          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={styles.themeButtonText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.langButton}
              onPress={() => setLocale(locale === 'tr' ? 'en' : 'tr')}
            >
              <Text style={styles.langButtonText}>
                {locale === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoButton}
              onPress={resetToDemoData}
            >
              <Text style={styles.demoButtonText}>{t.common.resetDemoData}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Primary Hero Action: One-Tap Scan Device */}
        <TouchableOpacity
          style={styles.scanHeroButton}
          activeOpacity={0.88}
          onPress={() => setActiveTab('camera')}
        >
          <View style={styles.scanHeroIconCircle}>
            <Text style={styles.scanHeroIcon}>📷</Text>
          </View>
          <View style={styles.scanHeroTextContainer}>
            <Text style={styles.scanHeroTitle}>{t.dashboard.scanHeroTitle}</Text>
            <Text style={styles.scanHeroSubtitle}>
              {t.dashboard.scanHeroSubtitle}
            </Text>
          </View>
          <View style={styles.scanHeroArrow}>
            <Text style={styles.scanHeroArrowText}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Manual Entry Actions */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => openManualEntry('BLOOD_PRESSURE')}
          >
            <Text style={styles.quickActionBtnText}>{t.dashboard.logBpManually}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => openManualEntry('BLOOD_GLUCOSE')}
          >
            <Text style={styles.quickActionBtnText}>{t.dashboard.logGlucoseManually}</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Latest Measurements Overview */}
        <Text style={styles.sectionHeader}>{t.dashboard.latestReadings}</Text>
        <SummaryCard
          title={t.common.bp}
          type="BLOOD_PRESSURE"
          latestRecord={latestBp}
        />
        <SummaryCard
          title={t.common.glucose}
          type="BLOOD_GLUCOSE"
          latestRecord={latestGlucose}
        />

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionHeader}>{t.dashboard.logbook}</Text>
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
              onPress={() => setActiveFilter('ALL')}
            >
              <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>
                {t.common.all} ({records.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'BLOOD_PRESSURE' && styles.filterTabActive]}
              onPress={() => setActiveFilter('BLOOD_PRESSURE')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'BLOOD_PRESSURE' && styles.filterTabTextActive,
                ]}
              >
                {t.common.bp} ({records.filter(isBloodPressureRecord).length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterTab, activeFilter === 'BLOOD_GLUCOSE' && styles.filterTabActive]}
              onPress={() => setActiveFilter('BLOOD_GLUCOSE')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === 'BLOOD_GLUCOSE' && styles.filterTabTextActive,
                ]}
              >
                {t.common.glucose} ({records.filter(isBloodGlucoseRecord).length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chronological List of Records */}
        <View style={styles.recordsList}>
          {filteredRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.dashboard.noReadingsFilter}</Text>
            </View>
          ) : (
            filteredRecords.map((record: HealthRecord) => (
              <View key={record.id} style={styles.recordItem}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordTypeTag}>
                    <Text style={styles.recordTypeIcon}>
                      {isBloodPressureRecord(record) ? '❤️' : '🩸'}
                    </Text>
                    <Text style={styles.recordTypeName}>
                      {isBloodPressureRecord(record) ? t.common.bp : t.common.glucose}
                    </Text>
                  </View>
                  <Text style={styles.recordTime}>{formatDateTime(record.timestamp)}</Text>
                </View>

                <View style={styles.recordValuesRow}>
                  <View style={styles.mainValueBox}>
                    <Text style={styles.recordPrimaryNum}>
                      {isBloodPressureRecord(record)
                        ? formatBloodPressure(record.systolic, record.diastolic)
                        : formatGlucose(record.glucoseValue, record.unit)}
                    </Text>
                    <Text style={styles.recordSecondarySub}>
                      {isBloodPressureRecord(record)
                        ? `${t.dashboard.pulseBpm}: ${formatPulse(record.pulse)}`
                        : `${t.verification.mealContext}: ${mealTagLabels[record.mealTag] || record.mealTag}`}
                    </Text>
                  </View>

                  <View style={styles.recordStatusCol}>
                    <StatusBadge status={record.status} size="small" />
                    <TouchableOpacity
                      onPress={() => handleDelete(record.id)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {record.notes && (
                  <Text style={styles.recordNotes} numberOfLines={1}>
                    💬 {record.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Verification Modal for manual entries */}
      <VerificationModal
        verification={verification}
        onUpdateField={updateVerificationField}
        onConfirm={confirmAndSaveVerification}
        onDismiss={dismissVerification}
        isLoading={isLoading}
      />
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: SPACING.md,
      paddingBottom: SPACING.lg,
    },
    brandTitle: {
      fontSize: TYPOGRAPHY.fontSizes.xxl,
      fontWeight: '800',
      color: colors.primaryLight,
      letterSpacing: -0.5,
    },
    brandSubtitle: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerRightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    themeButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    themeButtonText: {
      fontSize: 13,
    },
    langButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: isDark ? colors.surfaceSubtle : colors.primaryLight,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: isDark ? colors.surfaceBorder : colors.primary,
    },
    langButtonText: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? colors.textPrimary : colors.primaryDark,
    },
    demoButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: colors.surfaceSubtle,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    demoButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    scanHeroButton: {
      backgroundColor: colors.primary,
      borderRadius: RADIUS.xl,
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.md,
      marginBottom: SPACING.xl,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
    scanHeroIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.md,
    },
    scanHeroIcon: {
      fontSize: 26,
    },
    scanHeroTextContainer: {
      flex: 1,
    },
    scanHeroTitle: {
      fontSize: TYPOGRAPHY.fontSizes.lg,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    scanHeroSubtitle: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      color: '#CCFBF1',
      marginTop: 2,
    },
    scanHeroArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanHeroArrowText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    quickActionRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
      marginTop: -SPACING.md,
    },
    quickActionBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    quickActionBtnText: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      fontWeight: '700',
      color: colors.primaryLight,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: SPACING.sm,
      marginTop: SPACING.xs,
    },
    filterSection: {
      marginTop: SPACING.md,
    },
    filterTabs: {
      flexDirection: 'row',
      gap: SPACING.xs,
      marginBottom: SPACING.md,
    },
    filterTab: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    filterTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterTabText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    filterTabTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    recordsList: {
      paddingBottom: 48,
    },
    recordItem: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    recordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    recordTypeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    recordTypeIcon: {
      fontSize: 12,
    },
    recordTypeName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    recordTime: {
      fontSize: 11,
      color: colors.textMuted,
    },
    recordValuesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
    },
    mainValueBox: {
      flex: 1,
    },
    recordPrimaryNum: {
      fontSize: TYPOGRAPHY.fontSizes.xl,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    recordSecondarySub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    recordStatusCol: {
      alignItems: 'flex-end',
      gap: 6,
    },
    deleteBtn: {
      padding: 4,
    },
    deleteBtnText: {
      fontSize: 14,
    },
    recordNotes: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: SPACING.xs,
      fontStyle: 'italic',
    },
    emptyCard: {
      padding: SPACING.xl,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: TYPOGRAPHY.fontSizes.sm,
    },
  });
