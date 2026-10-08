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

export interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ visible, onClose }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const addSavingsGoal = useAppStore((state) => state.addSavingsGoal);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [category, setCategory] = useState('Personal');
  const [targetMonths, setTargetMonths] = useState('12');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (visible) {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setMonthlyContribution('');
      setTargetMonths('12');
      setError('');
    }
  }, [visible]);

  const handleSave = async () => {
    const numTarget = parseFloat(targetAmount.replace(/,/g, ''));
    const numCurrent = parseFloat(currentAmount.replace(/,/g, '')) || 0;
    const months = parseInt(targetMonths, 10) || 12;

    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Please enter a target amount greater than 0');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }

    const calculatedMonthly = parseFloat(monthlyContribution) || Math.ceil((numTarget - numCurrent) / months);

    const targetDateObj = new Date();
    targetDateObj.setMonth(targetDateObj.getMonth() + months);

    await addSavingsGoal({
      name: name.trim(),
      targetAmount: numTarget,
      currentAmount: numCurrent,
      targetDate: targetDateObj.toISOString(),
      monthlyContribution: calculatedMonthly,
      color: colors.primary,
      icon: 'target',
      category,
      isCompleted: numCurrent >= numTarget,
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="target" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <AppText variant="h3" weight="700">
                  New Savings Goal
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
              {/* Target Amount */}
              <View style={[styles.amountBox, { backgroundColor: colors.surfaceVariant, borderRadius: radius.xl }]}>
                <AppText variant="h2" color={colors.primary} weight="800" style={{ marginRight: 6 }}>
                  {currencySymbol}
                </AppText>
                <AppInput
                  placeholder="Target Amount"
                  keyboardType="numeric"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  style={styles.amountInput}
                />
              </View>

              <AppInput
                label="Goal Name"
                placeholder="e.g. Dream Vacation, New Car, Emergency Fund"
                value={name}
                onChangeText={setName}
                iconName="award"
              />

              <AppInput
                label="Initial Saved Amount (Optional)"
                placeholder="0"
                keyboardType="numeric"
                value={currentAmount}
                onChangeText={setCurrentAmount}
                iconName="shield"
              />

              <AppInput
                label="Target Timeframe (Months)"
                placeholder="12"
                keyboardType="numeric"
                value={targetMonths}
                onChangeText={setTargetMonths}
                iconName="calendar"
              />

              {/* Category tag */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                Category
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {['Emergency', 'Travel', 'Gadgets', 'Home', 'Vehicle', 'Education', 'Personal'].map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.catChip,
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
                        {cat}
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

              {/* Actions */}
              <View style={[styles.bottomBtnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Create Goal"
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
