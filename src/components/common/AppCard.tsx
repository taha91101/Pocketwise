import React from 'react';
import { View, ViewProps, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AppCardProps extends ViewProps {
  elevated?: boolean;
  border?: boolean;
  padding?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  elevated = false,
  border = true,
  padding,
  style,
  ...rest
}) => {
  const { colors, radius, shadows, spacing } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: padding !== undefined ? padding : spacing.lg,
    borderWidth: border ? 1 : 0,
    borderColor: colors.border,
    ...(elevated ? shadows.medium : shadows.soft),
  };

  return (
    <View style={[cardStyle, style]} {...rest}>
      {children}
    </View>
  );
};
