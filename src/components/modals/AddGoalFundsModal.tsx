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
import { SavingsGoal } from '../../types';
import { Feather } from '@expo/vector-icons';
import { FinancialCalculationsService } from '../../services/financialCalculations';

export interface AddGoalFundsModalProps {
  visible: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
}

export const AddGoalFundsModal: React.FC<AddGoalFundsModalProps> = ({ visible, goal, onClose }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accounts = useAppStore((state) => state.accounts);
  const contributeToGoal = useAppStore((state) => state.contributeToGoal);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
      if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
    }
  }, [visible, accounts]);

  if (!goal) return null;

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
    const success = await contributeToGoal(goal.id, selectedAcc.id, numAmount);
    if (success) {
      onClose();
    } else {
      setError('Failed to contribute. Please check balance.');
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
            <View style={styles.headerRow}>
              <View>
                <AppText variant="h3" weight="700">
                  Add to {goal.name}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  Current: {FinancialCalculationsService.formatCurrency(goal.currentAmount, currencySymbol)} / {FinancialCalculationsService.formatCurrency(goal.targetAmount, currencySymbol)}
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

              {/* Source Account */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                Deduct From Account
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {accounts.map((acc) => {
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
                        {acc.name} ({currencySymbol}{acc.balance.toLocaleString()})
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

              {/* Buttons */}
              <View style={[styles.bottomBtnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Confirm Deposit"
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
  chipRow: {
    flexDirection: 'row',
    marginBottom: 10,
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
