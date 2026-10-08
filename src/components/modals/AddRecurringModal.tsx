import React, { useState, useEffect } from 'react';
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
import { Feather } from '@expo/vector-icons';

export interface AddRecurringModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddRecurringModal: React.FC<AddRecurringModalProps> = ({ visible, onClose }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accounts = useAppStore((state) => state.accounts);
  const categories = useAppStore((state) => state.categories);
  const addRecurringPayment = useAppStore((state) => state.addRecurringPayment);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [reminderDays, setReminderDays] = useState('2');
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  React.useEffect(() => {
    if (visible) {
      setTitle('');
      setAmount('');
      setError('');
      setFrequency('monthly');
      setReminderDays('2');
      if (expenseCategories.length > 0) setCategoryId(expenseCategories[0].id);
      if (accounts.length > 0) setAccountId(accounts[0].id);
    }
  }, [visible]);

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a payment title');
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId) || expenseCategories[0];
    const selectedAcc = accounts.find((a) => a.id === accountId) || accounts[0];

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30); // 30 days default

    await addRecurringPayment({
      title: title.trim(),
      amount: numAmount,
      frequency,
      categoryId: selectedCat?.id || 'cat-subscription',
      categoryName: selectedCat?.name || 'Subscription',
      accountId: selectedAcc?.id || 'acc-bank-1',
      accountName: selectedAcc?.name || 'Bank',
      nextDueDate: nextDate.toISOString(),
      isActive: true,
      reminderDaysBefore: parseInt(reminderDays, 10) || 2,
    });

    onClose();
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
            <View style={styles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="repeat" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <AppText variant="h3" weight="700">
                  New Recurring Payment
                </AppText>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              style={{ maxHeight: height * 0.75 }}
            >
              {/* Amount Box */}
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

              <AppInput
                label="Payment Title"
                placeholder="e.g. Netflix, Wifi Bill, Rent, Gym"
                value={title}
                onChangeText={setTitle}
                iconName="file-text"
              />

              {/* Frequency */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                Frequency
              </AppText>
              <View style={[styles.freqRow, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
                {(['monthly', 'weekly', 'yearly'] as const).map((f) => {
                  const isSelected = frequency === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setFrequency(f)}
                      style={[
                        styles.freqBtn,
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
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                Category
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {expenseCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
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

              {/* Account */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                Pay From Account
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {accounts.map((acc) => {
                  const isSelected = accountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setAccountId(acc.id)}
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
                })}
              </ScrollView>

              {error ? (
                <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.xs }}>
                  {error}
                </AppText>
              ) : null}

              {/* Bottom buttons */}
              <View style={[styles.bottomBtnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Save Payment"
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
  freqRow: {
    flexDirection: 'row',
    padding: 4,
  },
  freqBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
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
  bottomBtnRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});
