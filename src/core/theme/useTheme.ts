import { useColorScheme } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS, ColorTheme, ThemeMode } from '../constants/theme';
import { useHealthStore } from '../../presentation/state/useHealthStore';

export interface UseThemeReturn {
  colors: ColorTheme;
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export function useTheme(): UseThemeReturn {
  const themeMode = useHealthStore((state) => state.themeMode);
  const setThemeMode = useHealthStore((state) => state.setThemeMode);
  const toggleTheme = useHealthStore((state) => state.toggleThemeMode);

  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return {
    colors,
    isDark,
    themeMode,
    toggleTheme,
    setThemeMode,
  };
}
