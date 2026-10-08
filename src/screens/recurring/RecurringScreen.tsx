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
import { UpcomingPaymentCard } from '../../components/financial/UpcomingPaymentCard';
import { EmptyState } from '../../components/common/EmptyState';
import { AddRecurringModal } from '../../components/modals/AddRecurringModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { RecurringPayment } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export const RecurringScreen: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const recurringPayments = useAppStore((state) => state.recurringPayments);
  const toggleRecurringPayment = useAppStore((state) => state.toggleRecurringPayment);
  const deleteRecurringPayment = useAppStore((state) => state.deleteRecurringPayment);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<RecurringPayment | null>(null);

  const totalMonthlyCommitment = recurringPayments
    .filter((p) => p.isActive)
    .reduce((sum, p) => sum + p.amount, 0);

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
            Recurring Payments
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Manage subscriptions, rent, and utility bills
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
        data={recurringPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg, paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => {
          if (recurringPayments.length === 0) return null;
          return (
            <View style={{ marginBottom: spacing.lg }}>
            {/* Monthly Commitment Card */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.xxl,
                  padding: spacing.lg,
                  ...shadows.soft,
                },
              ]}
            >
              <AppText variant="caption" color={colors.textSecondary}>
                Monthly Committed Outflow
              </AppText>
              <AppText variant="h2" weight="800" style={{ marginTop: spacing.xs }}>
                {FinancialCalculationsService.formatCurrency(totalMonthlyCommitment, currencySymbol)}
                <AppText variant="caption" color={colors.textMuted}>
                  {' '}
                  / month
                </AppText>
              </AppText>
              <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>
                {recurringPayments.filter((p) => p.isActive).length} active subscriptions & recurring bills
              </AppText>
            </View>

            <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
              Active Payments
            </AppText>
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
            title="No recurring payments"
            description="Track regular bills like internet, rent, or Netflix."
            actionTitle="Add Recurring Bill"
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
});
