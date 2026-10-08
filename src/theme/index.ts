import { lightColors, darkColors, ColorPalette } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export interface Theme {
  isDark: boolean;
  colors: ColorPalette;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
}

export const getTheme = (isDark: boolean): Theme => ({
  isDark,
  colors: isDark ? darkColors : lightColors,
  typography,
  spacing,
  radius,
  shadows,
});

export { lightColors, darkColors, typography, spacing, radius, shadows };
export type { ColorPalette };
