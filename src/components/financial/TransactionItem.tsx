import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Transaction } from '../../types';
import { AppText } from '../common/AppText';
import { CategoryIcon } from '../common/CategoryIcon';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { useAppStore } from '../../store/useAppStore';

export interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress }) => {
  const { colors, spacing, radius } = useTheme();
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const getAmountColor = () => {
    switch (transaction.type) {
      case 'income':
        return colors.success;
      case 'expense':
        return colors.textPrimary;
      case 'saving':
        return colors.primary;
      case 'transfer':
      default:
        return colors.textSecondary;
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      case 'saving':
        return '';
      case 'transfer':
      default:
        return '⇄ ';
    }
  };

  const formattedDate = () => {
    try {
      const d = new Date(transaction.date);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return 'Today';
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return transaction.date;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(transaction)}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <CategoryIcon
        iconName={transaction.categoryIcon}
        color={transaction.categoryColor || colors.primary}
        size={20}
        containerSize={44}
      />
      <View style={[styles.middleCol, { marginLeft: spacing.md }]}>
        <AppText variant="subtitle2" numberOfLines={1}>
          {transaction.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
          {formattedDate()} • {transaction.paymentMethod || transaction.accountName}
        </AppText>
      </View>
      <View style={styles.rightCol}>
        <AppText variant="amountSmall" color={getAmountColor()} weight="700">
          {getAmountPrefix()}
          {FinancialCalculationsService.formatCurrency(transaction.amount, currencySymbol)}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} align="right" style={{ marginTop: 2 }}>
          {transaction.categoryName}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  middleCol: {
    flex: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
});
