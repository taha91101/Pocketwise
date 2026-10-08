import React, { useState, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { TransactionItem } from '../../components/financial/TransactionItem';
import { EmptyState } from '../../components/common/EmptyState';
import { useAppStore } from '../../store/useAppStore';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export const CalendarScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const transactions = useAppStore((state) => state.transactions);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  // Transactions on selected date
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const dayTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedDateStr));
  }, [transactions, selectedDateStr]);

  const dayExpense = dayTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const dayIncome = dayTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Map of transactions per day in current month for calendar dots
  const dayTxMap = useMemo(() => {
    const map = new Map<number, { hasExpense: boolean; hasIncome: boolean; hasSaving: boolean }>();
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayNum = d.getDate();
        const existing = map.get(dayNum) || { hasExpense: false, hasIncome: false, hasSaving: false };
        if (tx.type === 'expense') existing.hasExpense = true;
        if (tx.type === 'income') existing.hasIncome = true;
        if (tx.type === 'saving') existing.hasSaving = true;
        map.set(dayNum, existing);
      }
    });
    return map;
  }, [transactions, year, month]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <AppText variant="h2" weight="800">
          Financial Calendar
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
          Daily transactions & activity map
        </AppText>
      </View>

      <FlatList
        data={dayTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            {/* Calendar Card */}
            <View
              style={[
                styles.calendarCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.xxl,
                  padding: spacing.lg,
                  ...shadows.soft,
                },
              ]}
            >
              {/* Month Switcher */}
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
                  <Feather name="chevron-left" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <AppText variant="subtitle1" weight="700">
                  {monthNames[month]} {year}
                </AppText>
                <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
                  <Feather name="chevron-right" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Day Name Header Row */}
              <View style={styles.weekDaysRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, idx) => (
                  <AppText key={idx} variant="caption" color={colors.textMuted} align="center" style={styles.weekCell}>
                    {w}
                  </AppText>
                ))}
              </View>

              {/* Month Grid */}
              <View style={styles.grid}>
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}

                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = selectedDay === dayNum;
                  const status = dayTxMap.get(dayNum);

                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      onPress={() => setSelectedDay(dayNum)}
                      style={[
                        styles.dayCell,
                        isSelected && {
                          backgroundColor: colors.primary,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? '800' : '500'}
                        color={isSelected ? '#FFFFFF' : colors.textPrimary}
                      >
                        {dayNum}
                      </AppText>
                      {/* Status indicator dots */}
                      <View style={styles.dotsRow}>
                        {status?.hasExpense && (
                          <View
                            style={[
                              styles.miniDot,
                              { backgroundColor: isSelected ? '#FFFFFF' : colors.error },
                            ]}
                          />
                        )}
                        {status?.hasIncome && (
                          <View
                            style={[
                              styles.miniDot,
                              { backgroundColor: isSelected ? '#FFFFFF' : colors.success },
                            ]}
                          />
                        )}
                        {status?.hasSaving && (
                          <View
                            style={[
                              styles.miniDot,
                              { backgroundColor: isSelected ? '#FFFFFF' : colors.info },
                            ]}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Selected Day Summary */}
            <View
              style={[
                styles.daySummaryBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.xl,
                  padding: spacing.md,
                  marginTop: spacing.lg,
                  marginBottom: spacing.md,
                  ...shadows.soft,
                },
              ]}
            >
              <View>
                <AppText variant="caption" color={colors.textSecondary}>
                  Activity on {monthNames[month].slice(0, 3)} {selectedDay}, {year}
                </AppText>
                <AppText variant="subtitle1" weight="700" style={{ marginTop: 2 }}>
                  {dayTransactions.length} Transactions
                </AppText>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                {dayExpense > 0 && (
                  <AppText variant="caption" color={colors.error} weight="700">
                    Outflow: -{FinancialCalculationsService.formatCurrency(dayExpense, currencySymbol)}
                  </AppText>
                )}
                {dayIncome > 0 && (
                  <AppText variant="caption" color={colors.success} weight="700">
                    Inflow: +{FinancialCalculationsService.formatCurrency(dayIncome, currencySymbol)}
                  </AppText>
                )}
              </View>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={(tx) =>
              navigation.navigate('Transactions', {
                screen: 'TransactionDetail',
                params: { transactionId: tx.id },
              })
            }
          />
        )}
        ListEmptyComponent={() => (
          <EmptyState
            iconName="calendar"
            title="No activity recorded"
            description={`No transactions found for ${monthNames[month]} ${selectedDay}.`}
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 4,
  },
  calendarCard: {
    width: '100%',
    borderWidth: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrowBtn: {
    padding: 8,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekCell: {
    width: '14.2%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 2,
    height: 4,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  daySummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
});
