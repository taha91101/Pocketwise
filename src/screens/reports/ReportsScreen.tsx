import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { ProgressBar } from '../../components/common/ProgressBar';
import { CategoryBreakdown } from '../../components/financial/CategoryBreakdown';
import { SpendingChart } from '../../components/financial/SpendingChart';
import { useAppStore } from '../../store/useAppStore';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

type PeriodFilter = '7d' | '30d' | '3m' | '6m' | '1y';

export const ReportsScreen: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const transactions = useAppStore((state) => state.transactions);
  const accounts = useAppStore((state) => state.accounts);
  const budgets = useAppStore((state) => state.budgets);
  const savingsGoals = useAppStore((state) => state.savingsGoals);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [period, setPeriod] = useState<PeriodFilter>('30d');

  // Compute date range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '3m':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    return { start, end };
  };

  const { start, end } = getDateRange();

  const totalIncome = FinancialCalculationsService.calculateTotalIncome(transactions, start, end);
  const totalExpenses = FinancialCalculationsService.calculateTotalExpenses(transactions, start, end);
  const totalSavings = FinancialCalculationsService.calculateTotalSavingsAllocated(transactions, start, end);
  const savingsRate = FinancialCalculationsService.calculateSavingsRate(totalIncome, totalSavings);

  const netSavings = totalIncome - totalExpenses - totalSavings;
  const availableBalance = FinancialCalculationsService.calculateTotalAccountBalance(accounts);
  const openingBalance = availableBalance - netSavings;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <AppText variant="h2" weight="800">
          Financial Reports
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          Deep-dive analysis & cash flow statements
        </AppText>

        {/* Period filter buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '3m', label: '3 Months' },
            { id: '6m', label: '6 Months' },
            { id: '1y', label: '1 Year' },
          ].map((item) => {
            const isSelected = period === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setPeriod(item.id as PeriodFilter)}
                style={[
                  styles.periodChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  weight={isSelected ? '700' : '500'}
                >
                  {item.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Income vs Expenses Bar Comparison */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xxl,
              padding: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <AppText variant="subtitle1" weight="700">
            Income vs Expenses
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Net Cash Flow: {FinancialCalculationsService.formatCurrency(totalIncome - totalExpenses, currencySymbol)}
          </AppText>

          <View style={styles.comparisonBars}>
            {/* Income */}
            <View style={{ marginBottom: spacing.md }}>
              <View style={styles.barLabelRow}>
                <AppText variant="body2" weight="600">
                  Income
                </AppText>
                <AppText variant="body2" color={colors.success} weight="700">
                  {FinancialCalculationsService.formatCurrency(totalIncome, currencySymbol)}
                </AppText>
              </View>
              <ProgressBar
                progress={totalIncome > 0 ? 100 : 0}
                color={colors.success}
                height={8}
                style={{ marginTop: 6 }}
              />
            </View>

            {/* Expenses */}
            <View>
              <View style={styles.barLabelRow}>
                <AppText variant="body2" weight="600">
                  Expenses
                </AppText>
                <AppText variant="body2" color={colors.error} weight="700">
                  {FinancialCalculationsService.formatCurrency(totalExpenses, currencySymbol)}
                </AppText>
              </View>
              <ProgressBar
                progress={totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0}
                color={colors.error}
                height={8}
                style={{ marginTop: 6 }}
              />
            </View>
          </View>
        </View>

        {/* Savings Rate Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xxl,
              padding: spacing.lg,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <View style={styles.savingsRateRow}>
            <View>
              <AppText variant="caption" color={colors.textSecondary}>
                Savings Rate
              </AppText>
              <AppText variant="amountLarge" color={colors.primary} weight="800">
                {savingsRate}%
              </AppText>
            </View>
            <View
              style={[
                styles.rateIconCircle,
                {
                  backgroundColor: colors.primaryLight,
                  borderRadius: radius.full,
                },
              ]}
            >
              <Feather name="award" size={28} color={colors.primary} />
            </View>
          </View>
          <AppText variant="body2" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
            You saved {FinancialCalculationsService.formatCurrency(totalSavings, currencySymbol)} out of {FinancialCalculationsService.formatCurrency(totalIncome, currencySymbol)} earned during this timeframe.
          </AppText>
        </View>

        {/* Cash Flow Statement */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xxl,
              padding: spacing.lg,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <AppText variant="subtitle1" weight="700">
            Cash Flow Statement
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2, marginBottom: spacing.md }}>
            Consolidated balance reconciliation
          </AppText>

          <CashFlowRow label="Opening Available Balance" amount={openingBalance} symbol={currencySymbol} />
          <CashFlowRow label="+ Total Income Inflow" amount={totalIncome} isPositive symbol={currencySymbol} />
          <CashFlowRow label="- Total Expenses Outflow" amount={-totalExpenses} isNegative symbol={currencySymbol} />
          <CashFlowRow label="- Stashed to Savings" amount={-totalSavings} symbol={currencySymbol} />
          <View style={[styles.cashFlowDivider, { borderTopColor: colors.border }]} />
          <CashFlowRow
            label="= Closing Available Balance"
            amount={availableBalance}
            isTotal
            symbol={currencySymbol}
          />
        </View>

        {/* Spending Breakdown */}
        <View style={{ marginTop: spacing.lg }}>
          <SpendingChart transactions={transactions} />
        </View>

        {/* Category Breakdown */}
        <View style={{ marginTop: spacing.lg }}>
          <CategoryBreakdown maxItems={6} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

interface CashFlowRowProps {
  label: string;
  amount: number;
  isPositive?: boolean;
  isNegative?: boolean;
  isTotal?: boolean;
  symbol: string;
}

const CashFlowRow: React.FC<CashFlowRowProps> = ({
  label,
  amount,
  isPositive,
  isNegative,
  isTotal,
  symbol,
}) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.flowRow, { paddingVertical: spacing.sm }]}>
      <AppText
        variant={isTotal ? 'subtitle2' : 'body2'}
        weight={isTotal ? '700' : '400'}
        color={isTotal ? colors.textPrimary : colors.textSecondary}
      >
        {label}
      </AppText>
      <AppText
        variant={isTotal ? 'subtitle1' : 'body2'}
        weight="700"
        color={
          isPositive
            ? colors.success
            : isNegative
            ? colors.error
            : isTotal
            ? colors.primary
            : colors.textPrimary
        }
      >
        {FinancialCalculationsService.formatCurrency(amount, symbol)}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 4,
  },
  periodRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 4,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  card: {
    width: '100%',
    borderWidth: 1,
  },
  comparisonBars: {
    marginTop: 16,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateIconCircle: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashFlowDivider: {
    borderTopWidth: 1,
    marginVertical: 6,
  },
});
