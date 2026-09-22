import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ColorTheme, RADIUS, SPACING, TYPOGRAPHY } from '../../core/constants/theme';
import { useHealthStore } from '../state/useHealthStore';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CameraScanScreen } from '../screens/CameraScanScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ExportScreen } from '../screens/ExportScreen';

export const RootNavigator: React.FC = () => {
  const { activeTab, setActiveTab } = useHealthStore();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const tabs: { id: 'dashboard' | 'camera' | 'analytics' | 'export'; label: string; icon: string }[] = [
    { id: 'dashboard', label: t.navigation.home, icon: '🏠' },
    { id: 'camera', label: t.navigation.scan, icon: '📷' },
    { id: 'analytics', label: t.navigation.trends, icon: '📈' },
    { id: 'export', label: t.navigation.export, icon: '📤' },
  ];

  return (
    <View style={styles.container}>
      {/* Active Screen View */}
      <View style={styles.screenContainer}>
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'camera' && <CameraScanScreen />}
        {activeTab === 'analytics' && <AnalyticsScreen />}
        {activeTab === 'export' && <ExportScreen />}
      </View>

      {/* Bottom Navigation Bar (Hidden when camera scanner is active so camera has full immersion) */}
      {activeTab !== 'camera' && (
        <View style={styles.bottomBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isScan = tab.id === 'camera';

            if (isScan) {
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.scanTabButton}
                  onPress={() => setActiveTab('camera')}
                  activeOpacity={0.85}
                >
                  <View style={styles.scanTabCircle}>
                    <Text style={styles.scanTabIcon}>📷</Text>
                  </View>
                  <Text style={styles.scanTabLabel}>
                    {t.navigation.scan}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {tab.icon}
                </Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenContainer: {
      flex: 1,
    },
    bottomBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceBorder,
      paddingTop: SPACING.xs,
      paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.sm,
      paddingHorizontal: SPACING.md,
      alignItems: 'center',
      justifyContent: 'space-around',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 8,
    },
    tabButton: {
      alignItems: 'center',
      paddingVertical: 4,
      minWidth: 60,
    },
    tabIcon: {
      fontSize: 20,
      opacity: 0.6,
    },
    tabIconActive: {
      opacity: 1,
      transform: [{ scale: 1.1 }],
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
    },
    tabLabelActive: {
      color: colors.primaryLight,
      fontWeight: '700',
    },
    scanTabButton: {
      alignItems: 'center',
      marginTop: -20,
    },
    scanTabCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 3,
      borderColor: colors.surface,
    },
    scanTabIcon: {
      fontSize: 24,
    },
    scanTabLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryLight,
      marginTop: 2,
    },
  });
