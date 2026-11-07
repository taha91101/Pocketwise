import React, { useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { AppButton } from '../../components/common/AppButton';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';
import { EditTransactionModal } from '../../components/modals/EditTransactionModal';
import { SplitWithFriendsModal } from '../../components/modals/SplitWithFriendsModal';
import { pickReceiptFromGallery, captureReceiptWithCamera } from '../../services/receiptService';

export interface TransactionDetailScreenProps {
  route: any;
  navigation: any;
}

export const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const { transactionId } = route.params || {};

  const transactions = useAppStore((state) => state.transactions);
  const sharedExpenses = useAppStore((state) => state.sharedExpenses);
  const deleteTransaction = useAppStore((state) => state.deleteTransaction);
  const duplicateTransaction = useAppStore((state) => state.duplicateTransaction);
  const updateTransaction = useAppStore((state) => state.updateTransaction);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewingFullReceipt, setIsViewingFullReceipt] = useState(false);
  const [isSplitWithFriendsModalOpen, setIsSplitWithFriendsModalOpen] = useState(false);

  const transaction = transactions.find((t) => t.id === transactionId);

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.lg }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <AppText variant="h3" align="center" style={{ marginTop: 40 }}>
            Transaction not found
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = async () => {
    await deleteTransaction(transaction.id);
    setIsConfirmDeleteOpen(false);
    navigation.goBack();
  };

  const handleDuplicate = async () => {
    const dup = await duplicateTransaction(transaction.id);
    if (dup) {
      navigation.goBack();
    }
  };

  const getAmountColor = () => {
    if (transaction.type === 'income') return colors.success;
    if (transaction.type === 'expense') return colors.textPrimary;
    if (transaction.type === 'saving') return colors.primary;
    return colors.textSecondary;
  };

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topNav, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.navBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="h3" weight="700">
          Transaction Details
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setIsEditModalOpen(true)}
            style={[
              styles.navBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, marginRight: 8 },
            ]}
          >
            <Feather name="edit-2" size={17} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDuplicate}
            style={[
              styles.navBtn,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
            ]}
          >
            <Feather name="copy" size={17} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {/* Main Amount Card */}
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xxl,
              padding: spacing.xl,
              ...shadows.soft,
            },
          ]}
        >
          <CategoryIcon
            iconName={transaction.categoryIcon}
            color={transaction.categoryColor || colors.primary}
            size={28}
            containerSize={64}
          />
          <AppText
            variant="amountLarge"
            color={getAmountColor()}
            weight="800"
            style={{ marginTop: spacing.md, marginBottom: 2 }}
          >
            {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
            {FinancialCalculationsService.formatCurrency(transaction.amount, currencySymbol)}
          </AppText>
          <AppText variant="subtitle1" weight="600">
            {transaction.title}
          </AppText>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.full,
                marginTop: spacing.sm,
              },
            ]}
          >
            <AppText variant="caption" color={colors.primary} weight="700">
              {transaction.type.toUpperCase()}
            </AppText>
          </View>

          {transaction.isAutomaticallyDetected && (
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: radius.full,
                  marginTop: 6,
                },
              ]}
            >
              <AppText variant="caption" color={colors.primary} weight="700">
                ⚡ Auto-detected via {transaction.paymentProvider || 'UPI'}
              </AppText>
            </View>
          )}
        </View>

        {/* Info Rows */}
        <View
          style={[
            styles.infoSection,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.lg,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <DetailRow label="Category" value={transaction.categoryName} icon="tag" />
          <DetailRow label="Date" value={formattedDate} icon="calendar" />
          {transaction.time && <DetailRow label="Time" value={transaction.time} icon="clock" />}
          <DetailRow label="Account" value={transaction.accountName} icon="credit-card" />
          {transaction.destinationAccountName && (
            <DetailRow label="Destination" value={transaction.destinationAccountName} icon="arrow-right" />
          )}
          {transaction.goalName && (
            <DetailRow label="Savings Goal" value={transaction.goalName} icon="target" />
          )}
          <DetailRow label="Payment Method" value={transaction.paymentMethod} icon="dollar-sign" />
          {transaction.paymentProvider && (
            <DetailRow label="Provider / App" value={transaction.paymentProvider} icon="zap" />
          )}
          {transaction.upiReference && (
            <DetailRow label="UPI Ref / UTR" value={transaction.upiReference} icon="hash" />
          )}
          {transaction.notes && <DetailRow label="Notes" value={transaction.notes} icon="file-text" />}
          <DetailRow label="Reference ID" value={transaction.id} icon="hash" isLast />
        </View>

        {/* Split Categories Breakdown (F2.6) */}
        {transaction.splits && transaction.splits.length > 0 && (
          <View
            style={[
              styles.infoSection,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.xl,
                padding: spacing.lg,
                marginTop: spacing.lg,
                ...shadows.soft,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <Feather name="scissors" size={16} color={colors.primary} />
              <AppText variant="subtitle2" weight="700" style={{ marginLeft: 8 }}>
                Split Breakdown ({transaction.splits.length} categories)
              </AppText>
            </View>

            {transaction.splits.map((split, idx) => (
              <View
                key={split.id || idx}
                style={[
                  styles.splitDetailRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: idx < transaction.splits!.length - 1 ? 1 : 0,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <CategoryIcon
                    iconName={split.categoryIcon || 'tag'}
                    color={split.categoryColor || colors.primary}
                    size={14}
                    containerSize={28}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <AppText variant="subtitle2" weight="600">
                      {split.categoryName}
                    </AppText>
                    {split.notes ? (
                      <AppText variant="caption" color={colors.textSecondary}>
                        {split.notes}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                <AppText variant="subtitle2" weight="700">
                  {FinancialCalculationsService.formatCurrency(split.amount, currencySymbol)}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {/* Receipt / Attachment Section */}
        <View
          style={[
            styles.infoSection,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radius.xl,
              padding: spacing.lg,
              marginTop: spacing.lg,
              ...shadows.soft,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Feather name="paperclip" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <AppText variant="subtitle2" weight="700">
              Receipt / Attachment
            </AppText>
          </View>

          {transaction.receiptUri ? (
            <View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsViewingFullReceipt(true)}
                style={{
                  position: 'relative',
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                  marginTop: spacing.xs,
                }}
              >
                <Image
                  source={{ uri: transaction.receiptUri }}
                  style={{
                    width: '100%',
                    height: 190,
                    borderRadius: radius.lg,
                    backgroundColor: colors.surfaceVariant,
                  }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: radius.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Feather name="maximize-2" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <AppText variant="caption" color="#FFFFFF" weight="600">
                    Full Screen
                  </AppText>
                </View>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm, gap: spacing.sm }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={async () => {
                    const uri = await pickReceiptFromGallery();
                    if (uri) {
                      await updateTransaction(transaction.id, { receiptUri: uri });
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 6,
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: radius.md,
                  }}
                >
                  <Feather name="refresh-cw" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                  <AppText variant="caption" weight="600" color={colors.primary}>
                    Replace
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={async () => {
                    await updateTransaction(transaction.id, { receiptUri: undefined });
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 6,
                    backgroundColor: `${colors.error}15`,
                    borderRadius: radius.md,
                  }}
                >
                  <Feather name="trash-2" size={13} color={colors.error} style={{ marginRight: 4 }} />
                  <AppText variant="caption" weight="600" color={colors.error}>
                    Remove
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: spacing.xs }}>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                No receipt attached to this transaction.
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={async () => {
                    const uri = await captureReceiptWithCamera();
                    if (uri) {
                      await updateTransaction(transaction.id, { receiptUri: uri });
                    }
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
                  }}
                >
                  <Feather name="camera" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                  <AppText variant="caption" weight="600" color={colors.primary}>
                    Take Photo
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={async () => {
                    const uri = await pickReceiptFromGallery();
                    if (uri) {
                      await updateTransaction(transaction.id, { receiptUri: uri });
                    }
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
                  }}
                >
                  <Feather name="image" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                  <AppText variant="caption" weight="600" color={colors.primary}>
                    Choose Photo
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ marginTop: spacing.xl }}>
          {transaction.type === 'expense' && (
            <AppButton
              title="Split with Friends"
              variant="outline"
              iconName="users"
              onPress={() => setIsSplitWithFriendsModalOpen(true)}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />
          )}
          <AppButton
            title="Edit Transaction"
            variant="primary"
            iconName="edit-2"
            onPress={() => setIsEditModalOpen(true)}
            fullWidth
            style={{ marginBottom: spacing.sm }}
          />
          <AppButton
            title="Duplicate Transaction"
            variant="outline"
            iconName="copy"
            onPress={handleDuplicate}
            fullWidth
            style={{ marginBottom: spacing.sm }}
          />
          <AppButton
            title="Delete Transaction"
            variant="danger"
            iconName="trash-2"
            onPress={() => setIsConfirmDeleteOpen(true)}
            fullWidth
          />
        </View>
      </ScrollView>

      <EditTransactionModal
        visible={isEditModalOpen}
        transaction={transaction}
        onClose={() => setIsEditModalOpen(false)}
      />

      <SplitWithFriendsModal
        visible={isSplitWithFriendsModalOpen}
        transaction={transaction}
        onClose={() => setIsSplitWithFriendsModalOpen(false)}
      />

      <ConfirmDialog
        visible={isConfirmDeleteOpen}
        title="Delete Transaction?"
        message="This will remove this transaction and revert its balance impact on your account."
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />

      {/* Full-Screen Receipt Viewer Modal */}
      {transaction.receiptUri && (
        <Modal
          visible={isViewingFullReceipt}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setIsViewingFullReceipt(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              }}
            >
              <AppText variant="subtitle1" color="#FFFFFF" weight="700">
                Receipt Preview
              </AppText>
              <TouchableOpacity
                onPress={() => setIsViewingFullReceipt(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
              <Image
                source={{ uri: transaction.receiptUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            <View
              style={{
                padding: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.15)',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <AppText variant="caption" color="rgba(255,255,255,0.7)">
                {transaction.title} • {transaction.date.split('T')[0]}
              </AppText>
              <TouchableOpacity
                onPress={async () => {
                  setIsViewingFullReceipt(false);
                  await updateTransaction(transaction.id, { receiptUri: undefined });
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: 'rgba(255,59,48,0.25)',
                  borderRadius: radius.md,
                }}
              >
                <Feather name="trash-2" size={15} color="#FF453A" style={{ marginRight: 6 }} />
                <AppText variant="caption" color="#FF453A" weight="700">
                  Delete
                </AppText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  isLast?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, icon, isLast }) => {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.detailRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: spacing.md, marginBottom: spacing.md },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Feather name={icon} size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <AppText variant="body2" color={colors.textSecondary}>
          {label}
        </AppText>
      </View>
      <AppText variant="subtitle2" weight="600" style={{ maxWidth: 180 }} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mainCard: {
    alignItems: 'center',
    borderWidth: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  infoSection: {
    borderWidth: 1,
  },
  splitDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
