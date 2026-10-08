import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { useAppStore } from '../../store/useAppStore';
import { Feather } from '@expo/vector-icons';

export const MonthlyOverviewCard: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const overview = useAppStore((state) => state.overview);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const stats = [
    {
      title: 'Income',
      amount: overview.totalIncome,
      icon: 'arrow-down-left' as const,
      color: colors.success,
      bgColor: colors.successLight,
    },
    {
      title: 'Expenses',
      amount: overview.totalExpenses,
      icon: 'arrow-up-right' as const,
      color: colors.error,
      bgColor: colors.errorLight,
    },
    {
      title: 'Saved',
      amount: overview.totalSavings,
      icon: 'target' as const,
      color: colors.primary,
      bgColor: colors.primaryLight,
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, idx) => (
        <View
          key={stat.title}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              marginLeft: idx > 0 ? spacing.sm : 0,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: stat.bgColor,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Feather name={stat.icon} size={14} color={stat.color} />
            </View>
            <AppText variant="caption" color={colors.textSecondary} weight="500">
              {stat.title}
            </AppText>
          </View>

          <AppText
            variant="amountSmall"
            color={colors.textPrimary}
            weight="700"
            style={{ marginTop: spacing.sm }}
            numberOfLines={1}
          >
            {FinancialCalculationsService.formatCurrency(stat.amount, currencySymbol)}
          </AppText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
