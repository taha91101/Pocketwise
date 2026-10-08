import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Feather } from '@expo/vector-icons';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconName?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  iconName,
  iconPosition = 'left',
  fullWidth = false,
  style,
  disabled,
  ...rest
}) => {
  const { colors, radius, spacing } = useTheme();

  const getContainerStyles = (): ViewStyle => {
    let bg = colors.primary;
    let border = 'transparent';

    switch (variant) {
      case 'secondary':
        bg = colors.surfaceVariant;
        break;
      case 'outline':
        bg = 'transparent';
        border = colors.border;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
      case 'danger':
        bg = colors.error;
        break;
      case 'primary':
      default:
        bg = colors.primary;
        break;
    }

    let paddingVertical = spacing.md;
    let paddingHorizontal = spacing.lg;
    if (size === 'sm') {
      paddingVertical = spacing.sm;
      paddingHorizontal = spacing.md;
    } else if (size === 'lg') {
      paddingVertical = spacing.lg;
      paddingHorizontal = spacing.xxl;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth: variant === 'outline' ? 1.5 : 0,
      borderRadius: radius.lg,
      paddingVertical,
      paddingHorizontal,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled || loading ? 0.6 : 1,
      width: fullWidth ? '100%' : undefined,
    };
  };

  const getTextColor = (): string => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    if (variant === 'outline') return colors.textPrimary;
    if (variant === 'secondary') return colors.textPrimary;
    if (variant === 'ghost') return colors.primary;
    return '#FFFFFF';
  };

  const textColor = getTextColor();
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      disabled={disabled || loading}
      style={[getContainerStyles(), style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {iconName && iconPosition === 'left' && (
            <Feather
              name={iconName}
              size={iconSize}
              color={textColor}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <AppText
            variant={size === 'sm' ? 'caption' : size === 'lg' ? 'subtitle1' : 'button'}
            color={textColor}
            weight="600"
          >
            {title}
          </AppText>
          {iconName && iconPosition === 'right' && (
            <Feather
              name={iconName}
              size={iconSize}
              color={textColor}
              style={{ marginLeft: spacing.sm }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
