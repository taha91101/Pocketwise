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
import { DetectedTransaction } from '../../types';
import { Feather } from '@expo/vector-icons';
import { FinancialCalculationsService } from '../../services/financialCalculations';

export interface ReviewDetectedTransactionModalProps {
  visible: boolean;
  detectedTransaction: DetectedTransaction | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewDetectedTransactionModal: React.FC<ReviewDetectedTransactionModalProps> = ({
  visible,
  detectedTransaction,
  onClose,
  onSuccess,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const accounts = useAppStore((state) => state.accounts);
  const categories = useAppStore((state) => state.categories);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);
  const confirmDetectedTransaction = useAppStore((state) => state.confirmDetectedTransaction);
  const rejectDetectedTransaction = useAppStore((state) => state.rejectDetectedTransaction);

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && detectedTransaction) {
      setAmount(detectedTransaction.amount.toString());
      setMerchant(detectedTransaction.merchant);
      setType(detectedTransaction.type);
      setNotes(detectedTransaction.notes || `Auto-detected via ${detectedTransaction.paymentProvider}`);
      setError('');

      // Find best category match
      const matchedCat =
        categories.find((c) => c.id === detectedTransaction.suggestedCategoryId) ||
        categories.find((c) => c.name.toLowerCase() === detectedTransaction.suggestedCategory.toLowerCase()) ||
        categories.find((c) => c.id === 'cat-other-exp') ||
        categories[0];
      if (matchedCat) setSelectedCatId(matchedCat.id);

      // Select default account
      const preferredAcc =
        accounts.find((a) => a.type === 'bank') ||
        accounts.find((a) => a.type === 'wallet') ||
        accounts[0];
      if (preferredAcc) setSelectedAccountId(preferredAcc.id);
    }
  }, [visible, detectedTransaction, categories, accounts]);

  if (!detectedTransaction) return null;

  const relevantCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  );

  const handleConfirm = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!merchant.trim()) {
      setError('Please enter a payee or merchant name');
      return;
    }

    try {
      setIsSubmitting(true);
      const cat = categories.find((c) => c.id === selectedCatId);
      const acc = accounts.find((a) => a.id === selectedAccountId);

      await confirmDetectedTransaction(detectedTransaction.id, {
        amount: numAmount,
        title: merchant.trim(),
        merchant: merchant.trim(),
        type,
        categoryId: cat?.id || 'cat-other-exp',
        categoryName: cat?.name || 'Other Expenses',
        categoryIcon: cat?.icon || 'tag',
        categoryColor: cat?.color || '#64748B',
        accountId: acc?.id || 'acc-default',
        accountName: acc?.name || 'Bank Account',
        notes: notes.trim(),
      });

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setIsSubmitting(false);
      setError(e.message || 'Failed to confirm transaction');
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await rejectDetectedTransaction(detectedTransaction.id);
      setIsSubmitting(false);
      onClose();
    } catch (e: any) {
      setIsSubmitting(false);
      setError(e.message || 'Failed to reject transaction');
    }
  };

  const confidencePct = Math.round((detectedTransaction.detectionConfidence || 0.8) * 100);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              maxHeight: height * 0.9,
              ...shadows.elevated,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }]}>
            <View>
              <AppText variant="h3" weight="800">
                Review Detected Payment
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Confirm details to record this transaction
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.full },
              ]}
            >
              <Feather name="x" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Detection Info Card */}
            <View
              style={[
                styles.detectionBadgeCard,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: radius.xl,
                  padding: spacing.md,
                  marginTop: spacing.sm,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <View style={styles.badgeRow}>
                <View style={styles.badgeTag}>
                  <Feather name="zap" size={14} color={colors.primary} />
                  <AppText variant="caption" color={colors.primary} weight="700" style={{ marginLeft: 4 }}>
                    {detectedTransaction.paymentProvider} • UPI
                  </AppText>
                </View>

                <View
                  style={[
                    styles.confidenceTag,
                    {
                      backgroundColor:
                        confidencePct >= 85
                          ? colors.successLight
                          : colors.warningLight || '#FEF3C7',
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={confidencePct >= 85 ? colors.success : '#D97706'}
                    weight="700"
                  >
                    {confidencePct}% Match
                  </AppText>
                </View>
              </View>

              {detectedTransaction.upiReference && (
                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
                  Ref / UTR: {detectedTransaction.upiReference}
                </AppText>
              )}
            </View>

            {/* Error message */}
            {error ? (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.errorLight, borderRadius: radius.md, marginBottom: spacing.md },
                ]}
              >
                <Feather name="alert-circle" size={16} color={colors.error} />
                <AppText variant="caption" color={colors.error} style={{ marginLeft: spacing.xs, flex: 1 }}>
                  {error}
                </AppText>
              </View>
            ) : null}

            {/* Type Switcher */}
            <View
              style={[
                styles.typeToggle,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setType('expense')}
                style={[
                  styles.typeBtn,
                  type === 'expense' && { backgroundColor: colors.error, borderRadius: radius.md },
                ]}
              >
                <AppText
                  variant="subtitle2"
                  color={type === 'expense' ? '#FFF' : colors.textSecondary}
                  weight={type === 'expense' ? '700' : '500'}
                >
                  Expense
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType('income')}
                style={[
                  styles.typeBtn,
                  type === 'income' && { backgroundColor: colors.success, borderRadius: radius.md },
                ]}
              >
                <AppText
                  variant="subtitle2"
                  color={type === 'income' ? '#FFF' : colors.textSecondary}
                  weight={type === 'income' ? '700' : '500'}
                >
                  Refund / Income
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Amount Field */}
            <View style={{ marginBottom: spacing.md }}>
              <AppInput
                label="Amount"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                prefix={currencySymbol}
              />
            </View>

            {/* Payee / Merchant */}
            <View style={{ marginBottom: spacing.md }}>
              <AppInput
                label="Merchant / Payee"
                value={merchant}
                onChangeText={setMerchant}
                placeholder="Store or Payee name"
                iconName="shopping-bag"
              />
            </View>

            {/* Category Selector */}
            <AppText variant="caption" color={colors.textSecondary} weight="700" style={{ marginBottom: spacing.xs }}>
              CATEGORY
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              <View style={styles.catRow}>
                {relevantCategories.map((cat) => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCatId(cat.id)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? cat.color : colors.surface,
                          borderColor: isSelected ? cat.color : colors.border,
                          borderRadius: radius.xl,
                          paddingVertical: spacing.xs,
                          paddingHorizontal: spacing.md,
                          marginRight: spacing.sm,
                        },
                      ]}
                    >
                      <CategoryIcon
                        iconName={cat.icon}
                        color={isSelected ? '#FFF' : cat.color}
                        size={14}
                        containerSize={24}
                      />
                      <AppText
                        variant="caption"
                        color={isSelected ? '#FFF' : colors.textPrimary}
                        weight={isSelected ? '700' : '500'}
                        style={{ marginLeft: 6 }}
                      >
                        {cat.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <>
                <AppText variant="caption" color={colors.textSecondary} weight="700" style={{ marginBottom: spacing.xs }}>
                  DEBITED ACCOUNT
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                  <View style={styles.catRow}>
                    {accounts.map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          onPress={() => setSelectedAccountId(acc.id)}
                          style={[
                            styles.accChip,
                            {
                              backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                              borderColor: isSelected ? colors.primary : colors.border,
                              borderRadius: radius.lg,
                              paddingVertical: spacing.sm,
                              paddingHorizontal: spacing.md,
                              marginRight: spacing.sm,
                            },
                          ]}
                        >
                          <Feather
                            name={acc.type === 'bank' ? 'credit-card' : 'dollar-sign'}
                            size={14}
                            color={isSelected ? colors.primary : colors.textSecondary}
                          />
                          <AppText
                            variant="caption"
                            color={isSelected ? colors.primary : colors.textPrimary}
                            weight={isSelected ? '700' : '500'}
                            style={{ marginLeft: 6 }}
                          >
                            {acc.name}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Notes */}
            <View style={{ marginBottom: spacing.lg }}>
              <AppInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add optional notes"
                iconName="file-text"
              />
            </View>

            {/* Actions */}
            <AppButton
              title="Confirm & Add Transaction"
              variant="primary"
              iconName="check"
              onPress={handleConfirm}
              loading={isSubmitting}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />

            <AppButton
              title="Ignore / Reject"
              variant="ghost"
              iconName="trash-2"
              onPress={handleReject}
              disabled={isSubmitting}
              fullWidth
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionBadgeCard: {
    borderWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  typeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  accChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
