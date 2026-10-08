import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ColorTheme, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { useTheme } from '../../core/theme/useTheme';
import { StatusBadge } from './StatusBadge';
import { VerificationState } from '../state/useHealthStore';
import { classifyBloodPressure, classifyBloodGlucose, classifyPulse } from '../../core/constants/medical-thresholds';
import { GlucoseUnit, MealTag } from '../../domain/models/HealthRecord';
import { useTranslation } from '../../core/i18n/useTranslation';

interface VerificationModalProps {
  verification: VerificationState;
  onUpdateField: <K extends keyof VerificationState>(field: K, value: VerificationState[K]) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  isLoading: boolean;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  verification,
  onUpdateField,
  onConfirm,
  onDismiss,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const isBp = verification.deviceType === 'BLOOD_PRESSURE';
  const isPulse = verification.deviceType === 'PULSE';

  // Compute live status preview based on current editable inputs
  const currentStatus = isBp
    ? classifyBloodPressure(verification.systolic || 0, verification.diastolic || 0)
    : isPulse
    ? classifyPulse(verification.pulse || 72)
    : classifyBloodGlucose(verification.glucoseValue || 0, verification.unit, verification.mealTag);

  return (
    <Modal
      visible={verification.isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t.verification.title}</Text>
              <Text style={styles.subtitle}>
                {isBp
                  ? t.verification.bpSubtitle
                  : isPulse
                  ? t.verification.pulseSubtitle
                  : t.verification.glucoseSubtitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Device Type Switcher */}
          <View style={styles.deviceTypeSelector}>
            <TouchableOpacity
              style={[styles.deviceTypeBtn, isBp && styles.deviceTypeBtnActive]}
              onPress={() => onUpdateField('deviceType', 'BLOOD_PRESSURE')}
            >
              <Text style={[styles.deviceTypeBtnText, isBp && styles.deviceTypeBtnTextActive]}>
                ❤️ {t.common.bp}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deviceTypeBtn, !isBp && !isPulse && styles.deviceTypeBtnActive]}
              onPress={() => onUpdateField('deviceType', 'BLOOD_GLUCOSE')}
            >
              <Text style={[styles.deviceTypeBtnText, !isBp && !isPulse && styles.deviceTypeBtnTextActive]}>
                🩸 {t.common.glucose}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deviceTypeBtn, isPulse && styles.deviceTypeBtnActive]}
              onPress={() => onUpdateField('deviceType', 'PULSE')}
            >
              <Text style={[styles.deviceTypeBtnText, isPulse && styles.deviceTypeBtnTextActive]}>
                💓 {t.common.pulse}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Device Screen Preview & Confidence Row */}
            <View style={styles.previewContainer}>
              {verification.capturedImageUri ? (
                <Image
                  source={{ uri: verification.capturedImageUri }}
                  style={styles.screenImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>{t.verification.screenPreview}</Text>
                </View>
              )}

              <View style={styles.confidenceBadgeContainer}>
                <View
                  style={[
                    styles.confidenceIndicator,
                    {
                      backgroundColor:
                        verification.confidence >= 0.8
                          ? '#10B981'
                          : verification.confidence >= 0.5
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                />
                <Text style={styles.confidenceText}>
                  {verification.confidence > 0
                    ? `${Math.round(verification.confidence * 100)}% ${t.verification.confidenceMatch} (${
                        verification.usedFallback ? t.verification.visionAiFallback : t.verification.onDeviceOcr
                      })`
                    : t.verification.manualVerification}
                </Text>
              </View>
            </View>

            {/* Live Medical Status Preview */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionLabel}>{t.verification.whoClassification}</Text>
              <StatusBadge status={currentStatus} size="medium" showDescription={true} />
            </View>

            {/* Editable Fields Section */}
            {isBp ? (
              <View style={styles.inputsGrid}>
                {/* Systolic */}
                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>{t.verification.sys}</Text>
                  <TextInput
                    style={styles.numericInput}
                    keyboardType="number-pad"
                    placeholder="120"
                    placeholderTextColor={colors.textMuted}
                    value={verification.systolic ? verification.systolic.toString() : ''}
                    onChangeText={(val) => onUpdateField('systolic', parseInt(val.replace(/[^0-9]/g, ''), 10) || 0)}
                  />
                  <Text style={styles.inputSubtext}>SYS</Text>
                </View>

                {/* Diastolic */}
                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>{t.verification.dia}</Text>
                  <TextInput
                    style={styles.numericInput}
                    keyboardType="number-pad"
                    placeholder="80"
                    placeholderTextColor={colors.textMuted}
                    value={verification.diastolic ? verification.diastolic.toString() : ''}
                    onChangeText={(val) => onUpdateField('diastolic', parseInt(val.replace(/[^0-9]/g, ''), 10) || 0)}
                  />
                  <Text style={styles.inputSubtext}>DIA</Text>
                </View>

                {/* Pulse */}
                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>{t.verification.pulse}</Text>
                  <TextInput
                    style={styles.numericInput}
                    keyboardType="number-pad"
                    placeholder="72"
                    placeholderTextColor={colors.textMuted}
                    value={verification.pulse ? verification.pulse.toString() : ''}
                    onChangeText={(val) => onUpdateField('pulse', parseInt(val.replace(/[^0-9]/g, ''), 10) || 0)}
                  />
                  <Text style={styles.inputSubtext}>BPM</Text>
                </View>
              </View>
            ) : isPulse ? (
              <View style={styles.glucoseSection}>
                <View style={styles.glucoseValueCard}>
                  <Text style={styles.inputLabel}>{t.verification.pulse}</Text>
                  <View style={styles.glucoseValueRow}>
                    <TextInput
                      style={styles.glucoseInput}
                      keyboardType="number-pad"
                      placeholder="72"
                      placeholderTextColor={colors.textMuted}
                      value={verification.pulse ? verification.pulse.toString() : ''}
                      onChangeText={(val) => onUpdateField('pulse', parseInt(val.replace(/[^0-9]/g, ''), 10) || 0)}
                    />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textSecondary }}>
                      BPM
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.glucoseSection}>
                {/* Glucose Value Input */}
                <View style={styles.glucoseValueCard}>
                  <Text style={styles.inputLabel}>{t.verification.glucoseValue}</Text>
                  <View style={styles.glucoseValueRow}>
                    <TextInput
                      style={styles.glucoseInput}
                      keyboardType="decimal-pad"
                      placeholder="100"
                      placeholderTextColor={colors.textMuted}
                      value={verification.glucoseValue ? verification.glucoseValue.toString() : ''}
                      onChangeText={(val) => {
                        const cleaned = val.replace(/[^0-9.]/g, '');
                        onUpdateField('glucoseValue', parseFloat(cleaned) || 0);
                      }}
                    />
                    {/* Unit Selector */}
                    <View style={styles.unitToggleGroup}>
                      <TouchableOpacity
                        style={[
                          styles.unitToggleBtn,
                          verification.unit === 'mg/dL' && styles.unitToggleBtnActive,
                        ]}
                        onPress={() => onUpdateField('unit', 'mg/dL')}
                      >
                        <Text
                          style={[
                            styles.unitToggleText,
                            verification.unit === 'mg/dL' && styles.unitToggleTextActive,
                          ]}
                        >
                          mg/dL
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.unitToggleBtn,
                          verification.unit === 'mmol/L' && styles.unitToggleBtnActive,
                        ]}
                        onPress={() => onUpdateField('unit', 'mmol/L')}
                      >
                        <Text
                          style={[
                            styles.unitToggleText,
                            verification.unit === 'mmol/L' && styles.unitToggleTextActive,
                          ]}
                        >
                          mmol/L
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Meal Timing Tags */}
                <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>{t.verification.mealContext}</Text>
                <View style={styles.tagGroup}>
                  {(
                    [
                      { key: 'FASTING', label: t.verification.fasting },
                      { key: 'BEFORE_MEAL', label: t.verification.preMeal },
                      { key: 'POSTPRANDIAL', label: t.verification.postMeal },
                      { key: 'RANDOM', label: t.verification.random },
                    ] as { key: MealTag; label: string }[]
                  ).map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.tagPill, verification.mealTag === item.key && styles.tagPillActive]}
                      onPress={() => onUpdateField('mealTag', item.key)}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          verification.mealTag === item.key && styles.tagTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Optional Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.inputLabel}>{t.common.notes}</Text>
              <TextInput
                style={styles.notesInput}
                placeholder={t.common.notesPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={verification.notes}
                onChangeText={(val) => onUpdateField('notes', val)}
                multiline
              />
            </View>
          </ScrollView>

          {/* Bottom Action Buttons: Pinned and Always Accessible */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.discardButton}
              onPress={onDismiss}
              disabled={isLoading}
            >
              <Text style={styles.discardText}>{t.common.retake}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? t.common.saving : t.common.confirmAndSave}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const getStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.65)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingTop: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
      maxHeight: '92%',
      flexDirection: 'column',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.sm,
    },
    title: {
      fontSize: TYPOGRAPHY.fontSizes.lg,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    deviceTypeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: RADIUS.md,
      padding: 3,
      marginBottom: SPACING.md,
    },
    deviceTypeBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: RADIUS.sm,
    },
    deviceTypeBtnActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    deviceTypeBtnText: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    deviceTypeBtnTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    scrollView: {
      flexGrow: 0,
      flexShrink: 1,
    },
    scrollBody: {
      paddingBottom: SPACING.md,
    },
    previewContainer: {
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      marginBottom: SPACING.md,
      backgroundColor: isDark ? colors.surfaceSubtle : '#0F172A',
    },
    screenImage: {
      width: '100%',
      height: 130,
    },
    imagePlaceholder: {
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
    },
    placeholderText: {
      color: colors.textMuted,
      fontSize: TYPOGRAPHY.fontSizes.sm,
    },
    confidenceBadgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.85)',
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    confidenceIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    confidenceText: {
      color: '#E2E8F0',
      fontSize: TYPOGRAPHY.fontSizes.xs,
      fontWeight: '600',
    },
    statusSection: {
      backgroundColor: colors.surfaceSubtle,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.md,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    inputsGrid: {
      flexDirection: 'row',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    inputCard: {
      flex: 1,
      backgroundColor: isDark ? colors.surfaceSubtle : colors.surface,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      alignItems: 'center',
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    numericInput: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      paddingVertical: 2,
      minWidth: 60,
    },
    inputSubtext: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 2,
    },
    glucoseSection: {
      marginBottom: SPACING.md,
    },
    glucoseValueCard: {
      backgroundColor: isDark ? colors.surfaceSubtle : colors.surface,
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
    },
    glucoseValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    glucoseInput: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.textPrimary,
      flex: 1,
    },
    unitToggleGroup: {
      flexDirection: 'row',
      backgroundColor: isDark ? colors.surface : colors.surfaceSubtle,
      borderRadius: RADIUS.md,
      padding: 3,
    },
    unitToggleBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: RADIUS.sm,
    },
    unitToggleBtnActive: {
      backgroundColor: colors.primary,
    },
    unitToggleText: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    unitToggleTextActive: {
      color: '#FFFFFF',
    },
    tagGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.xs,
      marginTop: SPACING.xs,
    },
    tagPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: RADIUS.full,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    tagPillActive: {
      backgroundColor: isDark ? colors.primary + '26' : colors.primaryMuted,
      borderColor: colors.primary,
    },
    tagText: {
      fontSize: TYPOGRAPHY.fontSizes.xs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tagTextActive: {
      color: isDark ? colors.primaryLight : colors.primaryDark,
      fontWeight: '700',
    },
    notesSection: {
      marginTop: SPACING.xs,
    },
    notesInput: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      fontSize: TYPOGRAPHY.fontSizes.sm,
      color: colors.textPrimary,
      minHeight: 50,
    },
    footerRow: {
      flexDirection: 'row',
      gap: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      backgroundColor: colors.surface,
    },
    discardButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    discardText: {
      fontSize: TYPOGRAPHY.fontSizes.sm,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    saveButton: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: TYPOGRAPHY.fontSizes.md,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
