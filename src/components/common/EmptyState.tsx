import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { Feather } from '@expo/vector-icons';

export interface EmptyStateProps {
  iconName?: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'inbox',
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}) => {
  const { colors, spacing, radius } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.full,
          },
        ]}
      >
        <Feather name={iconName} size={36} color={colors.primary} />
      </View>
      <AppText variant="h3" align="center" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
        {title}
      </AppText>
      <AppText
        variant="body2"
        color={colors.textSecondary}
        align="center"
        style={{ maxWidth: 280, marginBottom: actionTitle ? spacing.lg : 0 }}
      >
        {description}
      </AppText>
      {actionTitle && onActionPress && (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="primary"
          size="md"
          iconName="plus"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
