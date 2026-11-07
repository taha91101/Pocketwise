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
import { useAppStore } from '../../store/useAppStore';
import { Account } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export interface AccountReconciliationModalProps {
  visible: boolean;
  account?: Account | null;
  onClose: () => void;
}

export const AccountReconciliationModal: React.FC<AccountReconciliationModalProps> = ({
  visible,
  account,
  onClose,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accounts = useAppStore((state) => state.accounts);
  const reconcileAccount = useAppStore((state) => state.reconcileAccount);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [actualBalanceStr, setActualBalanceStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setError('');
      setIsSubmitting(false);
      const targetAcc = account || accounts[0];
      if (targetAcc) {
        setSelectedAccountId(targetAcc.id);
        setActualBalanceStr(targetAcc.balance.toString());
        setNotes(`Reconciliation - ${new Date().toLocaleDateString('default', { month: 'short', year: 'numeric' })} statement`);
      }
    }
  }, [visible, account, accounts]);

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
  const currentBalance = activeAccount ? Number(activeAccount.balance) || 0 : 0;
  const parsedActual = parseFloat(actualBalanceStr);
  const isValidNumber = !isNaN(parsedActual) && actualBalanceStr.trim().length > 0;
  const difference = isValidNumber ? Math.round((parsedActual - currentBalance) * 100) / 100 : 0;

  const handleConfirm = async () => {
    if (!activeAccount) {
      setError('Please select an account');
      return;
    }
    if (!isValidNumber) {
      setError('Please enter a valid actual bank balance');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await reconcileAccount(activeAccount.id, parsedActual, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reconcile account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              maxHeight: height * 0.88,
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md,
            },
            shadows.medium,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <AppText variant="h3" weight="bold" color={colors.textPrimary}>
                Reconcile Account
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Align app ledger with real-world bank statement
              </AppText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.background }]}
            >
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Account Selector */}
            {accounts.length > 1 && (
              <View style={styles.section}>
                <AppText variant="subtitle2" weight="medium" color={colors.textSecondary} style={styles.label}>
                  Select Account
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountPills}>
                  {accounts.map((acc) => {
                    const isSelected = acc.id === selectedAccountId;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => {
                          setSelectedAccountId(acc.id);
                          setActualBalanceStr(acc.balance.toString());
                        }}
                        style={[
                          styles.accountPill,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: radius.md,
                          },
                        ]}
                      >
                        <AppText
                          variant="body1"
                          weight="semibold"
                          color={isSelected ? '#FFFFFF' : colors.textPrimary}
                        >
                          {acc.name}
                        </AppText>
                        <AppText
                          variant="caption"
                          color={isSelected ? '#E0E7FF' : colors.textSecondary}
                        >
                          {FinancialCalculationsService.formatCurrency(acc.balance, currencySymbol)}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Current App Balance Card */}
            <View
              style={[
                styles.balanceCard,
                { backgroundColor: colors.background, borderRadius: radius.lg, borderColor: colors.border },
              ]}
            >
              <View>
                <AppText variant="caption" color={colors.textSecondary}>
                  PocketWise Recorded Balance
                </AppText>
                <AppText variant="h3" weight="bold" color={colors.textPrimary}>
                  {FinancialCalculationsService.formatCurrency(currentBalance, currencySymbol)}
                </AppText>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.primaryLight + '20' }]}>
                <Feather name="book-open" size={16} color={colors.primary} />
                <AppText variant="caption" weight="semibold" color={colors.primary} style={{ marginLeft: 4 }}>
                  Ledger
                </AppText>
              </View>
            </View>

            {/* Actual Statement Balance Input */}
            <View style={styles.section}>
              <AppInput
                label={`Actual Bank Statement Balance (${currencySymbol})`}
                value={actualBalanceStr}
                onChangeText={(val) => {
                  setActualBalanceStr(val);
                  setError('');
                }}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            {/* Difference / Adjustment Preview */}
            {isValidNumber && (
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor:
                      difference === 0
                        ? colors.success + '15'
                        : difference > 0
                        ? colors.primary + '15'
                        : colors.error + '15',
                    borderColor:
                      difference === 0
                        ? colors.success
                        : difference > 0
                        ? colors.primary
                        : colors.error,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <View style={styles.previewHeader}>
                  <Feather
                    name={
                      difference === 0
                        ? 'check-circle'
                        : difference > 0
                        ? 'arrow-up-right'
                        : 'arrow-down-left'
                    }
                    size={20}
                    color={
                      difference === 0
                        ? colors.success
                        : difference > 0
                        ? colors.primary
                        : colors.error
                    }
                  />
                  <AppText
                    variant="body1"
                    weight="bold"
                    color={
                      difference === 0
                        ? colors.success
                        : difference > 0
                        ? colors.primary
                        : colors.error
                    }
                    style={{ marginLeft: 8 }}
                  >
                    {difference === 0
                      ? 'Balances match perfectly'
                      : difference > 0
                      ? `+${FinancialCalculationsService.formatCurrency(difference, currencySymbol)} Credit Adjustment`
                      : `-${FinancialCalculationsService.formatCurrency(Math.abs(difference), currencySymbol)} Debit Adjustment`}
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                  {difference === 0
                    ? 'No transaction entry is needed. Your account records are completely in sync.'
                    : difference > 0
                    ? `An income entry titled "Balance Reconciliation (Credit)" will be created for ${FinancialCalculationsService.formatCurrency(difference, currencySymbol)} to bring your balance up to date.`
                    : `An expense entry titled "Balance Reconciliation (Debit)" will be created for ${FinancialCalculationsService.formatCurrency(Math.abs(difference), currencySymbol)} to bring your balance down to date.`}
                </AppText>
              </View>
            )}

            {/* Notes */}
            <View style={styles.section}>
              <AppInput
                label="Notes & Reason (Optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. November 2026 statement match"
              />
            </View>

            {error ? (
              <AppText variant="caption" color={colors.error} style={styles.errorText}>
                {error}
              </AppText>
            ) : null}

            {/* Submit Button */}
            <AppButton
              title={difference === 0 ? 'Everything In Sync' : 'Confirm Reconciliation'}
              onPress={handleConfirm}
              loading={isSubmitting}
              style={{ marginTop: spacing.md }}
              variant={difference === 0 ? 'secondary' : 'primary'}
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
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
  },
  accountPills: {
    flexDirection: 'row',
  },
  accountPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 110,
  },
  balanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  previewCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 12,
  },
});
