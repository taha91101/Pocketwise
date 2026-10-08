import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Transaction } from '../../types';
import { AppText } from '../common/AppText';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { useAppStore } from '../../store/useAppStore';
import { Feather } from '@expo/vector-icons';

export interface SpendingChartProps {
  transactions: Transaction[];
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ transactions }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Compute bar data according to period
  const getChartData = () => {
    const now = new Date();
    if (period === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      // last 7 days
      return days.map((dayLabel, index) => {
        const targetDate = new Date(now);
        // map index to recent days
        const diff = (now.getDay() + 6) % 7 - index;
        targetDate.setDate(now.getDate() - diff);
        const dateStr = targetDate.toISOString().split('T')[0];

        const dayTotal = transactions
          .filter((tx) => tx.type === 'expense' && tx.date.startsWith(dateStr))
          .reduce((sum, tx) => sum + tx.amount, 0);

        return { label: dayLabel, amount: dayTotal };
      });
    } else if (period === 'month') {
      // 4 weeks of the current month
      const weeks = ['W1', 'W2', 'W3', 'W4'];
      return weeks.map((wLabel, index) => {
        const startDay = index * 7 + 1;
        const endDay = (index + 1) * 7;
        const weekTotal = transactions
          .filter((tx) => {
            if (tx.type !== 'expense') return false;
            const d = new Date(tx.date);
            return (
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear() &&
              d.getDate() >= startDay &&
              d.getDate() <= endDay
            );
          })
          .reduce((sum, tx) => sum + tx.amount, 0);

        return { label: wLabel, amount: weekTotal };
      });
    } else {
      // 6 recent months
      const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      return months.map((mLabel, index) => {
        const targetMonth = (now.getMonth() - (5 - index) + 12) % 12;
        const monthTotal = transactions
          .filter((tx) => {
            if (tx.type !== 'expense') return false;
            const d = new Date(tx.date);
            return d.getMonth() === targetMonth;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);

        return { label: mLabel, amount: monthTotal };
      });
    }
  };

  const data = getChartData();
  const maxAmount = Math.max(...data.map((d) => d.amount), 100);
  const totalPeriodSpend = data.reduce((sum, d) => sum + d.amount, 0);

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
      <View style={styles.headerRow}>
        <View>
          <AppText variant="subtitle1" weight="700">
            Spending Activity
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Total {FinancialCalculationsService.formatCurrency(totalPeriodSpend, currencySymbol)}
          </AppText>
        </View>

        {/* Period Selector */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
          {(['week', 'month', 'year'] as const).map((p) => {
            const isSelected = period === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.toggleBtn,
                  isSelected && {
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    ...shadows.soft,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? colors.textPrimary : colors.textMuted}
                  weight={isSelected ? '700' : '500'}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bar Chart Container or Empty State */}
      {totalPeriodSpend > 0 ? (
        <View style={styles.chartArea}>
          {data.map((item, idx) => {
            const barHeightPercent = Math.min(100, Math.max(12, (item.amount / maxAmount) * 100));
            const isHighest = item.amount === Math.max(...data.map((d) => d.amount)) && item.amount > 0;

            return (
              <View key={idx} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${barHeightPercent}%`,
                        backgroundColor: isHighest ? colors.primary : colors.surfaceVariant,
                        borderRadius: radius.sm,
                      },
                    ]}
                  />
                </View>
                <AppText
                  variant="caption"
                  color={isHighest ? colors.textPrimary : colors.textMuted}
                  weight={isHighest ? '700' : '500'}
                  style={{ marginTop: spacing.xs }}
                >
                  {item.label}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.emptyChartBox, { backgroundColor: colors.surfaceVariant, borderRadius: radius.xl, padding: spacing.lg }]}>
          <Feather name="bar-chart-2" size={28} color={colors.textMuted} style={{ marginBottom: spacing.xs }} />
          <AppText variant="subtitle2" weight="700" color={colors.textPrimary}>
            No spending data yet
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} align="center" style={{ marginTop: 4 }}>
            Add your first expense to see your spending trends.
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: 22,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
  },
  emptyChartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    width: '100%',
  },
});
