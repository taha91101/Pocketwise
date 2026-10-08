import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { CategoryIcon } from '../common/CategoryIcon';
import { useAppStore } from '../../store/useAppStore';
import { TransactionType } from '../../types';
import { Feather } from '@expo/vector-icons';

export interface AddTransactionModalProps {
  visible: boolean;
  initialType?: TransactionType;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  initialType = 'expense',
  onClose,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accounts = useAppStore((state) => state.accounts);
  const categories = useAppStore((state) => state.categories);
  const paymentMethods = useAppStore((state) => state.paymentMethods);
  const savingsGoals = useAppStore((state) => state.savingsGoals);
  const addTransaction = useAppStore((state) => state.addTransaction);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [type, setType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState('');

  // Default selection on open
  React.useEffect(() => {
    if (visible) {
      setType(initialType);
      setTitle('');
      setAmount('');
      setError('');
      setIsRecurring(false);

      if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
      if (paymentMethods.length > 0) setSelectedPaymentMethod(paymentMethods[0].name);

      const relevantCats = categories.filter(
        (c) => c.type === initialType || c.type === 'both'
      );
      if (relevantCats.length > 0) setSelectedCatId(relevantCats[0].id);
      if (savingsGoals.length > 0) setSelectedGoalId(savingsGoals[0].id);
    }
  }, [visible, initialType]);

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  );

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a transaction title / description');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === selectedCatId) || filteredCategories[0];
    const fallbackAccount = { id: 'acc-cash', name: 'Cash' };
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0] || fallbackAccount;
    const selectedGoal = savingsGoals.find((g) => g.id === selectedGoalId);

    try {
      await addTransaction({
        title: title.trim(),
        amount: numAmount,
        type,
        categoryId: selectedCategory?.id || 'cat-other-exp',
        categoryName: selectedCategory?.name || 'Other',
        categoryIcon: selectedCategory?.icon || 'tag',
        categoryColor: selectedCategory?.color || colors.primary,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        paymentMethod: selectedPaymentMethod || 'UPI',
        goalId: type === 'saving' ? selectedGoal?.id : undefined,
        goalName: type === 'saving' ? selectedGoal?.name : undefined,
        notes: notes.trim(),
        isRecurring,
        recurringFrequency: isRecurring ? frequency : undefined,
      });

      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to record transaction');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xxl,
                borderTopRightRadius: radius.xxl,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: Math.max(insets.bottom, 16),
                maxHeight: height * 0.9,
                ...shadows.elevated,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <AppText variant="h3" weight="700">
                New Transaction
              </AppText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              style={{ maxHeight: height * 0.75 }}
            >
              {/* Type Switcher */}
              <View style={[styles.typeSwitcher, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
                {(['expense', 'income', 'saving'] as const).map((t) => {
                  const isSelected = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        setType(t);
                        const newCats = categories.filter((c) => c.type === t || c.type === 'both');
                        if (newCats.length > 0) setSelectedCatId(newCats[0].id);
                      }}
                      style={[
                        styles.typeBtn,
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
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount Large Input */}
              <View style={[styles.amountBox, { backgroundColor: colors.surfaceVariant, borderRadius: radius.xl }]}>
                <AppText variant="h2" color={colors.primary} weight="800" style={{ marginRight: 6 }}>
                  {currencySymbol}
                </AppText>
                <AppInput
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  style={styles.amountInput}
                />
              </View>

              {/* Title Input */}
              <AppInput
                label="Description / Title"
                placeholder="e.g. Grocery store, Salary, Dinner"
                value={title}
                onChangeText={setTitle}
                iconName="edit-3"
              />

              {/* Category Picker */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                Category
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCatId(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? `${cat.color}20` : colors.surfaceVariant,
                          borderColor: isSelected ? cat.color : colors.border,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <CategoryIcon iconName={cat.icon} color={cat.color} size={14} containerSize={26} />
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? cat.color : colors.textPrimary}
                        style={{ marginLeft: 6 }}
                      >
                        {cat.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Account Picker */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                Account
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {accounts.length > 0 ? (
                  accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setSelectedAccountId(acc.id)}
                        style={[
                          styles.accountChip,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: radius.lg,
                          },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          weight={isSelected ? '700' : '500'}
                          color={isSelected ? colors.primary : colors.textPrimary}
                        >
                          {acc.name}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View
                    style={[
                      styles.accountChip,
                      {
                        backgroundColor: colors.primaryLight,
                        borderColor: colors.primary,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <AppText variant="caption" weight="700" color={colors.primary}>
                      💵 Cash (Primary)
                    </AppText>
                  </View>
                )}
              </ScrollView>

              {/* Savings Goal Picker (if saving) */}
              {type === 'saving' && savingsGoals.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                    Target Savings Goal
                  </AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {savingsGoals.map((g) => {
                      const isSelected = selectedGoalId === g.id;
                      return (
                        <TouchableOpacity
                          key={g.id}
                          onPress={() => setSelectedGoalId(g.id)}
                          style={[
                            styles.accountChip,
                            {
                              backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                              borderColor: isSelected ? colors.primary : colors.border,
                              borderRadius: radius.lg,
                            },
                          ]}
                        >
                          <AppText
                            variant="caption"
                            weight={isSelected ? '700' : '500'}
                            color={isSelected ? colors.primary : colors.textPrimary}
                          >
                            🎯 {g.name}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Payment Method */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                Payment Method
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {paymentMethods.map((pm) => {
                  const isSelected = selectedPaymentMethod === pm.name;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => setSelectedPaymentMethod(pm.name)}
                      style={[
                        styles.accountChip,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? colors.primary : colors.textPrimary}
                      >
                        {pm.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Notes */}
              <AppInput
                label="Notes (Optional)"
                placeholder="Additional details..."
                value={notes}
                onChangeText={setNotes}
                iconName="file-text"
                style={{ marginTop: spacing.md }}
              />

              {/* Recurring Toggle */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsRecurring(!isRecurring)}
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    marginTop: spacing.xs,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="repeat" size={18} color={isRecurring ? colors.primary : colors.textSecondary} />
                  <AppText variant="body2" weight="600" style={{ marginLeft: spacing.sm }}>
                    Make this recurring
                  </AppText>
                </View>
                <Feather
                  name={isRecurring ? 'check-square' : 'square'}
                  size={20}
                  color={isRecurring ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>

              {error ? (
                <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.sm }}>
                  {error}
                </AppText>
              ) : null}

              {/* Action Buttons */}
              <View style={[styles.bottomBtnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Save Transaction"
                  variant="primary"
                  onPress={handleSave}
                  style={{ flex: 2, marginLeft: spacing.sm }}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 6,
  },
  typeSwitcher: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 16,
  },
  amountInput: {
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    marginRight: 8,
  },
  accountChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    marginRight: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});
