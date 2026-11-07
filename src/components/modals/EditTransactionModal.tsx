import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { CategoryIcon } from '../common/CategoryIcon';
import { useAppStore } from '../../store/useAppStore';
import { Transaction } from '../../types';
import { pickReceiptFromGallery, captureReceiptWithCamera } from '../../services/receiptService';

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  visible,
  transaction,
  onClose,
  onSuccess,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const accounts = useAppStore((state) => state.accounts);
  const categories = useAppStore((state) => state.categories);
  const updateTransaction = useAppStore((state) => state.updateTransaction);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [selectedCategoryId, setSelectedCategoryId] = useState(transaction.categoryId);
  const [selectedAccountId, setSelectedAccountId] = useState(transaction.accountId);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [receiptUri, setReceiptUri] = useState<string | undefined>(transaction.receiptUri);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && transaction) {
      setTitle(transaction.title);
      setAmount(transaction.amount.toString());
      setSelectedCategoryId(transaction.categoryId);
      setSelectedAccountId(transaction.accountId);
      setNotes(transaction.notes || '');
      setReceiptUri(transaction.receiptUri);
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [visible, transaction]);

  // Filter categories matching transaction type
  const relevantCategories = categories.filter((c) => {
    if (transaction.type === 'expense') return c.type === 'expense' || c.type === 'both';
    if (transaction.type === 'income') return c.type === 'income' || c.type === 'both';
    return true;
  });

  const handleSave = async () => {
    setErrorMsg('');
    const parsedAmount = parseFloat(amount.trim());

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please enter a description / title');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

    if (!selectedAccount) {
      setErrorMsg('Please select a valid account');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateTransaction(transaction.id, {
        title: title.trim(),
        amount: parsedAmount,
        categoryId: selectedCategory?.id || transaction.categoryId,
        categoryName: selectedCategory?.name || transaction.categoryName,
        categoryIcon: selectedCategory?.icon || transaction.categoryIcon,
        categoryColor: selectedCategory?.color || transaction.categoryColor,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        notes: notes.trim() || undefined,
        receiptUri: receiptUri ?? undefined,
      });

      if (updated) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg('Failed to update transaction.');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error saving changes');
    } finally {
      setIsSubmitting(false);
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
                ...shadows.elevated,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.headerRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
              <View>
                <AppText variant="h3" weight="700">
                  Edit Transaction
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  Adjust amount, category, or payment details
                </AppText>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Amount Input */}
              <View style={{ marginBottom: spacing.md }}>
                <AppInput
                  label={`Amount (${currencySymbol})`}
                  value={amount}
                  onChangeText={(val) => {
                    setAmount(val);
                    setErrorMsg('');
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  iconName="dollar-sign"
                />
              </View>

              {/* Title Input */}
              <View style={{ marginBottom: spacing.md }}>
                <AppInput
                  label="Title / Merchant"
                  value={title}
                  onChangeText={(val) => {
                    setTitle(val);
                    setErrorMsg('');
                  }}
                  placeholder="e.g. Grocery Store"
                  iconName="edit-3"
                />
              </View>

              {/* Category Picker */}
              <View style={{ marginBottom: spacing.md }}>
                <AppText variant="subtitle2" weight="600" style={{ marginBottom: spacing.xs }}>
                  Category
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {relevantCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        activeOpacity={0.7}
                        onPress={() => setSelectedCategoryId(cat.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: radius.full,
                            marginRight: spacing.xs,
                          },
                        ]}
                      >
                        <CategoryIcon iconName={cat.icon} color={isSelected ? colors.primary : cat.color} size={14} containerSize={24} />
                        <AppText
                          variant="caption"
                          weight={isSelected ? '700' : '500'}
                          color={isSelected ? colors.primary : colors.textPrimary}
                          style={{ marginLeft: 6 }}
                        >
                          {cat.name}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Account Picker */}
              <View style={{ marginBottom: spacing.md }}>
                <AppText variant="subtitle2" weight="600" style={{ marginBottom: spacing.xs }}>
                  Account
                </AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        activeOpacity={0.7}
                        onPress={() => setSelectedAccountId(acc.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: radius.full,
                            marginRight: spacing.xs,
                          },
                        ]}
                      >
                        <Feather
                          name={acc.type === 'cash' ? 'dollar-sign' : acc.type === 'wallet' ? 'smartphone' : 'credit-card'}
                          size={14}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <AppText
                          variant="caption"
                          weight={isSelected ? '700' : '500'}
                          color={isSelected ? colors.primary : colors.textPrimary}
                          style={{ marginLeft: 6 }}
                        >
                          {acc.name}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Notes Input */}
              <View style={{ marginBottom: spacing.md }}>
                <AppInput
                  label="Notes (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any extra details..."
                  iconName="file-text"
                />
              </View>

              {/* Receipt Attachment Section */}
              <View style={{ marginBottom: spacing.lg }}>
                <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                  Receipt / Bill Attachment
                </AppText>
                {receiptUri ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surfaceVariant,
                      borderRadius: radius.lg,
                      padding: spacing.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Image
                      source={{ uri: receiptUri }}
                      style={{ width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.border }}
                    />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <AppText variant="body2" weight="600" numberOfLines={1}>
                        Receipt attached
                      </AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        Saved in secure app storage
                      </AppText>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setReceiptUri(undefined)}
                      style={{
                        padding: spacing.xs,
                        backgroundColor: `${colors.error}15`,
                        borderRadius: radius.full,
                        marginRight: spacing.xs,
                      }}
                    >
                      <Feather name="trash-2" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={async () => {
                        const uri = await captureReceiptWithCamera();
                        if (uri) setReceiptUri(uri);
                      }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.surfaceVariant,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                      }}
                    >
                      <Feather name="camera" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                      <AppText variant="caption" weight="600" color={colors.primary}>
                        Take Photo
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={async () => {
                        const uri = await pickReceiptFromGallery();
                        if (uri) setReceiptUri(uri);
                      }}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.surfaceVariant,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                      }}
                    >
                      <Feather name="image" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                      <AppText variant="caption" weight="600" color={colors.primary}>
                        Choose Photo
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {errorMsg ? (
                <AppText
                  variant="caption"
                  color={colors.error}
                  weight="700"
                  style={{ marginBottom: spacing.md, textAlign: 'center' }}
                >
                  {errorMsg}
                </AppText>
              ) : null}

              {/* Save Button */}
              <AppButton
                title={isSubmitting ? 'Saving...' : 'Save Changes'}
                onPress={handleSave}
                fullWidth
                disabled={isSubmitting}
              />
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
    maxHeight: '90%',
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
  pickerRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
});
