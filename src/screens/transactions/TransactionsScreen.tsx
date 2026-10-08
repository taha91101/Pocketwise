import React, { useState, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { AppInput } from '../../components/common/AppInput';
import { TransactionItem } from '../../components/financial/TransactionItem';
import { EmptyState } from '../../components/common/EmptyState';
import { AddTransactionModal } from '../../components/modals/AddTransactionModal';
import { useAppStore } from '../../store/useAppStore';
import { Transaction, TransactionType } from '../../types';
import { Feather } from '@expo/vector-icons';

export interface TransactionsScreenProps {
  navigation: any;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const transactions = useAppStore((state) => state.transactions);
  const categories = useAppStore((state) => state.categories);

  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income' | 'saving'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Tab filter
      if (activeTab !== 'all' && tx.type !== activeTab) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesCat = tx.categoryName.toLowerCase().includes(query);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        const matchesAmount = tx.amount.toString().includes(query);
        if (!matchesTitle && !matchesCat && !matchesNotes && !matchesAmount) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, activeTab, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.headerTop}>
          <View>
            <AppText variant="h2" weight="800">
              Transactions
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
              {filteredTransactions.length} records found
            </AppText>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsAddModalOpen(true)}
            style={[
              styles.addBtn,
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

        {/* Search Input */}
        <View style={{ marginTop: spacing.md }}>
          <AppInput
            placeholder="Search description, category, or notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconName="search"
            rightIconName={searchQuery ? 'x' : undefined}
            onRightIconPress={() => setSearchQuery('')}
          />
        </View>

        {/* Type Tabs */}
        <View style={[styles.tabsWrap, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg }]}>
          {(['all', 'expense', 'income', 'saving'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            const label =
              tab === 'all'
                ? 'All'
                : tab === 'expense'
                ? 'Expenses'
                : tab === 'income'
                ? 'Income'
                : 'Savings';

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabBtn,
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
                  {label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg, paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={(tx) => navigation.navigate('TransactionDetail', { transactionId: tx.id })}
          />
        )}
        ListEmptyComponent={() => (
          <EmptyState
            iconName="inbox"
            title={transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
            description={
              transactions.length === 0
                ? 'Start tracking your expenses and incomes to see them here.'
                : 'Try adjusting your filters or search terms.'
            }
            actionTitle="Add Transaction"
            onActionPress={() => setIsAddModalOpen(true)}
          />
        )}
      />

      <AddTransactionModal
        visible={isAddModalOpen}
        initialType={activeTab === 'all' ? 'expense' : activeTab}
        onClose={() => setIsAddModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrap: {
    flexDirection: 'row',
    padding: 3,
    marginTop: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
  },
  listContent: {
    paddingTop: 12,
  },
});
