import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { useAppStore } from '../../store/useAppStore';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export const SafeToSpendCard: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const forecast = useAppStore((state) => state.forecast);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!forecast) return null;

  const {
    safeToSpendToday,
    projectedMonthEndBalance,
    upcomingCommittedExpenses,
    daysRemainingInMonth,
    averageDailyDiscretionarySpend,
    isLowBalanceWarning,
    lowBalanceThreshold,
  } = forecast;

  const isSafePositive = safeToSpendToday > 0;
  const statusColor = isLowBalanceWarning
    ? colors.error
    : safeToSpendToday > 1000
    ? colors.success
    : colors.warning;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isLowBalanceWarning ? colors.error : colors.border,
          borderRadius: radius.xxl,
          padding: spacing.lg,
          ...shadows.soft,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.pulseDot, { backgroundColor: statusColor }]} />
          <AppText variant="caption" weight="700" color={colors.textSecondary}>
            CASH-FLOW FORECAST
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={[styles.toggleBtn, { backgroundColor: colors.surfaceVariant, borderRadius: radius.sm }]}
        >
          <AppText variant="caption" weight="600" color={colors.textSecondary}>
            {isExpanded ? 'Hide Details' : 'Details'}
          </AppText>
          <Feather
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textSecondary}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      {/* Main Metric: Safe To Spend Today */}
      <View style={{ marginTop: spacing.sm }}>
        <AppText variant="caption" color={colors.textSecondary}>
          Safe-to-Spend Today
        </AppText>
        <View style={styles.amountRow}>
          <AppText
            variant="h1"
            weight="800"
            color={isSafePositive ? colors.textPrimary : colors.error}
          >
            {FinancialCalculationsService.formatCurrency(safeToSpendToday, currencySymbol)}
          </AppText>
          <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginLeft: 6, marginBottom: 4 }}>
            / day
          </AppText>
        </View>
      </View>

      {/* Low Balance Warning Alert */}
      {isLowBalanceWarning && (
        <View
          style={[
            styles.alertBox,
            {
              backgroundColor: colors.error + '15',
              borderColor: colors.error,
              borderRadius: radius.md,
              padding: spacing.sm,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Feather name="alert-triangle" size={16} color={colors.error} style={{ marginRight: 6 }} />
          <AppText variant="caption" weight="600" color={colors.error} style={{ flex: 1 }}>
            Projected balance drops below your {currencySymbol}{lowBalanceThreshold.toLocaleString()} safety buffer.
          </AppText>
        </View>
      )}

      {/* Sub-metrics Summary Bar */}
      <View
        style={[
          styles.summaryBar,
          {
            backgroundColor: colors.surfaceVariant,
            borderRadius: radius.lg,
            padding: spacing.md,
            marginTop: spacing.md,
          },
        ]}
      >
        <View style={styles.summaryItem}>
          <AppText variant="caption" color={colors.textSecondary}>
            Projected Month-End
          </AppText>
          <AppText
            variant="subtitle2"
            weight="700"
            color={projectedMonthEndBalance >= 0 ? colors.textPrimary : colors.error}
          >
            {FinancialCalculationsService.formatCurrency(projectedMonthEndBalance, currencySymbol)}
          </AppText>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryItem}>
          <AppText variant="caption" color={colors.textSecondary}>
            Committed Bills
          </AppText>
          <AppText variant="subtitle2" weight="700" color={colors.textPrimary}>
            {FinancialCalculationsService.formatCurrency(upcomingCommittedExpenses, currencySymbol)}
          </AppText>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryItem}>
          <AppText variant="caption" color={colors.textSecondary}>
            Days Left
          </AppText>
          <AppText variant="subtitle2" weight="700" color={colors.textPrimary}>
            {daysRemainingInMonth}d
          </AppText>
        </View>
      </View>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <View style={[styles.breakdownContainer, { borderTopColor: colors.border, marginTop: spacing.md }]}>
          <AppText variant="caption" weight="700" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
            FORECAST FORMULA
          </AppText>

          <View style={styles.breakdownRow}>
            <AppText variant="body2" color={colors.textSecondary}>
              Daily Discretionary Burn Rate
            </AppText>
            <AppText variant="body2" weight="600" color={colors.textPrimary}>
              {FinancialCalculationsService.formatCurrency(averageDailyDiscretionarySpend, currencySymbol)}/day
            </AppText>
          </View>

          <View style={styles.breakdownRow}>
            <AppText variant="body2" color={colors.textSecondary}>
              Committed Recurring Bills
            </AppText>
            <AppText variant="body2" weight="600" color={colors.error}>
              - {FinancialCalculationsService.formatCurrency(upcomingCommittedExpenses, currencySymbol)}
            </AppText>
          </View>

          <View style={styles.breakdownRow}>
            <AppText variant="body2" color={colors.textSecondary}>
              Safety Reserve Buffer
            </AppText>
            <AppText variant="body2" weight="600" color={colors.textSecondary}>
              {FinancialCalculationsService.formatCurrency(lowBalanceThreshold, currencySymbol)}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 28,
  },
  breakdownContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
});

