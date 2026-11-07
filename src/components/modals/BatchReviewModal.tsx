import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppButton } from '../common/AppButton';
import { useAppStore } from '../../store/useAppStore';

export interface BatchReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BatchReviewModal: React.FC<BatchReviewModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const detectedTransactions = useAppStore((state) => state.detectedTransactions);
  const categories = useAppStore((state) => state.categories);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol) || '₹';
  const confirmBatchDetectedTransactions = useAppStore(
    (state) => state.confirmBatchDetectedTransactions
  );
  const rejectBatchDetectedTransactions = useAppStore(
    (state) => state.rejectBatchDetectedTransactions
  );

  const pendingList = detectedTransactions.filter((d) => d.status === 'DETECTED');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<string | null>(null);
  const [showBulkCategoryPicker, setShowBulkCategoryPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize selected with all pending items when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedIds(pendingList.map((p) => p.id));
      setBulkCategoryId(null);
      setShowBulkCategoryPicker(false);
    }
  }, [visible, detectedTransactions]);

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === pendingList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingList.map((p) => p.id));
    }
  };

  const handleConfirmSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsProcessing(true);
      await confirmBatchDetectedTransactions(selectedIds, bulkCategoryId || undefined);
      setIsProcessing(false);
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setIsProcessing(false);
      Alert.alert('Batch Confirmation Error', e.message || 'Failed to confirm selected transactions');
    }
  };

  const handleRejectSelected = async () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Reject Selected Transactions',
      `Are you sure you want to ignore ${selectedIds.length} detected transactions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await rejectBatchDetectedTransactions(selectedIds);
              setIsProcessing(false);
              onClose();
            } catch (e: any) {
              setIsProcessing(false);
              Alert.alert('Error', e.message || 'Failed to reject transactions');
            }
          },
        },
      ]
    );
  };

  const selectedTotal = pendingList
    .filter((d) => selectedIds.includes(d.id))
    .reduce((sum, d) => sum + d.amount, 0);

  const selectedCategoryObj = bulkCategoryId
    ? categories.find((c) => c.id === bulkCategoryId)
    : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderBottomColor: colors.border,
              borderBottomWidth: 1,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText variant="h3" weight="800">
              Batch Review
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {pendingList.length} pending payments
            </AppText>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Toolbar: Select All & Bulk Category */}
        {pendingList.length > 0 && (
          <View
            style={[
              styles.toolbar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderBottomWidth: 1,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <TouchableOpacity onPress={handleToggleSelectAll} style={styles.selectAllRow}>
              <Feather
                name={selectedIds.length === pendingList.length ? 'check-square' : selectedIds.length > 0 ? 'minus-square' : 'square'}
                size={18}
                color={colors.primary}
              />
              <AppText variant="caption" weight="700" style={{ marginLeft: 6 }}>
                {selectedIds.length === pendingList.length ? 'Deselect All' : `Select All (${pendingList.length})`}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowBulkCategoryPicker(!showBulkCategoryPicker)}
              style={[
                styles.bulkCatBtn,
                {
                  backgroundColor: selectedCategoryObj
                    ? `${selectedCategoryObj.color}20`
                    : colors.surfaceVariant,
                  borderColor: selectedCategoryObj ? selectedCategoryObj.color : colors.border,
                  borderRadius: radius.full,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                },
              ]}
            >
              <Feather
                name="tag"
                size={12}
                color={selectedCategoryObj ? selectedCategoryObj.color : colors.textSecondary}
              />
              <AppText
                variant="caption"
                weight="700"
                color={selectedCategoryObj ? selectedCategoryObj.color : colors.textSecondary}
                style={{ marginHorizontal: 4 }}
              >
                {selectedCategoryObj ? selectedCategoryObj.name : 'Bulk Category'}
              </AppText>
              <Feather
                name={showBulkCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Bulk Category Picker Drawer */}
        {showBulkCategoryPicker && (
          <View
            style={[
              styles.categoryPickerDrawer,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
                borderBottomWidth: 1,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: 6 }}>
              Override category for all {selectedIds.length} selected items:
            </AppText>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item: cat }) => {
                const isSelected = bulkCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setBulkCategoryId(isSelected ? null : cat.id);
                      setShowBulkCategoryPicker(false);
                    }}
                    style={[
                      styles.categoryOptionChip,
                      {
                        backgroundColor: isSelected ? cat.color : colors.surface,
                        borderColor: isSelected ? cat.color : colors.border,
                        borderRadius: radius.full,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        marginRight: 6,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? '700' : '500'}
                      color={isSelected ? '#FFF' : colors.textPrimary}
                    >
                      {cat.name}
                    </AppText>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Items List */}
        <FlatList
          data={pendingList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: 20,
            flexGrow: 1,
          }}
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.id);
            const dateStr = new Date(item.transactionTimestamp).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleToggleSelect(item.id)}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.xs,
                    ...shadows.soft,
                  },
                ]}
              >
                <View style={styles.itemRow}>
                  {/* Checkbox */}
                  <View style={{ marginRight: 10 }}>
                    <Feather
                      name={isSelected ? 'check-circle' : 'circle'}
                      size={20}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </View>

                  {/* Merchant & Details */}
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle2" weight="700">
                      {item.merchant}
                    </AppText>
                    <View style={styles.metaRow}>
                      <AppText variant="caption" color={colors.textMuted}>
                        {item.paymentProvider} • {dateStr}
                      </AppText>
                      <View
                        style={[
                          styles.catPill,
                          {
                            backgroundColor: `${colors.primary}15`,
                            borderRadius: radius.full,
                            marginLeft: 8,
                          },
                        ]}
                      >
                        <AppText variant="caption" weight="600" color={colors.primary}>
                          {bulkCategoryId && isSelected
                            ? selectedCategoryObj?.name
                            : item.suggestedCategory}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  {/* Amount */}
                  <AppText variant="subtitle1" weight="800" color={colors.textPrimary}>
                    {currencySymbol}{item.amount.toFixed(2)}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={40} color={colors.success} />
              <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.md }}>
                No Pending Detections
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
                All auto-detected payments have been reviewed!
              </AppText>
            </View>
          }
        />

        {/* Footer Actions */}
        {pendingList.length > 0 && (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderTopWidth: 1,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.md,
                paddingBottom: spacing.lg,
              },
            ]}
          >
            <View style={styles.footerSummary}>
              <AppText variant="caption" color={colors.textSecondary}>
                Selected: {selectedIds.length} of {pendingList.length}
              </AppText>
              <AppText variant="subtitle1" weight="800">
                Total: {currencySymbol}{selectedTotal.toFixed(2)}
              </AppText>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleRejectSelected}
                disabled={selectedIds.length === 0 || isProcessing}
                style={[
                  styles.rejectBtn,
                  {
                    backgroundColor: `${colors.error}15`,
                    borderRadius: radius.lg,
                    opacity: selectedIds.length === 0 ? 0.5 : 1,
                  },
                ]}
              >
                <Feather name="trash-2" size={16} color={colors.error} />
                <AppText variant="subtitle2" weight="700" color={colors.error} style={{ marginLeft: 6 }}>
                  Reject
                </AppText>
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <AppButton
                  title={`Confirm ${selectedIds.length} Items`}
                  variant="primary"
                  iconName="check"
                  onPress={handleConfirmSelected}
                  loading={isProcessing}
                  disabled={selectedIds.length === 0}
                  fullWidth
                />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryPickerDrawer: {},
  categoryOptionChip: {
    borderWidth: 1,
  },
  itemCard: {},
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  catPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  footer: {},
  footerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 16,
  },
});

