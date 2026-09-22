import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { ColorTheme, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { useTheme } from '../../core/theme/useTheme';
import { ChartDataPoint } from '../../domain/usecases/GetAnalyticsUseCase';
import { useTranslation } from '../../core/i18n/useTranslation';

interface TrendChartProps {
  type: 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE';
  data: ChartDataPoint[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;
const CHART_HEIGHT = 220;
const PADDING = { top: 20, right: 24, bottom: 35, left: 38 };

export const TrendChart: React.FC<TrendChartProps> = ({ type, data }) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t.analytics.noRecordsPeriod}</Text>
      </View>
    );
  }

  const isBp = type === 'BLOOD_PRESSURE';
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Compute domain bounds
  let minY = isBp ? 50 : 50;
  let maxY = isBp ? 180 : 220;

  if (isBp) {
    const allValues = data.flatMap((d) => [d.value, d.secondaryValue || d.value]);
    minY = Math.max(40, Math.floor((Math.min(...allValues) - 15) / 10) * 10);
    maxY = Math.min(230, Math.ceil((Math.max(...allValues) + 15) / 10) * 10);
  } else {
    const allValues = data.map((d) => d.value);
    minY = Math.max(40, Math.floor((Math.min(...allValues) - 20) / 10) * 10);
    maxY = Math.min(350, Math.ceil((Math.max(...allValues) + 20) / 10) * 10);
  }

  const getY = (val: number) => {
    const normalized = (val - minY) / (maxY - minY);
    return PADDING.top + plotHeight - normalized * plotHeight;
  };

  const getX = (index: number) => {
    if (data.length <= 1) return PADDING.left + plotWidth / 2;
    return PADDING.left + (index / (data.length - 1)) * plotWidth;
  };

  // Build SVG Paths
  let sysPath = '';
  let diaPath = '';

  data.forEach((p, i) => {
    const x = getX(i);
    const ySys = getY(p.value);
    if (i === 0) {
      sysPath += `M ${x} ${ySys}`;
    } else {
      sysPath += ` L ${x} ${ySys}`;
    }

    if (isBp && p.secondaryValue) {
      const yDia = getY(p.secondaryValue);
      if (i === 0) {
        diaPath += `M ${x} ${yDia}`;
      } else {
        diaPath += ` L ${x} ${yDia}`;
      }
    }
  });

  // Calculate Normal target guideline band
  const bpNormalTop = getY(120);
  const bpNormalBottom = getY(80);
  const glucoseNormalTop = getY(140);
  const glucoseNormalBottom = getY(70);

  return (
    <View style={styles.container}>
      {/* Interactive Tooltip Card */}
      {selectedPoint && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipDate}>{selectedPoint.label} Reading</Text>
          <Text style={styles.tooltipValue}>
            {isBp
              ? `${selectedPoint.value}/${selectedPoint.secondaryValue || '--'} mmHg`
              : `${selectedPoint.value} mg/dL (${selectedPoint.tag || 'Reading'})`}
          </Text>
          {isBp && selectedPoint.pulse && (
            <Text style={styles.tooltipPulse}>{t.dashboard.pulseBpm}: {selectedPoint.pulse} bpm</Text>
          )}
          <View style={[styles.tooltipStatus, { backgroundColor: selectedPoint.color }]}>
            <Text style={styles.tooltipStatusText}>{selectedPoint.statusLabel}</Text>
          </View>
        </View>
      )}

      {/* SVG Canvas */}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Shaded Normal Target Zone */}
        {isBp ? (
          <Rect
            x={PADDING.left}
            y={bpNormalTop}
            width={plotWidth}
            height={Math.max(0, bpNormalBottom - bpNormalTop)}
            fill="rgba(16, 185, 129, 0.08)"
          />
        ) : (
          <Rect
            x={PADDING.left}
            y={glucoseNormalTop}
            width={plotWidth}
            height={Math.max(0, glucoseNormalBottom - glucoseNormalTop)}
            fill="rgba(16, 185, 129, 0.08)"
          />
        )}

        {/* Horizontal Grid lines */}
        {[minY, Math.round(minY + (maxY - minY) * 0.33), Math.round(minY + (maxY - minY) * 0.66), maxY].map(
          (tick) => {
            const y = getY(tick);
            return (
              <G key={`grid-${tick}`}>
                <Line
                  x1={PADDING.left}
                  y1={y}
                  x2={PADDING.left + plotWidth}
                  y2={y}
                  stroke={colors.surfaceBorder}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <SvgText
                  x={PADDING.left - 8}
                  y={y + 4}
                  fill={colors.textMuted}
                  fontSize="10"
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              </G>
            );
          }
        )}

        {/* Systolic or Glucose Trend Line */}
        <Path
          d={sysPath}
          fill="none"
          stroke={isBp ? colors.pulse : colors.glucose}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Diastolic Trend Line (BP only) */}
        {isBp && diaPath && (
          <Path
            d={diaPath}
            fill="none"
            stroke={colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Data Point Circles & Tap Targets */}
        {data.map((p, i) => {
          const x = getX(i);
          const ySys = getY(p.value);
          const isSelected = selectedPoint?.id === p.id;

          return (
            <G key={`point-${p.id}`}>
              {/* Systolic / Primary Circle */}
              <Circle
                cx={x}
                cy={ySys}
                r={isSelected ? 6 : 4}
                fill={p.color}
                stroke={isDark ? colors.surface : "#FFFFFF"}
                strokeWidth="2"
              />

              {/* Diastolic Circle */}
              {isBp && p.secondaryValue && (
                <Circle
                  cx={x}
                  cy={getY(p.secondaryValue)}
                  r={isSelected ? 6 : 4}
                  fill={colors.primaryDark}
                  stroke={isDark ? colors.surface : "#FFFFFF"}
                  strokeWidth="2"
                />
              )}

              {/* Date label along X axis */}
              {(data.length <= 8 || i % 2 === 0) && (
                <SvgText
                  x={x}
                  y={CHART_HEIGHT - 10}
                  fill={colors.textMuted}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {p.label}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>

      {/* Point selection touch triggers */}
      <View style={styles.touchOverlay} pointerEvents="box-none">
        {data.map((p, i) => {
          const left = getX(i) - 18;
          return (
            <TouchableOpacity
              key={`touch-${p.id}`}
              style={[styles.touchTarget, { left }]}
              onPress={() => setSelectedPoint(selectedPoint?.id === p.id ? null : p)}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {isBp ? (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: colors.pulse }]} />
              <Text style={styles.legendLabel}>Systolic (SYS)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendLabel}>Diastolic (DIA)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: 'rgba(16, 185, 129, 0.25)' }]} />
              <Text style={styles.legendLabel}>WHO Normal Range</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: colors.glucose }]} />
              <Text style={styles.legendLabel}>Blood Glucose (mg/dL)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, { backgroundColor: 'rgba(16, 185, 129, 0.25)' }]} />
              <Text style={styles.legendLabel}>Target Zone (70-140)</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const getStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      position: 'relative',
    },
    emptyContainer: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 180,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: TYPOGRAPHY.fontSizes.sm,
    },
    tooltip: {
      position: 'absolute',
      top: 10,
      right: 14,
      backgroundColor: isDark ? colors.surfaceSubtle : colors.textPrimary,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.surfaceBorder,
      borderRadius: RADIUS.md,
      paddingVertical: 6,
      paddingHorizontal: 10,
      zIndex: 20,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    tooltipDate: {
      color: isDark ? colors.textMuted : '#94A3B8',
      fontSize: 10,
      fontWeight: '600',
    },
    tooltipValue: {
      color: isDark ? colors.textPrimary : '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    tooltipPulse: {
      color: '#F43F5E',
      fontSize: 11,
      fontWeight: '600',
    },
    tooltipStatus: {
      marginTop: 3,
      paddingVertical: 1,
      paddingHorizontal: 6,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    tooltipStatusText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },
    touchOverlay: {
      ...StyleSheet.absoluteFill,
      height: CHART_HEIGHT,
    },
    touchTarget: {
      position: 'absolute',
      top: PADDING.top,
      width: 36,
      height: CHART_HEIGHT - PADDING.top - PADDING.bottom,
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.md,
      marginTop: SPACING.sm,
      paddingTop: SPACING.sm,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  });
