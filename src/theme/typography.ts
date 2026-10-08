import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
});

export const typography = {
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  subtitle1: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 22,
  },
  subtitle2: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 20,
  },
  body1: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
  },
  body2: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 18,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  amountLarge: {
    fontFamily,
    fontSize: 34,
    fontWeight: '800' as TextStyle['fontWeight'],
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  amountMedium: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 28,
  },
  amountSmall: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 20,
  },
  button: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: 0.2,
  },
};
