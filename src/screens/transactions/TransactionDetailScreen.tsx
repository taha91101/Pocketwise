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
import { AppButton } from '../../components/common/AppButton';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export interface TransactionDetailScreenProps {
  route: any;
  navigation: any;
}

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const { transactionId } = route.params || {};

  const transactions = useAppStore((state) => state.transactions);
  const deleteTransaction = useAppStore((state) => state.deleteTransaction);
  const duplicateTransaction = useAppStore((state) => state.duplicateTransaction);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const transaction = transactions.find((t) => t.id === transactionId);

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.lg }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText variant="h3" align="center" style={{ marginTop: 40 }}>
            Transaction not found
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    setIsConfirmDeleteOpen(false);
    navigation.goBack();
  };

  const handleDuplicate = async () => {
    const dup = await duplicateTransaction(transaction.id);
    if (dup) {
      navigation.goBack();
    }
  };

  const getAmountColor = () => {
    if (transaction.type === 'income') return colors.success;
    if (transaction.type === 'expense') return colors.textPrimary;
    if (transaction.type === 'saving') return colors.primary;
    return colors.textSecondary;
  };

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topNav, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.navBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3" weight="700">
          Transaction Details
        </AppText>
        <TouchableOpacity
          onPress={handleDuplicate}
          style={[
            styles.navBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <Feather name="copy" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {/* Main Amount Card */}
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xxl,
              padding: spacing.xl,
              ...shadows.soft,
            },
          ]}
        >
          <CategoryIcon
            iconName={transaction.categoryIcon}
            color={transaction.categoryColor || colors.primary}
            size={28}
            containerSize={64}
          />
          <AppText
            variant="amountLarge"
            color={getAmountColor()}
            weight="800"
            style={{ marginTop: spacing.md, marginBottom: 2 }}
          >
            {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
            {FinancialCalculationsService.formatCurrency(transaction.amount, currencySymbol)}
          </AppText>
          <AppText variant="subtitle1" weight="600">
            {transaction.title}
          </AppText>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.full,
                marginTop: spacing.sm,
              },
            ]}
          >
            <AppText variant="caption" color={colors.primary} weight="700">
              {transaction.type.toUpperCase()}
            </AppText>
          </View>
        </View>

        {/* Info Rows */}
        <View
          style={[
            styles.infoSection,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.lg,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <DetailRow label="Category" value={transaction.categoryName} icon="tag" />
          <DetailRow label="Date" value={formattedDate} icon="calendar" />
          {transaction.time && <DetailRow label="Time" value={transaction.time} icon="clock" />}
          <DetailRow label="Account" value={transaction.accountName} icon="credit-card" />
          {transaction.destinationAccountName && (
            <DetailRow label="Destination" value={transaction.destinationAccountName} icon="arrow-right" />
          )}
          {transaction.goalName && (
            <DetailRow label="Savings Goal" value={transaction.goalName} icon="target" />
          )}
          <DetailRow label="Payment Method" value={transaction.paymentMethod} icon="dollar-sign" />
          {transaction.notes && <DetailRow label="Notes" value={transaction.notes} icon="file-text" />}
          <DetailRow label="Reference ID" value={transaction.id} icon="hash" isLast />
        </View>

        {/* Actions */}
        <View style={{ marginTop: spacing.xl }}>
          <AppButton
            title="Duplicate Transaction"
            variant="outline"
            iconName="copy"
            onPress={handleDuplicate}
            fullWidth
            style={{ marginBottom: spacing.sm }}
          />
          <AppButton
            title="Delete Transaction"
            variant="danger"
            iconName="trash-2"
            onPress={() => setIsConfirmDeleteOpen(true)}
            fullWidth
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={isConfirmDeleteOpen}
        title="Delete Transaction?"
        message="This will remove this transaction and revert its balance impact on your account."
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </SafeAreaView>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  isLast?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, icon, isLast }) => {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.detailRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: spacing.md, marginBottom: spacing.md },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Feather name={icon} size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <AppText variant="body2" color={colors.textSecondary}>
          {label}
        </AppText>
      </View>
      <AppText variant="subtitle2" weight="600" style={{ maxWidth: 180 }} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mainCard: {
    alignItems: 'center',
    borderWidth: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  infoSection: {
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
