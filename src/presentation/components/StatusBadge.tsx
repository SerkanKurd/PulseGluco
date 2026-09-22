import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusCategory, MedicalSeverity } from '../../core/constants/medical-thresholds';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';

interface StatusBadgeProps {
  status: StatusCategory;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'small',
  showDescription = false,
}) => {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const localizedMap: Partial<Record<MedicalSeverity, { label: string; shortLabel: string; desc: string }>> = {
    [MedicalSeverity.OPTIMAL]: { label: t.status.optimal, shortLabel: t.status.normal, desc: t.status.normalDesc },
    [MedicalSeverity.NORMAL]: { label: t.status.normal, shortLabel: t.status.normal, desc: t.status.normalDesc },
    [MedicalSeverity.ELEVATED]: { label: t.status.elevated, shortLabel: t.status.elevated, desc: t.status.elevatedDesc },
    [MedicalSeverity.STAGE_1]: { label: t.status.stage1, shortLabel: t.status.stage1, desc: t.status.stage1Desc },
    [MedicalSeverity.STAGE_2]: { label: t.status.stage2, shortLabel: t.status.stage2, desc: t.status.stage2Desc },
    [MedicalSeverity.CRISIS]: { label: t.status.crisis, shortLabel: t.status.crisis, desc: t.status.crisisDesc },
    [MedicalSeverity.HYPOTENSION]: { label: t.status.hypotension, shortLabel: t.status.hypotension, desc: t.status.hypotensionDesc },
    [MedicalSeverity.HYPOGLYCEMIA]: { label: t.status.hypoglycemia, shortLabel: t.status.hypoglycemia, desc: t.status.hypoglycemiaDesc },
    [MedicalSeverity.PREDIABETES]: { label: t.status.prediabetes, shortLabel: t.status.prediabetes, desc: t.status.prediabetesDesc },
    [MedicalSeverity.DIABETES]: { label: t.status.diabetes, shortLabel: t.status.diabetes, desc: t.status.diabetesDesc },
  };

  const localized = localizedMap[status.key];
  const displayLabel = isSmall
    ? (localized?.shortLabel || status.shortLabel)
    : (localized?.label || status.label);
  const displayDesc = localized?.desc || status.description;

  const badgeBg = isDark ? status.color + '26' : status.backgroundColor;
  const badgeBorder = isDark ? status.color + '66' : status.color;

  return (
    <View style={[styles.wrapper, showDescription && styles.wrapperColumn]}>
      <View
        style={[
          styles.badge,
          { backgroundColor: badgeBg, borderColor: badgeBorder },
          isSmall && styles.badgeSmall,
          isLarge && styles.badgeLarge,
        ]}
      >
        <View style={[styles.dot, { backgroundColor: status.color }]} />
        <Text style={[styles.text, { color: status.color }, isSmall && styles.textSmall, isLarge && styles.textLarge]}>
          {displayLabel}
        </Text>
      </View>
      {showDescription && (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {displayDesc}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapperColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeLarge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 11,
  },
  textLarge: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: '#64748B',
    marginTop: 2,
  },
});
