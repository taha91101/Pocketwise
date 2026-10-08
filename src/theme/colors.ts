export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  accent: string;
  backdrop: string;
  tint: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const lightColors: ColorPalette = {
  primary: '#0D9488', // Elegant Teal / Emerald
  primaryLight: '#CCFBF1',
  primaryDark: '#0F766E',
  background: '#F8FAFC', // Soft off-white
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  card: '#FFFFFF',
  textPrimary: '#0F172A', // Dark charcoal
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  accent: '#14B8A6',
  backdrop: 'rgba(15, 23, 42, 0.45)',
  tint: '#0D9488',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#0D9488',
  tabBarInactive: '#94A3B8',
};

export const darkColors: ColorPalette = {
  primary: '#14B8A6',
  primaryLight: 'rgba(20, 184, 166, 0.15)',
  primaryDark: '#0D9488',
  background: '#0B0F17', // Near-black / dark charcoal
  surface: '#151D2A',
  surfaceVariant: '#1E293B',
  card: '#151D2A',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#273549',
  borderLight: '#1E293B',
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.15)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.15)',
  accent: '#2DD4BF',
  backdrop: 'rgba(0, 0, 0, 0.75)',
  tint: '#14B8A6',
  tabBar: '#121824',
  tabBarBorder: '#1E293B',
  tabBarActive: '#2DD4BF',
  tabBarInactive: '#64748B',
};
