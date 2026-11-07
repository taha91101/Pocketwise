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
import { Liability } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export interface RecordDebtPaymentModalProps {
  visible: boolean;
  liability: Liability | null;
  onClose: () => void;
}

export const RecordDebtPaymentModal: React.FC<RecordDebtPaymentModalProps> = ({
  visible,
  liability,
  onClose,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accounts = useAppStore((state) => state.accounts);
  const recordLiabilityPayment = useAppStore((state) => state.recordLiabilityPayment);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && liability) {
      setAmount(liability.minimumMonthlyPayment ? liability.minimumMonthlyPayment.toString() : '');
      const bankAcc = accounts.find((a) => a.type === 'bank') || accounts[0];
      setSelectedAccountId(bankAcc ? bankAcc.id : '');
      setError('');
    }
  }, [visible, liability]);

  if (!liability) return null;

  const handlePay = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    await recordLiabilityPayment(liability.id, numAmount, selectedAccountId || undefined);
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
                maxHeight: height * 0.85,
                ...shadows.elevated,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <View>
                <AppText variant="h3" weight="700">
                  Record Debt Payment
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {liability.name} • Remaining: {currencySymbol}{liability.remainingAmount.toLocaleString()}
                </AppText>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
            >
              {/* Amount Box */}
              <View
                style={[
                  styles.amountBox,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: radius.xl,
                    marginTop: spacing.md,
                  },
                ]}
              >
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

              {/* Quick Fill Options */}
              <View style={[styles.quickRow, { marginTop: spacing.sm }]}>
                {liability.minimumMonthlyPayment > 0 && (
                  <TouchableOpacity
                    onPress={() => setAmount(liability.minimumMonthlyPayment.toString())}
                    style={[
                      styles.quickPill,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.border,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <AppText variant="caption" weight="600" color={colors.textPrimary}>
                      Min: {currencySymbol}{liability.minimumMonthlyPayment.toLocaleString()}
                    </AppText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setAmount(liability.remainingAmount.toString())}
                  style={[
                    styles.quickPill,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border,
                      borderRadius: radius.full,
                      marginLeft: 8,
                    },
                  ]}
                >
                  <AppText variant="caption" weight="600" color={colors.primary}>
                    Pay in Full: {currencySymbol}{liability.remainingAmount.toLocaleString()}
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Pay From Account */}
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
                PAY FROM ACCOUNT
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setSelectedAccountId(acc.id)}
                      style={[
                        styles.accPill,
                        {
                          backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.lg,
                          marginRight: 8,
                        },
                      ]}
                    >
                      <AppText variant="caption" weight="700" color={isSelected ? colors.primary : colors.textPrimary}>
                        {acc.name}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {FinancialCalculationsService.formatCurrency(acc.balance, currencySymbol)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {error ? (
                <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.sm }}>
                  {error}
                </AppText>
              ) : null}

              <View style={[styles.btnRow, { marginTop: spacing.xl }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Confirm Payment"
                  variant="primary"
                  onPress={handlePay}
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
    marginBottom: 8,
  },
  closeBtn: {
    padding: 6,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  accPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  btnRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});

