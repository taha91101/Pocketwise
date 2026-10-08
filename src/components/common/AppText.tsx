import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { typography } from '../../theme/typography';

export type TypographyVariant = keyof typeof typography;

export interface AppTextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'body1',
  color,
  weight,
  align,
  style,
  ...rest
}) => {
  const { colors, typography: typ } = useTheme();

  const variantStyle = typ[variant] || typ.body1;
  const textColor = color || (variant === 'caption' ? colors.textMuted : colors.textPrimary);

  return (
    <RNText
      style={[
        variantStyle,
        { color: textColor },
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};
