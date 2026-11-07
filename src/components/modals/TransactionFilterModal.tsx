import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../common/AppText';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { Account, Category } from '../../types';

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export interface TransactionFilterModalProps {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: Category[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  minAmount: string;
  onChangeMinAmount: (val: string) => void;
  maxAmount: string;
  onChangeMaxAmount: (val: string) => void;
  sortBy: SortOption;
  onChangeSortBy: (sort: SortOption) => void;
  onReset: () => void;
}

const COMMON_PROVIDERS = [
  { id: 'all', label: 'All Providers' },
  { id: 'Google Pay', label: 'Google Pay' },
  { id: 'PhonePe', label: 'PhonePe' },
  { id: 'Paytm', label: 'Paytm' },
  { id: 'UPI', label: 'Other UPI' },
  { id: 'Cash', label: 'Cash' },
  { id: 'Card', label: 'Card / NetBanking' },
];

const SORT_OPTIONS: { id: SortOption; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'date_desc', label: 'Date: Newest First', icon: 'calendar' },
  { id: 'date_asc', label: 'Date: Oldest First', icon: 'calendar' },
  { id: 'amount_desc', label: 'Amount: High to Low', icon: 'arrow-down' },
  { id: 'amount_asc', label: 'Amount: Low to High', icon: 'arrow-up' },
];

export const TransactionFilterModal: React.FC<TransactionFilterModalProps> = ({
  visible,
  onClose,
  accounts,
  categories,
  selectedAccountId,
  onSelectAccount,
  selectedCategoryId,
  onSelectCategory,
  selectedProvider,
  onSelectProvider,
  minAmount,
  onChangeMinAmount,
  maxAmount,
  onChangeMaxAmount,
  sortBy,
  onChangeSortBy,
  onReset,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: radius.xxl,
                borderTopRightRadius: radius.xxl,
                ...shadows.elevated,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
              <View>
                <AppText variant="h3" weight="700">
                  Filter & Sort
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Refine ledger by account, provider, or amount
                </AppText>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 32 }}
            >
              {/* Sort By Section */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
                SORT ORDER
              </AppText>
              <View style={styles.chipGrid}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      activeOpacity={0.7}
                      onPress={() => onChangeSortBy(opt.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.md,
                        },
                      ]}
                    >
                      <Feather
                        name={opt.icon}
                        size={13}
                        color={isSelected ? colors.primary : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? colors.primary : colors.textPrimary}
                      >
                        {opt.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Account Filter */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
                ACCOUNT
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onSelectAccount('all')}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedAccountId === 'all' ? colors.primaryLight : colors.surfaceVariant,
                      borderColor: selectedAccountId === 'all' ? colors.primary : colors.border,
                      borderRadius: radius.full,
                      marginRight: spacing.xs,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={selectedAccountId === 'all' ? '700' : '500'}
                    color={selectedAccountId === 'all' ? colors.primary : colors.textPrimary}
                  >
                    All Accounts
                  </AppText>
                </TouchableOpacity>

                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      activeOpacity={0.7}
                      onPress={() => onSelectAccount(acc.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.full,
                          marginRight: spacing.xs,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? colors.primary : colors.textPrimary}
                      >
                        {acc.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Payment Provider Filter */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
                PAYMENT PROVIDER / APP
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {COMMON_PROVIDERS.map((prov) => {
                  const isSelected = selectedProvider === prov.id;
                  return (
                    <TouchableOpacity
                      key={prov.id}
                      activeOpacity={0.7}
                      onPress={() => onSelectProvider(prov.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radius.full,
                          marginRight: spacing.xs,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? colors.primary : colors.textPrimary}
                      >
                        {prov.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category Filter */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
                CATEGORY
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onSelectCategory('all')}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedCategoryId === 'all' ? colors.primaryLight : colors.surfaceVariant,
                      borderColor: selectedCategoryId === 'all' ? colors.primary : colors.border,
                      borderRadius: radius.full,
                      marginRight: spacing.xs,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={selectedCategoryId === 'all' ? '700' : '500'}
                    color={selectedCategoryId === 'all' ? colors.primary : colors.textPrimary}
                  >
                    All Categories
                  </AppText>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.7}
                      onPress={() => onSelectCategory(cat.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? `${cat.color}20` : colors.surfaceVariant,
                          borderColor: isSelected ? cat.color : colors.border,
                          borderRadius: radius.full,
                          marginRight: spacing.xs,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={isSelected ? '700' : '500'}
                        color={isSelected ? cat.color : colors.textPrimary}
                      >
                        {cat.name}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Amount Range */}
              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginTop: spacing.lg, marginBottom: spacing.xs }}>
                AMOUNT RANGE
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Min Amount"
                    placeholder="0"
                    keyboardType="numeric"
                    value={minAmount}
                    onChangeText={onChangeMinAmount}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Max Amount"
                    placeholder="No limit"
                    keyboardType="numeric"
                    value={maxAmount}
                    onChangeText={onChangeMaxAmount}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
                <AppButton
                  title="Reset Filters"
                  variant="outline"
                  onPress={onReset}
                  style={{ flex: 1 }}
                />
                <AppButton
                  title="Apply Filters"
                  variant="primary"
                  onPress={onClose}
                  style={{ flex: 1 }}
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
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  container: {
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    padding: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
});

