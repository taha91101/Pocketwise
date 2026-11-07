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
import { Transaction } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export interface SplitWithFriendsModalProps {
  visible: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
}

export const SplitWithFriendsModal: React.FC<SplitWithFriendsModalProps> = ({
  visible,
  transaction,
  onClose,
}) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const addSharedExpense = useAppStore((state) => state.addSharedExpense);
  const sharedExpenses = useAppStore((state) => state.sharedExpenses);
  const settleSharedExpense = useAppStore((state) => state.settleSharedExpense);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [friendName, setFriendName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [friendShare, setFriendShare] = useState('');
  const [type, setType] = useState<'you_lent' | 'you_borrowed'>('you_lent');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setFriendName('');
      setError('');
      if (transaction) {
        const total = transaction.amount;
        setTotalAmount(total.toString());
        setFriendShare((Math.round(total / 2)).toString());
        setNotes(`Split for ${transaction.title}`);
        setType('you_lent');
      } else {
        setTotalAmount('');
        setFriendShare('');
        setNotes('');
        setType('you_lent');
      }
    }
  }, [visible, transaction]);

  const handleTotalChange = (text: string) => {
    setTotalAmount(text);
    const parsed = parseFloat(text.replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      setFriendShare((Math.round(parsed / 2)).toString());
    }
  };

  const handleSave = async () => {
    if (!friendName.trim()) {
      setError("Please enter your friend's name");
      return;
    }
    const numShare = parseFloat(friendShare.replace(/,/g, ''));
    if (isNaN(numShare) || numShare <= 0) {
      setError('Please enter a valid share amount');
      return;
    }

    await addSharedExpense({
      transactionId: transaction?.id,
      friendName: friendName.trim(),
      amount: numShare,
      type,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const unsettledExpenses = sharedExpenses.filter((s) => !s.isSettled);

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
                  Split with Friends
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Track who paid, who owes, and settle easily
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
              {/* Type toggle: You lent vs You borrowed */}
              <View
                style={[
                  styles.typeToggle,
                  { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg, marginTop: spacing.md },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setType('you_lent')}
                  style={[
                    styles.toggleBtn,
                    type === 'you_lent' && {
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      ...shadows.soft,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={type === 'you_lent' ? '700' : '500'}
                    color={type === 'you_lent' ? colors.success : colors.textMuted}
                  >
                    I Paid (Friend Owes Me)
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType('you_borrowed')}
                  style={[
                    styles.toggleBtn,
                    type === 'you_borrowed' && {
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      ...shadows.soft,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={type === 'you_borrowed' ? '700' : '500'}
                    color={type === 'you_borrowed' ? colors.error : colors.textMuted}
                  >
                    Friend Paid (I Owe)
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Friend Name */}
              <AppInput
                label="Friend's Name"
                placeholder="e.g. Rahul Sharma"
                value={friendName}
                onChangeText={setFriendName}
                iconName="user"
                style={{ marginTop: spacing.md }}
              />

              {/* Total Amount */}
              <AppInput
                label={`Total Bill Amount (${currencySymbol})`}
                placeholder="0"
                keyboardType="numeric"
                value={totalAmount}
                onChangeText={handleTotalChange}
                iconName="file-text"
                style={{ marginTop: spacing.md }}
              />

              {/* Friend's Share */}
              <AppInput
                label={`Friend's Share to Record (${currencySymbol})`}
                placeholder="0"
                keyboardType="numeric"
                value={friendShare}
                onChangeText={setFriendShare}
                iconName="dollar-sign"
                style={{ marginTop: spacing.md }}
              />

              {/* Quick Split Buttons */}
              {totalAmount ? (
                <View style={styles.quickSplitRow}>
                  <TouchableOpacity
                    onPress={() => {
                      const tot = parseFloat(totalAmount.replace(/,/g, ''));
                      if (!isNaN(tot)) setFriendShare(Math.round(tot / 2).toString());
                    }}
                    style={[styles.splitPill, { backgroundColor: colors.surfaceVariant, borderRadius: radius.full }]}
                  >
                    <AppText variant="caption" weight="600" color={colors.primary}>
                      Split 50% ({currencySymbol}{Math.round(parseFloat(totalAmount || '0') / 2)})
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Notes */}
              <AppInput
                label="Notes (Optional)"
                placeholder="e.g. Dinner split, Uber ride"
                value={notes}
                onChangeText={setNotes}
                iconName="edit-3"
                style={{ marginTop: spacing.md }}
              />

              {error ? (
                <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.xs }}>
                  {error}
                </AppText>
              ) : null}

              {/* Save Button */}
              <View style={[styles.btnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Save Split"
                  variant="primary"
                  onPress={handleSave}
                  style={{ flex: 2, marginLeft: spacing.sm }}
                />
              </View>

              {/* Existing Unsettled Shared Balances */}
              {unsettledExpenses.length > 0 && (
                <View style={{ marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }}>
                  <AppText variant="subtitle2" weight="700" style={{ marginBottom: spacing.xs }}>
                    Active Shared Balances ({unsettledExpenses.length})
                  </AppText>

                  {unsettledExpenses.map((sh) => (
                    <View
                      key={sh.id}
                      style={[
                        styles.sharedItem,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.border,
                          borderRadius: radius.lg,
                          padding: spacing.sm,
                          marginBottom: spacing.xs,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <AppText variant="subtitle2" weight="700">
                          {sh.friendName}
                        </AppText>
                        <AppText variant="caption" color={sh.type === 'you_lent' ? colors.success : colors.error}>
                          {sh.type === 'you_lent' ? 'Owes you' : 'You owe'}: {currencySymbol}{sh.amount.toLocaleString()}
                          {sh.notes ? ` • ${sh.notes}` : ''}
                        </AppText>
                      </View>

                      <TouchableOpacity
                        onPress={() => settleSharedExpense(sh.id)}
                        style={[styles.settleBtn, { backgroundColor: colors.success, borderRadius: radius.md }]}
                      >
                        <AppText variant="caption" weight="700" color="#FFFFFF">
                          Settle
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
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
  typeToggle: {
    flexDirection: 'row',
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  quickSplitRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  splitPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  btnRow: {
    flexDirection: 'row',
  },
  sharedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  settleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});

