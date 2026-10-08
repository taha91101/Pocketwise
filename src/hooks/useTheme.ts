import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { darkColors, lightColors, radius, shadows, spacing, typography, Theme } from '../theme';

export const useTheme = (): Theme => {
  const systemColorScheme = useColorScheme();
  const themeMode = useAppStore((state) => state.settings.themeMode);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    radius,
    shadows,
  };
};
