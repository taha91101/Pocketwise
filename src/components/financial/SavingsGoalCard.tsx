import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SavingsGoal } from '../../types';
import { AppText } from '../common/AppText';
import { ProgressBar } from '../common/ProgressBar';
import { CategoryIcon } from '../common/CategoryIcon';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { useAppStore } from '../../store/useAppStore';
import { Feather } from '@expo/vector-icons';

export interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onContributePress?: (goal: SavingsGoal) => void;
  onWithdrawPress?: (goal: SavingsGoal) => void;
  onEditPress?: (goal: SavingsGoal) => void;
}

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({
  goal,
  onContributePress,
  onWithdrawPress,
  onEditPress,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const metrics = FinancialCalculationsService.calculateGoalMetrics(goal);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.xxl,
          padding: spacing.lg,
          ...shadows.soft,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <CategoryIcon
            iconName={goal.icon || 'shield'}
            color={goal.color || colors.primary}
            size={18}
            containerSize={38}
          />
          <View style={{ marginLeft: spacing.sm }}>
            <AppText variant="subtitle1" weight="700">
              {goal.name}
            </AppText>
            {goal.category && (
              <AppText variant="caption" color={colors.textSecondary}>
                {goal.category}
              </AppText>
            )}
          </View>
        </View>

        {onEditPress && (
          <TouchableOpacity onPress={() => onEditPress(goal)} style={{ padding: 4 }}>
            <Feather name="more-horizontal" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.amountRow, { marginTop: spacing.md }]}>
        <View>
          <AppText variant="amountMedium" weight="800">
            {FinancialCalculationsService.formatCurrency(goal.currentAmount, currencySymbol)}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            of {FinancialCalculationsService.formatCurrency(goal.targetAmount, currencySymbol)} target
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText variant="subtitle2" color={colors.primary} weight="800">
            {metrics.progressPercentage}%
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {FinancialCalculationsService.formatCurrency(metrics.remainingAmount, currencySymbol)} left
          </AppText>
        </View>
      </View>

      <ProgressBar
        progress={metrics.progressPercentage}
        color={goal.color || colors.primary}
        height={8}
        style={{ marginTop: spacing.sm }}
      />

      <View
        style={[
          styles.planBanner,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.md,
            marginTop: spacing.md,
            padding: spacing.sm,
          },
        ]}
      >
        <Feather name="calendar" size={14} color={colors.primary} style={{ marginRight: 6 }} />
        <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
          Save {FinancialCalculationsService.formatCurrency(metrics.requiredMonthly, currencySymbol)}/mo to complete in {metrics.monthsRemaining} months
        </AppText>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionRow, { marginTop: spacing.md }]}>
        {onWithdrawPress && goal.currentAmount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onWithdrawPress(goal)}
            style={[
              styles.actionBtn,
              {
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.md,
                marginRight: spacing.sm,
              },
            ]}
          >
            <AppText variant="caption" color={colors.textSecondary} weight="600">
              Withdraw
            </AppText>
          </TouchableOpacity>
        )}

        {onContributePress && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onContributePress(goal)}
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                flex: 1,
              },
            ]}
          >
            <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <AppText variant="caption" color="#FFFFFF" weight="700">
              Add Money
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
