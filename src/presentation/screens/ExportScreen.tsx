import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ColorTheme, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { useTheme } from '../../core/theme/useTheme';
import { useHealthStore } from '../state/useHealthStore';
import { pdfExportService } from '../../data/services/PdfExportService';
import { csvExportService } from '../../data/services/CsvExportService';
import { useTranslation } from '../../core/i18n/useTranslation';

export const ExportScreen: React.FC = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { records, analytics, selectedDaysRange } = useHealthStore();
  const [patientName, setPatientName] = useState('Patient 01');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const handleExportPdf = async () => {
    if (records.length === 0) {
      Alert.alert(t.common.error, t.export.noRecordsExport);
      return;
    }

    setIsExportingPdf(true);
    try {
      const summary = analytics?.summary || {
        totalReadings: records.length,
      };

      const pdfUri = await pdfExportService.generatePdf({
        records,
        summary,
        patientName,
        dateRangeLabel: `${selectedDaysRange} ${t.analytics.days}`,
      });

      await pdfExportService.sharePdf(pdfUri);
    } catch (err: any) {
      console.error('PDF export error:', err);
      Alert.alert(t.common.error, err?.message || 'Could not generate PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    if (records.length === 0) {
      Alert.alert(t.common.error, t.export.noRecordsExport);
      return;
    }

    setIsExportingCsv(true);
    try {
      await csvExportService.exportAndShareCsv(records);
    } catch (err: any) {
      console.error('CSV export error:', err);
      Alert.alert(t.common.error, err?.message || 'Could not generate CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.export.title}</Text>
          <Text style={styles.subtitle}>{t.export.subtitle}</Text>
        </View>

        {/* Patient Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.export.reportDetails}</Text>
          <Text style={styles.inputLabel}>{t.export.patientName}</Text>
          <TextInput
            style={styles.textInput}
            value={patientName}
            onChangeText={setPatientName}
            placeholder={t.export.patientPlaceholder}
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.summaryMetaRow}>
            <View style={styles.summaryMetaCol}>
              <Text style={styles.metaColLabel}>{t.export.totalMeasurements}</Text>
              <Text style={styles.metaColValue}>{records.length}</Text>
            </View>
            <View style={styles.summaryMetaCol}>
              <Text style={styles.metaColLabel}>{t.export.coveragePeriod}</Text>
              <Text style={styles.metaColValue}>{selectedDaysRange} {t.analytics.days}</Text>
            </View>
          </View>
        </View>

        {/* PDF Doctor Report Option */}
        <View style={styles.exportOptionCard}>
          <View style={styles.exportOptionHeader}>
            <View style={[styles.exportIconBox, { backgroundColor: isDark ? 'rgba(13, 148, 136, 0.25)' : '#CCFBF1' }]}>
              <Text style={styles.exportIcon}>📄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportOptionTitle}>{t.export.pdfTitle}</Text>
              <Text style={styles.exportOptionDesc}>
                {t.export.pdfDesc}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, isExportingPdf && styles.actionBtnDisabled]}
            onPress={handleExportPdf}
            disabled={isExportingPdf}
          >
            {isExportingPdf ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionBtnText}>{t.export.generatePdf}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* CSV Data Export Option */}
        <View style={styles.exportOptionCard}>
          <View style={styles.exportOptionHeader}>
            <View style={[styles.exportIconBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7' }]}>
              <Text style={styles.exportIcon}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportOptionTitle}>{t.export.csvTitle}</Text>
              <Text style={styles.exportOptionDesc}>
                {t.export.csvDesc}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary, isExportingCsv && styles.actionBtnDisabled]}
            onPress={handleExportCsv}
            disabled={isExportingCsv}
          >
            {isExportingCsv ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.actionBtnTextSecondary}>{t.export.exportCsv}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* HIPAA & Privacy Notice */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>{t.export.privacyNotice}</Text>
          <Text style={styles.privacyText}>
            {t.export.privacyBody}
          </Text>
        </View>

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
      paddingBottom: SPACING.md,
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: SPACING.md,
    },
    cardTitle: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: SPACING.sm,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    textInput: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      fontSize: TYPOGRAPHY.fontSizes.sm,
      color: colors.textPrimary,
    },
    summaryMetaRow: {
      flexDirection: 'row',
      marginTop: SPACING.md,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
    },
    summaryMetaCol: {
      flex: 1,
    },
    metaColLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    metaColValue: {
      fontSize: TYPOGRAPHY.fontSizes.md,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
    },
    exportOptionCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: SPACING.md,
    },
    exportOptionHeader: {
      flexDirection: 'row',
      gap: SPACING.md,
      marginBottom: SPACING.md,
    },
    exportIconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    exportIcon: {
      fontSize: 22,
    },
    exportOptionTitle: {
      fontSize: TYPOGRAPHY.fontSizes.md,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    exportOptionDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      marginTop: 4,
    },
    actionBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnSecondary: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionBtnDisabled: {
      opacity: 0.6,
    },
    actionBtnText: {
      color: '#FFFFFF',
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '700',
    },
    actionBtnTextSecondary: {
      color: isDark ? colors.primaryLight : colors.primary,
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '700',
    },
    privacyCard: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginTop: SPACING.xs,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    privacyTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    privacyText: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
    },
  });
