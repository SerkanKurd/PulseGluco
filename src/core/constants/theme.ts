/**
 * PulseGluco Application Design System & Theme Tokens
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ColorTheme {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;

  pulse: string;
  pulseLight: string;

  glucose: string;
  glucoseLight: string;

  background: string;
  surface: string;
  surfaceSubtle: string;
  surfaceBorder: string;
  surfaceBorderFocus: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  statusNormal: string;
  statusNormalBg: string;
  statusElevated: string;
  statusElevatedBg: string;
  statusStage1: string;
  statusStage1Bg: string;
  statusStage2: string;
  statusStage2Bg: string;
  statusCrisis: string;
  statusCrisisBg: string;
  statusLow: string;
  statusLowBg: string;

  overlayDark: string;
  overlayGuide: string;
  shadow: string;
}

export const LIGHT_COLORS: ColorTheme = {
  primary: '#0D9488', // Medical teal
  primaryDark: '#0F766E',
  primaryLight: '#2DD4BF',
  primaryMuted: '#CCFBF1',

  pulse: '#F43F5E',
  pulseLight: '#FFE4E6',

  glucose: '#F59E0B',
  glucoseLight: '#FEF3C7',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  surfaceBorder: '#E2E8F0',
  surfaceBorderFocus: '#0D9488',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  statusNormal: '#10B981',
  statusNormalBg: '#ECFDF5',
  statusElevated: '#F59E0B',
  statusElevatedBg: '#FFFBEB',
  statusStage1: '#F97316',
  statusStage1Bg: '#FFF7ED',
  statusStage2: '#EF4444',
  statusStage2Bg: '#FEF2F2',
  statusCrisis: '#991B1B',
  statusCrisisBg: '#FEE2E2',
  statusLow: '#06B6D4',
  statusLowBg: '#ECFEFF',

  overlayDark: 'rgba(15, 23, 42, 0.75)',
  overlayGuide: 'rgba(13, 148, 136, 0.85)',
  shadow: '#000000',
};

export const DARK_COLORS: ColorTheme = {
  primary: '#14B8A6',
  primaryDark: '#0D9488',
  primaryLight: '#5EEAD4',
  primaryMuted: 'rgba(20, 184, 166, 0.18)',

  pulse: '#FB7185',
  pulseLight: 'rgba(244, 63, 94, 0.18)',

  glucose: '#FBBF24',
  glucoseLight: 'rgba(245, 158, 11, 0.18)',

  background: '#0B0F17', // Deep slate dark
  surface: '#151D2A', // Elevated dark card
  surfaceSubtle: '#1E293B', // Subtle slate card / hover
  surfaceBorder: '#293548', // Elevated border
  surfaceBorderFocus: '#14B8A6',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B0F17',

  statusNormal: '#34D399',
  statusNormalBg: 'rgba(52, 211, 153, 0.16)',
  statusElevated: '#FBBF24',
  statusElevatedBg: 'rgba(251, 191, 36, 0.16)',
  statusStage1: '#FB923C',
  statusStage1Bg: 'rgba(251, 146, 60, 0.16)',
  statusStage2: '#F87171',
  statusStage2Bg: 'rgba(248, 113, 113, 0.16)',
  statusCrisis: '#EF4444',
  statusCrisisBg: 'rgba(239, 68, 68, 0.22)',
  statusLow: '#38BDF8',
  statusLowBg: 'rgba(56, 189, 248, 0.16)',

  overlayDark: 'rgba(0, 0, 0, 0.82)',
  overlayGuide: 'rgba(20, 184, 166, 0.85)',
  shadow: '#000000',
};

export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 26,
    xl: 30,
    xxl: 36,
    display: 44,
  },
};
