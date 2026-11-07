import React, { useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppButton } from '../common/AppButton';
import { CategoryIcon } from '../common/CategoryIcon';
import { useAppStore } from '../../store/useAppStore';
import { Category, TransactionSplit } from '../../types';

export interface SplitTransactionModalProps {
  visible: boolean;
  totalAmount: number;
  initialSplits?: TransactionSplit[];
  onSave: (splits: TransactionSplit[]) => void;
  onClose: () => void;
}

export const SplitTransactionModal: React.FC<SplitTransactionModalProps> = ({
  visible,
  totalAmount,
  initialSplits,
  onSave,
  onClose,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const categories = useAppStore((state) => state.categories);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol) || '₹';

  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [activePickerSplitIndex, setActivePickerSplitIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialSplits && initialSplits.length > 0) {
        setSplits([...initialSplits]);
      } else {
        // Initialize with 2 equal or default splits
        const half = Math.round((totalAmount / 2) * 100) / 100;
        const remainder = Math.round((totalAmount - half) * 100) / 100;
        const cat1 = categories[0] || { id: 'cat-food', name: 'Food & Dining', icon: 'food', color: '#F59E0B' };
        const cat2 = categories[1] || categories[0];

        setSplits([
          {
            id: `split-${Date.now()}-1`,
            categoryId: cat1.id,
            categoryName: cat1.name,
            categoryIcon: cat1.icon,
            categoryColor: cat1.color,
            amount: half,
          },
          {
            id: `split-${Date.now()}-2`,
            categoryId: cat2.id,
            categoryName: cat2.name,
            categoryIcon: cat2.icon,
            categoryColor: cat2.color,
            amount: remainder,
          },
        ]);
      }
      setActivePickerSplitIndex(null);
    }
  }, [visible, initialSplits, totalAmount, categories]);

  const allocatedTotal = splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const roundedAllocated = Math.round(allocatedTotal * 100) / 100;
  const difference = Math.round((totalAmount - roundedAllocated) * 100) / 100;
  const isBalanced = Math.abs(difference) < 0.01;

  const handleAddSplit = () => {
    const unallocated = difference > 0 ? difference : 0;
    const cat = categories[splits.length % categories.length] || categories[0];
    const newSplit: TransactionSplit = {
      id: `split-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      amount: unallocated,
    };
    setSplits([...splits, newSplit]);
  };

  const handleRemoveSplit = (index: number) => {
    if (splits.length <= 1) {
      Alert.alert('Cannot Remove', 'A split transaction must have at least one category.');
      return;
    }
    const next = [...splits];
    next.splice(index, 1);
    setSplits(next);
  };

  const handleUpdateAmount = (index: number, text: string) => {
    const next = [...splits];
    const parsed = parseFloat(text.replace(/,/g, ''));
    next[index] = {
      ...next[index],
      amount: isNaN(parsed) ? 0 : parsed,
    };
    setSplits(next);
  };

  const handleUpdateNotes = (index: number, text: string) => {
    const next = [...splits];
    next[index] = { ...next[index], notes: text };
    setSplits(next);
  };

  const handleSelectCategory = (index: number, cat: Category) => {
    const next = [...splits];
    next[index] = {
      ...next[index],
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
    };
    setSplits(next);
    setActivePickerSplitIndex(null);
  };

  const handleSave = () => {
    if (!isBalanced) {
      Alert.alert(
        'Amounts Do Not Match',
        `The sum of all splits (${currencySymbol}${roundedAllocated}) must equal the transaction total (${currencySymbol}${totalAmount}). Difference: ${currencySymbol}${Math.abs(difference)}.`
      );
      return;
    }
    onSave(splits);
    onClose();
  };

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
              Split Transaction
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Allocate into multiple categories
            </AppText>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Balance Status Banner */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isBalanced ? colors.successLight : colors.surfaceVariant,
              borderColor: isBalanced ? colors.success : colors.border,
              borderRadius: radius.xl,
              padding: spacing.md,
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <View>
              <AppText variant="caption" color={colors.textSecondary}>
                TRANSACTION TOTAL
              </AppText>
              <AppText variant="h3" weight="800" color={colors.textPrimary}>
                {currencySymbol}{totalAmount.toFixed(2)}
              </AppText>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="caption" color={colors.textSecondary}>
                {isBalanced ? 'STATUS' : difference > 0 ? 'REMAINING' : 'OVER-ALLOCATED'}
              </AppText>
              <AppText
                variant="subtitle1"
                weight="800"
                color={isBalanced ? colors.success : difference > 0 ? colors.warning || '#D97706' : colors.error}
              >
                {isBalanced ? 'Balanced ✓' : `${currencySymbol}${Math.abs(difference).toFixed(2)}`}
              </AppText>
            </View>
          </View>
        </View>

        {/* Splits List */}
        <FlatList
          data={splits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: 20,
          }}
          renderItem={({ item, index }) => {
            const isPickingCategory = activePickerSplitIndex === index;

            return (
              <View
                style={[
                  styles.splitCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    ...shadows.soft,
                  },
                ]}
              >
                {/* Category selector row */}
                <View style={styles.splitHeaderRow}>
                  <TouchableOpacity
                    onPress={() =>
                      setActivePickerSplitIndex(isPickingCategory ? null : index)
                    }
                    style={[
                      styles.catSelectorBtn,
                      {
                        backgroundColor: `${item.categoryColor || colors.primary}15`,
                        borderColor: item.categoryColor || colors.primary,
                        borderRadius: radius.full,
                      },
                    ]}
                  >
                    <CategoryIcon
                      iconName={item.categoryIcon || 'tag'}
                      color={item.categoryColor || colors.primary}
                      size={12}
                      containerSize={22}
                    />
                    <AppText
                      variant="caption"
                      weight="700"
                      color={item.categoryColor || colors.primary}
                      style={{ marginHorizontal: 6 }}
                    >
                      {item.categoryName}
                    </AppText>
                    <Feather
                      name={isPickingCategory ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={item.categoryColor || colors.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleRemoveSplit(index)}
                    style={[
                      styles.trashBtn,
                      { backgroundColor: `${colors.error}15`, borderRadius: radius.md },
                    ]}
                  >
                    <Feather name="trash-2" size={14} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {/* Inline Category Picker options */}
                {isPickingCategory && (
                  <View style={[styles.inlinePicker, { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 10, paddingTop: 10 }]}>
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={categories}
                      keyExtractor={(cat) => cat.id}
                      renderItem={({ item: cat }) => {
                        const isCatSelected = cat.id === item.categoryId;
                        return (
                          <TouchableOpacity
                            onPress={() => handleSelectCategory(index, cat)}
                            style={[
                              styles.catOptionChip,
                              {
                                backgroundColor: isCatSelected ? cat.color : colors.surface,
                                borderColor: isCatSelected ? cat.color : colors.border,
                                borderRadius: radius.full,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                marginRight: 6,
                              },
                            ]}
                          >
                            <AppText
                              variant="caption"
                              weight={isCatSelected ? '700' : '500'}
                              color={isCatSelected ? '#FFF' : colors.textPrimary}
                            >
                              {cat.name}
                            </AppText>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                )}

                {/* Amount input row */}
                <View style={[styles.amountInputRow, { marginTop: 10 }]}>
                  <AppText variant="caption" color={colors.textSecondary} weight="700">
                    AMOUNT
                  </AppText>
                  <View
                    style={[
                      styles.amountField,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                      },
                    ]}
                  >
                    <AppText variant="caption" weight="700" color={colors.textMuted} style={{ paddingLeft: 8 }}>
                      {currencySymbol}
                    </AppText>
                    <TextInput
                      style={[styles.inputField, { color: colors.textPrimary }]}
                      value={item.amount > 0 ? item.amount.toString() : ''}
                      onChangeText={(t) => handleUpdateAmount(index, t)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Optional Note input */}
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    style={[
                      styles.noteInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={item.notes || ''}
                    onChangeText={(t) => handleUpdateNotes(index, t)}
                    placeholder="Note for this split (optional)"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              onPress={handleAddSplit}
              style={[
                styles.addSplitBtn,
                {
                  borderColor: colors.primary,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  paddingVertical: spacing.md,
                },
              ]}
            >
              <Feather name="plus-circle" size={16} color={colors.primary} />
              <AppText variant="subtitle2" weight="700" color={colors.primary} style={{ marginLeft: 6 }}>
                Add Another Split Category
              </AppText>
            </TouchableOpacity>
          }
        />

        {/* Footer Actions */}
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          <AppButton
            title={`Apply Splits (${currencySymbol}${roundedAllocated.toFixed(2)})`}
            variant="primary"
            onPress={handleSave}
            disabled={!isBalanced}
            fullWidth
          />
        </View>
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
  summaryCard: {},
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitCard: {
    borderWidth: 1,
  },
  splitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  trashBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlinePicker: {},
  catOptionChip: {
    borderWidth: 1,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    width: 140,
    height: 38,
  },
  inputField: {
    flex: 1,
    height: 38,
    paddingHorizontal: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  noteInput: {
    borderWidth: 1,
    height: 34,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  addSplitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
});

