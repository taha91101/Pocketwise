import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { AppText } from '../../components/common/AppText';
import { UpcomingPaymentCard } from '../../components/financial/UpcomingPaymentCard';
import { EmptyState } from '../../components/common/EmptyState';
import { AddRecurringModal } from '../../components/modals/AddRecurringModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { RecurringPayment } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { SubscriptionService } from '../../services/subscriptionService';
import { Feather } from '@expo/vector-icons';

export const RecurringScreen: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const { t } = useTranslation();
  const recurringPayments = useAppStore((state) => state.recurringPayments);
  const transactions = useAppStore((state) => state.transactions);
  const accounts = useAppStore((state) => state.accounts);
  const toggleRecurringPayment = useAppStore((state) => state.toggleRecurringPayment);
  const deleteRecurringPayment = useAppStore((state) => state.deleteRecurringPayment);
  const addRecurringPayment = useAppStore((state) => state.addRecurringPayment);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const autoRecordedNotice = useAppStore((state) => state.autoRecordedNotice);
  const clearAutoRecordedNotice = useAppStore((state) => state.clearAutoRecordedNotice);
  const undoAutoRecordedTransactions = useAppStore((state) => state.undoAutoRecordedTransactions);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<RecurringPayment | null>(null);

  // F3.3 Recurring Intelligence calculations
  const yearlyRollup = SubscriptionService.calculateYearlyRollup(recurringPayments);
  const detectedCandidates = SubscriptionService.detectSubscriptionCandidates(transactions, recurringPayments);
  const priceAlerts = SubscriptionService.detectPriceIncreases(recurringPayments, transactions);
  const duplicateGroups = SubscriptionService.detectDuplicateSubscriptions(recurringPayments);

  const handleAddDetectedSubscription = async (candidate: typeof detectedCandidates[0]) => {
    const primaryAcc = accounts[0] || { id: 'acc-cash', name: 'Cash' };
    await addRecurringPayment({
      title: candidate.title,
      amount: candidate.amount,
      categoryId: candidate.suggestedCategoryId,
      categoryName: candidate.suggestedCategoryName,
      accountId: primaryAcc.id,
      accountName: primaryAcc.name,
      frequency: candidate.frequency,
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      reminderDaysBefore: 2,
      autoRecord: true,
      isLikelySubscriptionDetected: true,
    });
  };

  const handlePayNow = async (payment: RecurringPayment) => {
    // Record payment as an expense transaction immediately
    await addTransaction({
      title: `${payment.title} (Recurring)`,
      amount: payment.amount,
      type: 'expense',
      categoryId: payment.categoryId,
      categoryName: payment.categoryName,
      categoryIcon: 'repeat',
      categoryColor: colors.primary,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      accountId: payment.accountId,
      accountName: payment.accountName,
      paymentMethod: 'Bank Transfer',
      notes: `Recurring payment recorded for ${payment.title}`,
    });
  };

  const handleDelete = async () => {
    if (paymentToDelete) {
      await deleteRecurringPayment(paymentToDelete.id);
      setPaymentToDelete(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View>
          <AppText variant="h2" weight="800">
            {t('recurring_title')}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            {t('recurring_subtitle')}
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

      {/* Auto-Recorded Catch-up Notice Toast */}
      {autoRecordedNotice && (
        <View
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.sm,
            padding: spacing.md,
            backgroundColor: colors.primaryLight,
            borderColor: colors.primary,
            borderWidth: 1,
            borderRadius: radius.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="zap" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <AppText variant="subtitle2" weight="700" color={colors.primary}>
                Auto-Posted Recurring Bills
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
              {autoRecordedNotice.count} due bill{autoRecordedNotice.count > 1 ? 's were' : ' was'} recorded and debited automatically.
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={async () => {
                await undoAutoRecordedTransactions();
              }}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.md,
              }}
            >
              <AppText variant="caption" weight="700" color="#FFFFFF">
                Undo
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={clearAutoRecordedNotice}
              style={{ padding: 4 }}
            >
              <Feather name="x" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={recurringPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg, paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => {
          return (
            <View style={{ marginBottom: spacing.lg }}>
              {/* Annual Cost Rollup Card (F3.3) */}
              <View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radius.xxl,
                    padding: spacing.lg,
                    marginBottom: spacing.md,
                    ...shadows.soft,
                  },
                ]}
              >
                <AppText variant="caption" color={colors.textSecondary}>
                  Total Annual Commitments
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs }}>
                  <AppText variant="h2" weight="800">
                    {FinancialCalculationsService.formatCurrency(yearlyRollup.totalAnnualCost, currencySymbol)}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 6 }}>
                    / year
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                  Equates to ~{FinancialCalculationsService.formatCurrency(yearlyRollup.totalMonthlyEquivalent, currencySymbol)}/month across {yearlyRollup.count} active commitments
                </AppText>
              </View>

              {/* Price Increase Alerts (F3.3) */}
              {priceAlerts.map((alert) => (
                <View
                  key={alert.recurringId}
                  style={[
                    styles.alertCard,
                    {
                      backgroundColor: colors.warning + '15',
                      borderColor: colors.warning,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="trending-up" size={18} color={colors.warning} style={{ marginRight: 8 }} />
                    <AppText variant="subtitle2" weight="700" color={colors.warning}>
                      Price Increase: {alert.title}
                    </AppText>
                  </View>
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                    Recent charge was {currencySymbol}{alert.newAmount.toLocaleString()} (+{alert.percentageIncrease}%), up from baseline of {currencySymbol}{alert.oldAmount.toLocaleString()}.
                  </AppText>
                </View>
              ))}

              {/* Duplicate Subscriptions Warning (F3.3) */}
              {duplicateGroups.map((dup, idx) => (
                <View
                  key={`dup-${idx}`}
                  style={[
                    styles.alertCard,
                    {
                      backgroundColor: colors.primary + '15',
                      borderColor: colors.primary,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="layers" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <AppText variant="subtitle2" weight="700" color={colors.primary}>
                      Duplicate Subscriptions Warning
                    </AppText>
                  </View>
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                    {dup.warning}
                  </AppText>
                </View>
              ))}

              {/* Detected Subscriptions (Auto-Watchdog F3.3) */}
              {detectedCandidates.length > 0 && (
                <View style={{ marginBottom: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                    <Feather name="eye" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                    <AppText variant="subtitle2" weight="700">
                      Detected Subscriptions ({detectedCandidates.length})
                    </AppText>
                  </View>
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                    Repeated payments spotted in your transaction history:
                  </AppText>

                  {detectedCandidates.map((cand) => (
                    <View
                      key={cand.id}
                      style={[
                        styles.detectedCard,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.border,
                          borderRadius: radius.lg,
                          padding: spacing.md,
                          marginBottom: spacing.xs,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText variant="subtitle2" weight="700">
                          {cand.title}
                        </AppText>
                        <AppText variant="caption" color={colors.textSecondary}>
                          {currencySymbol}{cand.amount.toLocaleString()} • {cand.frequency} ({cand.occurrences} transactions)
                        </AppText>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleAddDetectedSubscription(cand)}
                        style={[
                          styles.addCandBtn,
                          {
                            backgroundColor: colors.primary,
                            borderRadius: radius.md,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                          },
                        ]}
                      >
                        <AppText variant="caption" weight="700" color="#FFFFFF">
                          + Track
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {recurringPayments.length > 0 && (
                <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
                  Active Payments
                </AppText>
              )}
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.sm }}>
            <UpcomingPaymentCard
              payment={item}
              onPayNow={handlePayNow}
              onToggleActive={(p) => toggleRecurringPayment(p.id)}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            iconName="repeat"
            title={t('no_recurring_title')}
            description={t('no_recurring_desc')}
            actionTitle={t('add_recurring')}
            onActionPress={() => setIsAddModalOpen(true)}
          />
        )}
      />

      <AddRecurringModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ConfirmDialog
        visible={paymentToDelete !== null}
        title="Delete Recurring Payment?"
        message={`Are you sure you want to delete ${paymentToDelete?.title}?`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setPaymentToDelete(null)}
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
  summaryCard: {
    width: '100%',
    borderWidth: 1,
  },
  alertCard: {
    width: '100%',
    borderWidth: 1,
  },
  detectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  addCandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
