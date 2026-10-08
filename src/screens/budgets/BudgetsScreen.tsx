import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { ProgressBar } from '../../components/common/ProgressBar';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddBudgetModal } from '../../components/modals/AddBudgetModal';
import { useAppStore } from '../../store/useAppStore';
import { Budget } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export const BudgetsScreen: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const budgets = useAppStore((state) => state.budgets);
  const transactions = useAppStore((state) => state.transactions);
  const deleteBudget = useAppStore((state) => state.deleteBudget);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Overall totals across budgets
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => {
    const perf = FinancialCalculationsService.calculateBudgetPerformance(b, transactions);
    return sum + perf.spent;
  }, 0);
  const totalBudgetRemaining = Math.max(0, totalBudgeted - totalBudgetSpent);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalBudgetSpent / totalBudgeted) * 100) : 0;

  const handleDelete = async () => {
    if (budgetToDelete) {
      await deleteBudget(budgetToDelete.id);
      setBudgetToDelete(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Screen Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View>
          <AppText variant="h2" weight="800">
            Budgets
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Manage category limits & stay in control
          </AppText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsAddModalOpen(true)}
          style={[
            styles.addBtn,
            { backgroundColor: colors.primary, borderRadius: radius.full, ...shadows.soft },
          ]}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg, paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => {
          if (budgets.length === 0) return null;
          return (
            <View style={{ marginBottom: spacing.lg }}>
            {/* Master Summary Card */}
            <View
              style={[
                styles.masterCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.xxl,
                  padding: spacing.lg,
                  ...shadows.soft,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Total Monthly Budget
                  </AppText>
                  <AppText variant="h2" weight="800" style={{ marginTop: 2 }}>
                    {FinancialCalculationsService.formatCurrency(totalBudgeted, currencySymbol)}
                  </AppText>
                </View>
                <Badge
                  label={overallPercentage >= 100 ? 'Exceeded' : overallPercentage >= 80 ? 'Near Limit' : 'On Track'}
                  variant={overallPercentage >= 100 ? 'error' : overallPercentage >= 80 ? 'warning' : 'success'}
                />
              </View>

              <ProgressBar
                progress={overallPercentage}
                height={8}
                style={{ marginVertical: spacing.md }}
              />

              <View style={styles.summaryRow}>
                <View>
                  <AppText variant="caption" color={colors.textMuted}>
                    Total Spent
                  </AppText>
                  <AppText variant="subtitle2" weight="700">
                    {FinancialCalculationsService.formatCurrency(totalBudgetSpent, currencySymbol)}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="caption" color={colors.textMuted}>
                    Remaining
                  </AppText>
                  <AppText variant="subtitle2" color={colors.primary} weight="700">
                    {FinancialCalculationsService.formatCurrency(totalBudgetRemaining, currencySymbol)}
                  </AppText>
                </View>
              </View>
            </View>

            <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
              Category Budgets
            </AppText>
          </View>
        );
      }}
        renderItem={({ item }) => {
          const perf = FinancialCalculationsService.calculateBudgetPerformance(item, transactions);
          return (
            <View
              style={[
                styles.budgetItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.xl,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  ...shadows.soft,
                },
              ]}
            >
              <View style={styles.itemHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CategoryIcon
                    iconName="tag"
                    color={perf.status === 'exceeded' ? colors.error : colors.primary}
                    size={16}
                    containerSize={36}
                  />
                  <View style={{ marginLeft: spacing.sm }}>
                    <AppText variant="subtitle2" weight="700">
                      {item.name}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Limit: {FinancialCalculationsService.formatCurrency(item.amount, currencySymbol)} • {item.period}
                    </AppText>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setBudgetToDelete(item)}
                  style={{ padding: 6 }}
                >
                  <Feather name="trash-2" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.itemStats, { marginTop: spacing.md }]}>
                <AppText variant="body2" weight="600">
                  {FinancialCalculationsService.formatCurrency(perf.spent, currencySymbol)} spent
                </AppText>
                <AppText
                  variant="body2"
                  color={perf.status === 'exceeded' ? colors.error : colors.textSecondary}
                  weight="600"
                >
                  {perf.status === 'exceeded'
                    ? `${FinancialCalculationsService.formatCurrency(perf.spent - item.amount, currencySymbol)} over limit!`
                    : `${FinancialCalculationsService.formatCurrency(perf.remaining, currencySymbol)} left`}
                </AppText>
              </View>

              <ProgressBar
                progress={perf.percentageUsed}
                height={6}
                style={{ marginTop: 6 }}
              />

              <View style={[styles.itemBottom, { marginTop: spacing.sm }]}>
                <AppText variant="caption" color={colors.textMuted}>
                  {perf.percentageUsed}% utilized
                </AppText>
                <Badge
                  label={perf.status === 'exceeded' ? 'Exceeded' : perf.status === 'warning' ? 'Near Limit' : 'Healthy'}
                  variant={perf.status === 'exceeded' ? 'error' : perf.status === 'warning' ? 'warning' : 'success'}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <EmptyState
            iconName="pie-chart"
            title="No budgets configured"
            description="Create category budgets to keep your expenditures in check."
            actionTitle="Add Budget"
            onActionPress={() => setIsAddModalOpen(true)}
          />
        )}
      />

      <AddBudgetModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ConfirmDialog
        visible={budgetToDelete !== null}
        title="Delete Budget?"
        message={`Are you sure you want to remove the budget for "${budgetToDelete?.name}"?`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setBudgetToDelete(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 8,
  },
  masterCard: {
    width: '100%',
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetItem: {
    width: '100%',
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
