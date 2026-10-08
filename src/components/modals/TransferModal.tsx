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
import { Feather } from '@expo/vector-icons';

export interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ visible, onClose }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accounts = useAppStore((state) => state.accounts);
  const transferBetweenAccounts = useAppStore((state) => state.transferBetweenAccounts);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (visible && accounts.length >= 2) {
      setFromAccountId(accounts[0].id);
      setToAccountId(accounts[1].id);
      setAmount('');
      setNotes('');
      setError('');
    }
  }, [visible, accounts]);

  const handleTransfer = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('Source and destination accounts must be different');
      return;
    }

    const success = await transferBetweenAccounts(fromAccountId, toAccountId, numAmount, notes);
    if (success) {
      onClose();
    } else {
      setError('Transfer failed. Please check account balances.');
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="refresh-cw" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <AppText variant="h3" weight="700">
                  Transfer Money
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

              {/* From Account */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                From Account
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {accounts.map((acc) => {
                  const isSelected = fromAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setFromAccountId(acc.id)}
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

              {/* To Account */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                To Account
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {accounts.map((acc) => {
                  const isSelected = toAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => setToAccountId(acc.id)}
                      style={[
                        styles.accountChip,
                        {
                          backgroundColor: isSelected ? colors.infoLight : colors.surfaceVariant,
                          borderColor: isSelected ? colors.info : colors.border,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? colors.info : colors.textPrimary}
                      >
                        {acc.name} ({currencySymbol}{acc.balance.toLocaleString()})
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Notes */}
              <AppInput
                label="Transfer Note"
                placeholder="e.g. ATM cash withdrawal"
                value={notes}
                onChangeText={setNotes}
                iconName="file-text"
                style={{ marginTop: spacing.md }}
              />

              <View
                style={[
                  styles.infoNote,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: radius.md,
                    padding: spacing.sm,
                    marginTop: spacing.xs,
                  },
                ]}
              >
                <Feather name="info" size={14} color={colors.info} style={{ marginRight: 6 }} />
                <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1 }}>
                  Transfers shift money between your accounts without affecting your monthly income or expense totals.
                </AppText>
              </View>

              {error ? (
                <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.sm }}>
                  {error}
                </AppText>
              ) : null}

              {/* Actions */}
              <View style={[styles.bottomBtnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Complete Transfer"
                  variant="primary"
                  onPress={handleTransfer}
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
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});
