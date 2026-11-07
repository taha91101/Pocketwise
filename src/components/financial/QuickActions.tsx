import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
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
  const { t } = useTranslation();

  const actions = [
    {
      id: 'expense',
      label: t('expense'),
      icon: 'minus-circle' as const,
      color: colors.error,
      bgColor: colors.errorLight,
      onPress: onAddExpense,
    },
    {
      id: 'income',
      label: t('income'),
      icon: 'plus-circle' as const,
      color: colors.success,
      bgColor: colors.successLight,
      onPress: onAddIncome,
    },
    {
      id: 'saving',
      label: t('saving'),
      icon: 'target' as const,
      color: colors.primary,
      bgColor: colors.primaryLight,
      onPress: onAddSaving,
    },
    {
      id: 'transfer',
      label: t('transfer'),
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
          key={act.id}
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
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
