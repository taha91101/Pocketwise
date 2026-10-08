import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightActionIcon?: keyof typeof Feather.glyphMap;
  onRightAction?: () => void;
  rightActionBadge?: boolean;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightActionIcon,
  onRightAction,
  rightActionBadge,
  style,
}) => {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {showBack && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
            ]}
          >
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleContainer}>
          <AppText variant="h2" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>

        {rightActionIcon && onRightAction ? (
          <TouchableOpacity
            onPress={onRightAction}
            activeOpacity={0.7}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
            ]}
          >
            <Feather name={rightActionIcon} size={20} color={colors.textPrimary} />
            {rightActionBadge && (
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: colors.error, borderColor: colors.surface },
                ]}
              />
            )}
          </TouchableOpacity>
        ) : (
          showBack ? <View style={styles.placeholder} /> : null
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  placeholder: {
    width: 40,
  },
  badgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
