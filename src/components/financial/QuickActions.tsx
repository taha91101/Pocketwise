import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { Feather } from '@expo/vector-icons';

export interface QuickActionsProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddSaving: () => void;
  onTransfer: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddExpense,
  onAddIncome,
  onAddSaving,
  onTransfer,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();

  const actions = [
    {
      label: 'Expense',
      icon: 'minus-circle' as const,
      color: colors.error,
      bgColor: colors.errorLight,
      onPress: onAddExpense,
    },
    {
      label: 'Income',
      icon: 'plus-circle' as const,
      color: colors.success,
      bgColor: colors.successLight,
      onPress: onAddIncome,
    },
    {
      label: 'Saving',
      icon: 'target' as const,
      color: colors.primary,
      bgColor: colors.primaryLight,
      onPress: onAddSaving,
    },
    {
      label: 'Transfer',
      icon: 'refresh-cw' as const,
      color: colors.info,
      bgColor: colors.infoLight,
      onPress: onTransfer,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.xl,
          padding: spacing.md,
          ...shadows.soft,
        },
      ]}
    >
      {actions.map((act) => (
        <TouchableOpacity
          key={act.label}
          activeOpacity={0.7}
          onPress={act.onPress}
          style={styles.actionBtn}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: act.bgColor,
                borderRadius: radius.full,
              },
            ]}
          >
            <Feather name={act.icon} size={20} color={act.color} />
          </View>
          <AppText
            variant="caption"
            color={colors.textPrimary}
            weight="600"
            style={{ marginTop: spacing.xs }}
          >
            {act.label}
          </AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
