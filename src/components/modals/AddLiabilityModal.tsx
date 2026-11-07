import React, { useState } from 'react';
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
import { LiabilityType } from '../../types';
import { Feather } from '@expo/vector-icons';

export interface AddLiabilityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddLiabilityModal: React.FC<AddLiabilityModalProps> = ({ visible, onClose }) => {
  const { colors, radius, spacing, shadows } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const addLiability = useAppStore((state) => state.addLiability);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [name, setName] = useState('');
  const [type, setType] = useState<LiabilityType>('credit_card');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [statementDate, setStatementDate] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (visible) {
      setName('');
      setType('credit_card');
      setTotalAmount('');
      setRemainingAmount('');
      setCreditLimit('');
      setMinimumPayment('');
      setInterestRate('');
      const defaultDue = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDueDate(defaultDue);
      setStatementDate('5');
      setError('');
    }
  }, [visible]);

  const handleSave = async () => {
    const numRemaining = parseFloat(remainingAmount.replace(/,/g, ''));
    if (isNaN(numRemaining) || numRemaining < 0) {
      setError('Please enter a valid remaining debt amount');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a liability name');
      return;
    }

    const numTotal = parseFloat(totalAmount.replace(/,/g, '')) || numRemaining;
    const numLimit = creditLimit ? parseFloat(creditLimit.replace(/,/g, '')) : undefined;
    const numMin = parseFloat(minimumPayment.replace(/,/g, '')) || Math.round(numRemaining * 0.05);
    const numInterest = interestRate ? parseFloat(interestRate) : undefined;

    await addLiability({
      name: name.trim(),
      type,
      totalAmount: numTotal,
      remainingAmount: numRemaining,
      creditLimit: numLimit,
      minimumMonthlyPayment: numMin,
      interestRate: numInterest,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      statementDate: statementDate || undefined,
    });

    onClose();
  };

  const liabilityTypes: { key: LiabilityType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
    { key: 'loan', label: 'Personal Loan', icon: 'briefcase' },
    { key: 'emi', label: 'Consumer EMI', icon: 'smartphone' },
    { key: 'other', label: 'Other Debt', icon: 'tag' },
  ];

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
                Add Liability / Debt
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
              {/* Debt Type Selector */}
              <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                LIABILITY TYPE
              </AppText>
              <View style={styles.typeGrid}>
                {liabilityTypes.map((t) => {
                  const isSelected = type === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setType(t.key)}
                      style={[
                        styles.typeCard,
                        {
                          backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Feather
                        name={t.icon}
                        size={18}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginBottom: 4 }}
                      />
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      >
                        {t.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Name */}
              <AppInput
                label="Liability Name"
                placeholder="e.g. HDFC Millennia / Car Loan"
                value={name}
                onChangeText={setName}
                iconName="bookmark"
                style={{ marginTop: spacing.md }}
              />

              {/* Outstanding / Remaining Amount */}
              <AppInput
                label={`Current Outstanding Balance (${currencySymbol})`}
                placeholder="0"
                keyboardType="numeric"
                value={remainingAmount}
                onChangeText={setRemainingAmount}
                iconName="dollar-sign"
                style={{ marginTop: spacing.md }}
              />

              {/* Type specific inputs */}
              {type === 'credit_card' ? (
                <>
                  <AppInput
                    label={`Credit Limit (${currencySymbol})`}
                    placeholder="e.g. 100000"
                    keyboardType="numeric"
                    value={creditLimit}
                    onChangeText={setCreditLimit}
                    iconName="credit-card"
                    style={{ marginTop: spacing.md }}
                  />
                  <AppInput
                    label="Statement Cycle Day of Month (1-31)"
                    placeholder="e.g. 5"
                    keyboardType="numeric"
                    value={statementDate}
                    onChangeText={setStatementDate}
                    iconName="calendar"
                    style={{ marginTop: spacing.md }}
                  />
                </>
              ) : (
                <AppInput
                  label={`Original Total Amount (${currencySymbol})`}
                  placeholder="e.g. 50000"
                  keyboardType="numeric"
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  iconName="briefcase"
                  style={{ marginTop: spacing.md }}
                />
              )}

              <AppInput
                label={`Minimum Payment / EMI (${currencySymbol})`}
                placeholder="e.g. 2500"
                keyboardType="numeric"
                value={minimumPayment}
                onChangeText={setMinimumPayment}
                iconName="clock"
                style={{ marginTop: spacing.md }}
              />

              <AppInput
                label="Next Payment Due Date (YYYY-MM-DD)"
                placeholder="2026-06-25"
                value={dueDate}
                onChangeText={setDueDate}
                iconName="calendar"
                style={{ marginTop: spacing.md }}
              />

              <AppInput
                label="Annual Interest Rate % (Optional)"
                placeholder="e.g. 14.5"
                keyboardType="numeric"
                value={interestRate}
                onChangeText={setInterestRate}
                iconName="percent"
                style={{ marginTop: spacing.md }}
              />

              {error ? (
                <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.xs }}>
                  {error}
                </AppText>
              ) : null}

              {/* Save / Cancel buttons */}
              <View style={[styles.btnRow, { marginTop: spacing.lg }]}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={onClose}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Save Liability"
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  btnRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});

