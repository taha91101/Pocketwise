import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { TransferModal } from '../../components/modals/TransferModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { useAppStore } from '../../store/useAppStore';
import { Account, AccountType } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export const AccountsScreen: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const accounts = useAppStore((state) => state.accounts);
  const addAccount = useAppStore((state) => state.addAccount);
  const deleteAccount = useAppStore((state) => state.deleteAccount);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);

  // New Account form state
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('bank');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [accError, setAccError] = useState('');

  const totalBalance = FinancialCalculationsService.calculateTotalAccountBalance(accounts);

  const handleSaveAccount = async () => {
    const bal = parseFloat(newAccBalance.replace(/,/g, ''));
    if (isNaN(bal)) {
      setAccError('Please enter a valid starting balance');
      return;
    }
    if (!newAccName.trim()) {
      setAccError('Please enter an account name');
      return;
    }

    const typeIcons: Record<AccountType, string> = {
      bank: 'credit-card',
      cash: 'dollar-sign',
      credit: 'credit-card',
      wallet: 'smartphone',
      investment: 'trending-up',
    };

    const typeColors: Record<AccountType, string> = {
      bank: '#0D9488',
      cash: '#10B981',
      credit: '#EF4444',
      wallet: '#3B82F6',
      investment: '#8B5CF6',
    };

    await addAccount({
      name: newAccName.trim(),
      type: newAccType,
      balance: bal,
      icon: typeIcons[newAccType],
      color: typeColors[newAccType],
    });

    setIsAddAccountModalOpen(false);
    setNewAccName('');
    setNewAccBalance('');
    setAccError('');
  };

  const handleDeleteAccount = async () => {
    if (accountToDelete) {
      await deleteAccount(accountToDelete.id);
      setAccountToDelete(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View>
          <AppText variant="h2" weight="800">
            Accounts & Wallets
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Manage liquid balances & cards
          </AppText>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsTransferModalOpen(true)}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: radius.full,
                marginRight: 8,
              },
            ]}
          >
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsAddAccountModalOpen(true)}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.full,
                ...shadows.soft,
              },
            ]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={{ marginBottom: spacing.lg }}>
            {/* Total Balance Card */}
            <View
              style={[
                styles.netWorthCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.xxl,
                  padding: spacing.xl,
                  ...shadows.soft,
                },
              ]}
            >
              <AppText variant="caption" color={colors.textSecondary}>
                Net Available Balance Across All Accounts
              </AppText>
              <AppText variant="amountLarge" weight="800" style={{ marginTop: spacing.xs }}>
                {FinancialCalculationsService.formatCurrency(totalBalance, currencySymbol)}
              </AppText>

              <View style={[styles.transferBanner, { marginTop: spacing.md, borderTopColor: colors.borderLight }]}>
                <AppButton
                  title="Transfer Between Accounts"
                  variant="outline"
                  iconName="refresh-cw"
                  size="sm"
                  onPress={() => setIsTransferModalOpen(true)}
                  fullWidth
                />
              </View>
            </View>

            <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
              Your Accounts ({accounts.length})
            </AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.accountCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.xl,
                padding: spacing.lg,
                marginBottom: spacing.md,
                ...shadows.soft,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CategoryIcon
                  iconName={item.icon || 'credit-card'}
                  color={item.color || colors.primary}
                  size={20}
                  containerSize={44}
                />
                <View style={{ marginLeft: spacing.md }}>
                  <AppText variant="subtitle1" weight="700">
                    {item.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {item.type.toUpperCase()} {item.accountNumberMasked ? `• ${item.accountNumberMasked}` : ''}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity onPress={() => setAccountToDelete(item)} style={{ padding: 6 }}>
                <Feather name="trash-2" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.cardFooter, { marginTop: spacing.md }]}>
              <AppText variant="caption" color={colors.textMuted}>
                Balance
              </AppText>
              <AppText
                variant="amountMedium"
                weight="800"
                color={item.balance < 0 ? colors.error : colors.textPrimary}
              >
                {FinancialCalculationsService.formatCurrency(item.balance, currencySymbol)}
              </AppText>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            iconName="credit-card"
            title="No accounts yet"
            description="Add your bank account, cash wallet, or card to start tracking balances."
            actionTitle="Add Account"
            onActionPress={() => setIsAddAccountModalOpen(true)}
          />
        )}
      />

      {/* Add Account Modal */}
      <Modal visible={isAddAccountModalOpen} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
          <View
            style={[
              styles.modalSheet,
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
            <View style={styles.modalHeader}>
              <AppText variant="h3" weight="700">
                Add New Account
              </AppText>
              <TouchableOpacity onPress={() => setIsAddAccountModalOpen(false)}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              style={{ maxHeight: height * 0.75 }}
            >
              <AppInput
                label="Account Name"
                placeholder="e.g. Axis Bank, Petty Cash, Amex Card"
                value={newAccName}
                onChangeText={setNewAccName}
                iconName="credit-card"
              />

              <AppInput
                label="Starting Balance"
                placeholder="0"
                keyboardType="numeric"
                value={newAccBalance}
                onChangeText={setNewAccBalance}
                iconName="dollar-sign"
              />

              <AppText variant="subtitle2" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
                Account Type
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 16 }}>
                {(['bank', 'cash', 'credit', 'wallet', 'investment'] as const).map((t) => {
                  const isSelected = newAccType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setNewAccType(t)}
                      style={[
                        styles.typeChip,
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
                        {t.toUpperCase()}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {accError ? (
                <AppText variant="caption" color={colors.error} style={{ marginBottom: spacing.sm }}>
                  {accError}
                </AppText>
              ) : null}

              <View style={{ flexDirection: 'row', marginTop: spacing.md, marginBottom: 20 }}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsAddAccountModalOpen(false)}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <AppButton
                  title="Create Account"
                  variant="primary"
                  onPress={handleSaveAccount}
                  style={{ flex: 2, marginLeft: spacing.sm }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TransferModal
        visible={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />

      <ConfirmDialog
        visible={accountToDelete !== null}
        title="Delete Account?"
        message={`Are you sure you want to delete ${accountToDelete?.name}?`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDeleteAccount}
        onCancel={() => setAccountToDelete(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netWorthCard: {
    width: '100%',
    borderWidth: 1,
  },
  transferBanner: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  accountCard: {
    width: '100%',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    marginRight: 8,
  },
});
