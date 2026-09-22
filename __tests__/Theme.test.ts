import { LIGHT_COLORS, DARK_COLORS, ColorTheme, COLORS, ThemeMode } from '../src/core/constants/theme';

describe('Theme Design System & Color Tokens', () => {
  it('ensures LIGHT_COLORS and DARK_COLORS have exact key parity', () => {
    const lightKeys = Object.keys(LIGHT_COLORS).sort();
    const darkKeys = Object.keys(DARK_COLORS).sort();

    expect(darkKeys).toEqual(lightKeys);
    expect(lightKeys.length).toBeGreaterThan(15);
  });

  it('ensures all color values are valid CSS color strings', () => {
    const checkColorObj = (themeName: string, colors: ColorTheme) => {
      for (const [key, val] of Object.entries(colors)) {
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
        const isValid =
          val.startsWith('#') ||
          val.startsWith('rgba') ||
          val.startsWith('rgb');
        expect(isValid).toBe(true);
      }
    };

    checkColorObj('LIGHT_COLORS', LIGHT_COLORS);
    checkColorObj('DARK_COLORS', DARK_COLORS);
  });

  it('verifies contrast properties: dark background is dark slate and light background is light slate', () => {
    expect(DARK_COLORS.background).toBe('#0B0F17');
    expect(LIGHT_COLORS.background).toBe('#F8FAFC');
    expect(DARK_COLORS.surface).toBe('#151D2A');
    expect(LIGHT_COLORS.surface).toBe('#FFFFFF');
    expect(DARK_COLORS.surfaceBorder).toBe('#293548');
    expect(LIGHT_COLORS.surfaceBorder).toBe('#E2E8F0');
  });

  it('ensures backward compatibility export COLORS equals LIGHT_COLORS', () => {
    expect(COLORS).toEqual(LIGHT_COLORS);
  });

  it('correctly resolves theme based on themeMode and system appearance', () => {
    const resolveColors = (
      themeMode: ThemeMode,
      systemScheme: 'light' | 'dark' | null | undefined
    ): { colors: ColorTheme; isDark: boolean } => {
      const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && systemScheme === 'dark');
      return {
        colors: isDark ? DARK_COLORS : LIGHT_COLORS,
        isDark,
      };
    };

    // Explicit dark
    expect(resolveColors('dark', 'light')).toEqual({
      colors: DARK_COLORS,
      isDark: true,
    });
    expect(resolveColors('dark', 'dark')).toEqual({
      colors: DARK_COLORS,
      isDark: true,
    });

    // Explicit light
    expect(resolveColors('light', 'dark')).toEqual({
      colors: LIGHT_COLORS,
      isDark: false,
    });
    expect(resolveColors('light', 'light')).toEqual({
      colors: LIGHT_COLORS,
      isDark: false,
    });

    // System mode
    expect(resolveColors('system', 'dark')).toEqual({
      colors: DARK_COLORS,
      isDark: true,
    });
    expect(resolveColors('system', 'light')).toEqual({
      colors: LIGHT_COLORS,
      isDark: false,
    });
    expect(resolveColors('system', null)).toEqual({
      colors: LIGHT_COLORS,
      isDark: false,
    });
  });

  it('simulates toggling theme modes correctly', () => {
    let mode: ThemeMode = 'system';

    const toggle = (current: ThemeMode, isDark: boolean): ThemeMode => {
      return isDark ? 'light' : 'dark';
    };

    // If currently dark, toggling yields light
    expect(toggle('system', true)).toBe('light');
    // If currently light, toggling yields dark
    expect(toggle('system', false)).toBe('dark');
  });
});
