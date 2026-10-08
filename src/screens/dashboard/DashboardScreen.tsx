import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { BalanceCard } from '../../components/financial/BalanceCard';
import { QuickActions } from '../../components/financial/QuickActions';
import { MonthlyOverviewCard } from '../../components/financial/MonthlyOverviewCard';
import { SpendingChart } from '../../components/financial/SpendingChart';
import { CategoryBreakdown } from '../../components/financial/CategoryBreakdown';
import { SavingsGoalCard } from '../../components/financial/SavingsGoalCard';
import { UpcomingPaymentCard } from '../../components/financial/UpcomingPaymentCard';
import { FinancialInsightCard } from '../../components/financial/FinancialInsightCard';
import { TransactionItem } from '../../components/financial/TransactionItem';
import { AddTransactionModal } from '../../components/modals/AddTransactionModal';
import { TransferModal } from '../../components/modals/TransferModal';
import { AddGoalFundsModal } from '../../components/modals/AddGoalFundsModal';
import { WithdrawGoalFundsModal } from '../../components/modals/WithdrawGoalFundsModal';
import { AppButton } from '../../components/common/AppButton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAppStore } from '../../store/useAppStore';
import { SavingsGoal, Transaction, TransactionType } from '../../types';
import { Feather } from '@expo/vector-icons';
import { NotificationService } from '../../services/notificationService';
import { FinancialCalculationsService } from '../../services/financialCalculations';

export interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const userName = useAppStore((state) => state.settings.userName);
  const transactions = useAppStore((state) => state.transactions);
  const savingsGoals = useAppStore((state) => state.savingsGoals);
  const recurringPayments = useAppStore((state) => state.recurringPayments);
  const insights = useAppStore((state) => state.insights);
  const settings = useAppStore((state) => state.settings);
  const budgets = useAppStore((state) => state.budgets);
  const overview = useAppStore((state) => state.overview);

  const [refreshing, setRefreshing] = useState(false);
  const [modalType, setModalType] = useState<TransactionType | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [activeGoalForDeposit, setActiveGoalForDeposit] = useState<SavingsGoal | null>(null);
  const [activeGoalForWithdraw, setActiveGoalForWithdraw] = useState<SavingsGoal | null>(null);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Notifications calculation
  const notifications = NotificationService.checkAndGenerateNotifications(
    settings.notifications,
    budgets,
    transactions,
    recurringPayments,
    savingsGoals,
    settings.currencySymbol
  );

  const primaryGoal = savingsGoals.length > 0 ? savingsGoals[0] : null;
  const recentTransactions = transactions.slice(0, 5);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top App Header */}
      <View style={[styles.topHeader, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View>
          <AppText variant="h2" weight="800">
            Good day, {userName || 'Friend'} 👋
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Your financial overview
          </AppText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Reports')}
          style={[
            styles.notifBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
            },
          ]}
        >
          <Feather name="bell" size={20} color={colors.textPrimary} />
          {notifications.length > 0 && (
            <View
              style={[
                styles.notifBadge,
                { backgroundColor: colors.error, borderColor: colors.surface },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg, paddingBottom: 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Balance Card */}
        <View style={{ marginTop: spacing.sm }}>
          <BalanceCard />
        </View>

        {/* New User Welcome / Empty State */}
        {transactions.length === 0 && (
          <View
            style={[
              styles.welcomeCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.xxl,
                padding: spacing.xl,
                marginTop: spacing.lg,
                ...shadows.soft,
              },
            ]}
          >
            <AppText variant="h2" weight="800">
              Welcome 👋
            </AppText>
            <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: 4 }}>
              Let's get your finances organized.
            </AppText>

            <View style={[styles.welcomeBalanceBox, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg, padding: spacing.md, marginVertical: spacing.md }]}>
              <AppText variant="caption" color={colors.textSecondary}>
                Your balance
              </AppText>
              <AppText variant="amountLarge" weight="800" color={colors.textPrimary} style={{ marginTop: 2 }}>
                {FinancialCalculationsService.formatCurrency(overview.availableBalance, settings.currencySymbol)}
              </AppText>
            </View>

            <AppText variant="subtitle2" weight="700" color={colors.textPrimary}>
              No transactions yet.
            </AppText>
            <AppText variant="body2" color={colors.textSecondary} style={{ marginTop: 4, marginBottom: spacing.lg }}>
              Start tracking your money to see your financial overview here.
            </AppText>

            <View style={styles.welcomeActions}>
              <AppButton
                title="+ Add Expense"
                variant="outline"
                size="md"
                onPress={() => setModalType('expense')}
                style={{ marginBottom: spacing.sm }}
                fullWidth
              />
              <AppButton
                title="+ Add Income"
                variant="primary"
                size="md"
                onPress={() => setModalType('income')}
                style={{ marginBottom: spacing.sm }}
                fullWidth
              />
              <AppButton
                title="Create Savings Goal"
                variant="secondary"
                size="md"
                onPress={() => navigation.navigate('Savings')}
                fullWidth
              />
            </View>
          </View>
        )}

        {/* Quick Actions Bar */}
        <View style={{ marginTop: spacing.lg }}>
          <QuickActions
            onAddExpense={() => setModalType('expense')}
            onAddIncome={() => setModalType('income')}
            onAddSaving={() => setModalType('saving')}
            onTransfer={() => setIsTransferModalOpen(true)}
          />
        </View>

        {/* Monthly Overview (Income, Expenses, Saved) */}
        <View style={{ marginTop: spacing.lg }}>
          <MonthlyOverviewCard />
        </View>

        {/* Spending Chart */}
        <View style={{ marginTop: spacing.lg }}>
          <SpendingChart transactions={transactions} />
        </View>

        {/* Category Breakdown */}
        <View style={{ marginTop: spacing.lg }}>
          <CategoryBreakdown maxItems={4} />
        </View>

        {/* Savings Goal Highlight */}
        {primaryGoal && (
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle1" weight="700">
                Savings Target
              </AppText>
              <TouchableOpacity onPress={() => navigation.navigate('Savings')}>
                <AppText variant="caption" color={colors.primary} weight="700">
                  View All Goals
                </AppText>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: spacing.sm }}>
              <SavingsGoalCard
                goal={primaryGoal}
                onContributePress={(g) => setActiveGoalForDeposit(g)}
                onWithdrawPress={(g) => setActiveGoalForWithdraw(g)}
              />
            </View>
          </View>
        )}

        {/* Upcoming Payments */}
        {recurringPayments.filter((p) => p.isActive).length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle1" weight="700">
                Upcoming Bills
              </AppText>
              <TouchableOpacity onPress={() => navigation.navigate('Recurring')}>
                <AppText variant="caption" color={colors.primary} weight="700">
                  Manage
                </AppText>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: spacing.sm }}>
              {recurringPayments
                .filter((p) => p.isActive)
                .slice(0, 2)
                .map((pay) => (
                  <UpcomingPaymentCard key={pay.id} payment={pay} />
                ))}
            </View>
          </View>
        )}

        {/* Financial Insights */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <AppText variant="subtitle1" weight="700">
              Financial Insights 💡
            </AppText>
            {insights.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
                <AppText variant="caption" color={colors.primary} weight="700">
                  Reports
                </AppText>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ marginTop: spacing.sm }}>
            {insights.length > 0 ? (
              insights.slice(0, 2).map((ins) => (
                <FinancialInsightCard key={ins.id} insight={ins} />
              ))
            ) : (
              <View
                style={[
                  styles.emptyInsightBox,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radius.xl,
                    padding: spacing.lg,
                  },
                ]}
              >
                <Feather name="info" size={22} color={colors.textMuted} style={{ marginBottom: spacing.xs }} />
                <AppText variant="body2" color={colors.textSecondary} align="center">
                  Your insights will appear here once you have enough spending history.
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <AppText variant="subtitle1" weight="700">
              Recent Transactions
            </AppText>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <AppText variant="caption" color={colors.primary} weight="700">
                View All ({transactions.length})
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: spacing.sm }}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onPress={(item) =>
                    navigation.navigate('Transactions', {
                      screen: 'TransactionDetail',
                      params: { transactionId: item.id },
                    })
                  }
                />
              ))
            ) : (
              <EmptyState
                iconName="inbox"
                title="No transactions yet"
                description="Start tracking your expenses and incomes to see them here."
                actionTitle="Add Transaction"
                onActionPress={() => setModalType('expense')}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <AddTransactionModal
        visible={modalType !== null}
        initialType={modalType || 'expense'}
        onClose={() => setModalType(null)}
      />

      <TransferModal
        visible={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <AddGoalFundsModal
        visible={activeGoalForDeposit !== null}
        goal={activeGoalForDeposit}
        onClose={() => setActiveGoalForDeposit(null)}
      />

      <WithdrawGoalFundsModal
        visible={activeGoalForWithdraw !== null}
        goal={activeGoalForWithdraw}
        onClose={() => setActiveGoalForWithdraw(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  scrollContent: {
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcomeCard: {
    borderWidth: 1,
  },
  welcomeBalanceBox: {
    width: '100%',
  },
  welcomeActions: {
    width: '100%',
  },
  emptyInsightBox: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
