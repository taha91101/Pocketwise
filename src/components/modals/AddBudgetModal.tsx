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
import { Feather } from '@expo/vector-icons';

export interface AddBudgetModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ visible, onClose }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const categories = useAppStore((state) => state.categories);
  const addBudget = useAppStore((state) => state.addBudget);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'custom'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  React.useEffect(() => {
    if (visible) {
      setName('');
      setAmount('');
      setError('');
      setPeriod('monthly');
      setAlertThreshold('80');
      if (expenseCategories.length > 0) setCategoryId(expenseCategories[0].id);
    }
  }, [visible]);

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a budget name');
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    await addBudget({
      name: name.trim(),
      amount: numAmount,
      categoryId: categoryId || expenseCategories[0]?.id || 'cat-food',
      period,
      startDate,
      endDate,
      alertThreshold: parseInt(alertThreshold, 10) || 80,
    });

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
                maxHeight: height * 0.9,
                ...shadows.elevated,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <AppText variant="h3" weight="700">
                Create New Budget
              </AppText>
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

              <AppInput
                label="Budget Name"
                placeholder="e.g. Monthly Grocery Limit"
                value={name}
                onChangeText={setName}
                iconName="bookmark"
              />

              {/* Category Picker */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                Category Limit
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {expenseCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        setCategoryId(cat.id);
                        if (!name) setName(`${cat.name} Budget`);
                      }}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? `${cat.color}20` : colors.surfaceVariant,
                          borderColor: isSelected ? cat.color : colors.border,
                          borderRadius: radius.lg,
                        },
                      ]}
                    >
                      <CategoryIcon iconName={cat.icon} color={cat.color} size={14} containerSize={26} />
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? cat.color : colors.textPrimary}
                        style={{ marginLeft: 6 }}
                      >
                        {cat.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Period selection */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                Period
              </AppText>
              <View style={[styles.periodRow, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
                {(['monthly', 'weekly'] as const).map((p) => {
                  const isSelected = period === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPeriod(p)}
                      style={[
                        styles.periodBtn,
                        isSelected && {
                          backgroundColor: colors.surface,
                          borderRadius: radius.md,
                          ...shadows.soft,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={isSelected ? colors.textPrimary : colors.textMuted}
                        weight={isSelected ? '700' : '500'}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Alert threshold */}
              <AppInput
                label="Alert Warning At (% used)"
                placeholder="80"
                keyboardType="numeric"
                value={alertThreshold}
                onChangeText={setAlertThreshold}
                iconName="alert-triangle"
                style={{ marginTop: spacing.md }}
              />

              {error ? (
                <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.xs }}>
                  {error}
                </AppText>
              ) : null}

              {/* Action Buttons */}
              <View style={[styles.bottomBtnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Set Budget"
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
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    marginRight: 8,
  },
  periodRow: {
    flexDirection: 'row',
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomBtnRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});
