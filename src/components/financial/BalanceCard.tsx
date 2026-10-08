import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { useAppStore } from '../../store/useAppStore';
import { Feather } from '@expo/vector-icons';

export const BalanceCard: React.FC = () => {
  const { colors, radius, spacing, shadows, isDark } = useTheme();
  const overview = useAppStore((state) => state.overview);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);
  const transactions = useAppStore((state) => state.transactions);

  const hasHistory = transactions.length > 0;
  const isPositiveGrowth = overview.monthOverMonthGrowth >= 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#14202E' : '#0F766E', // Deep emerald/teal
          borderRadius: radius.xxl,
          padding: spacing.xl,
          ...shadows.elevated,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeLabel}>
          <Feather name="shield" size={14} color="#A7F3D0" style={{ marginRight: 6 }} />
          <AppText variant="caption" color="#D1FAE5" weight="600">
            Available Balance
          </AppText>
        </View>
        {hasHistory ? (
          <View style={styles.chipGrowth}>
            <Feather
              name={isPositiveGrowth ? 'trending-up' : 'trending-down'}
              size={12}
              color={isPositiveGrowth ? '#34D399' : '#FCA5A5'}
              style={{ marginRight: 4 }}
            />
            <AppText
              variant="caption"
              color={isPositiveGrowth ? '#34D399' : '#FCA5A5'}
              weight="700"
            >
              {isPositiveGrowth ? '+' : ''}
              {overview.monthOverMonthGrowth}% this month
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText
        variant="amountLarge"
        color="#FFFFFF"
        style={{ marginTop: spacing.md, marginBottom: spacing.xs }}
      >
        {FinancialCalculationsService.formatCurrency(overview.availableBalance, currencySymbol)}
      </AppText>

      <View style={[styles.bottomRow, { borderTopColor: 'rgba(255, 255, 255, 0.15)', paddingTop: spacing.md, marginTop: spacing.sm }]}>
        <View style={styles.miniStat}>
          <AppText variant="caption" color="rgba(255, 255, 255, 0.7)">
            Savings Rate
          </AppText>
          <AppText variant="subtitle2" color="#FFFFFF" weight="700">
            {overview.netSavingsRate}% of income
          </AppText>
        </View>
        <View style={[styles.miniStat, { alignItems: 'flex-end' }]}>
          <AppText variant="caption" color="rgba(255, 255, 255, 0.7)">
            Total Stashed
          </AppText>
          <AppText variant="subtitle2" color="#FFFFFF" weight="700">
            {FinancialCalculationsService.formatCurrency(overview.totalSavings, currencySymbol)}
          </AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  miniStat: {},
});
