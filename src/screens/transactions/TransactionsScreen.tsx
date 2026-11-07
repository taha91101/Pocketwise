import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { AppText } from '../../components/common/AppText';
import { AppInput } from '../../components/common/AppInput';
import { TransactionItem } from '../../components/financial/TransactionItem';
import { PendingDetectedTransactionsBanner } from '../../components/financial/PendingDetectedTransactionsBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { AddTransactionModal } from '../../components/modals/AddTransactionModal';
import { TransactionFilterModal, SortOption } from '../../components/modals/TransactionFilterModal';
import { useAppStore } from '../../store/useAppStore';
import { Feather } from '@expo/vector-icons';

export interface TransactionsScreenProps {
  navigation: any;
}

type DateRangePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month';

const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
];

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const { t } = useTranslation();
  const transactions = useAppStore((state) => state.transactions);
  const accounts = useAppStore((state) => state.accounts);
  const categories = useAppStore((state) => state.categories);

  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income' | 'saving'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Count active non-default filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedAccountId !== 'all') count++;
    if (selectedProvider !== 'all') count++;
    if (dateRange !== 'all') count++;
    if (minAmount.trim() !== '') count++;
    if (maxAmount.trim() !== '') count++;
    if (sortBy !== 'date_desc') count++;
    return count;
  }, [selectedCategory, selectedAccountId, selectedProvider, dateRange, minAmount, maxAmount, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedAccountId('all');
    setSelectedProvider('all');
    setDateRange('all');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date_desc');
  };

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Compute week boundary (last 7 days or start of week)
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const minNum = minAmount.trim() ? parseFloat(minAmount) : null;
    const maxNum = maxAmount.trim() ? parseFloat(maxAmount) : null;

    const filtered = transactions.filter((tx) => {
      // 1. Tab filter
      if (activeTab !== 'all' && tx.type !== activeTab) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Account filter
      if (selectedAccountId !== 'all' && tx.accountId !== selectedAccountId) {
        return false;
      }

      // 4. Payment Provider / Method filter
      if (selectedProvider !== 'all') {
        const prov = (tx.paymentProvider || '').toLowerCase();
        const meth = (tx.paymentMethod || '').toLowerCase();
        const target = selectedProvider.toLowerCase();
        if (target === 'upi') {
          if (!prov.includes('upi') && !meth.includes('upi')) return false;
        } else if (target === 'cash') {
          if (!prov.includes('cash') && !meth.includes('cash')) return false;
        } else if (target === 'card') {
          if (!prov.includes('card') && !meth.includes('card') && !meth.includes('bank')) return false;
        } else {
          if (!prov.includes(target) && !meth.includes(target)) return false;
        }
      }

      // 5. Amount Range filter
      if (minNum !== null && !isNaN(minNum) && tx.amount < minNum) {
        return false;
      }
      if (maxNum !== null && !isNaN(maxNum) && tx.amount > maxNum) {
        return false;
      }

      // 6. Date Range filter
      if (dateRange !== 'all') {
        const txDate = new Date(tx.date);
        const txDateStr = tx.date.split('T')[0];

        if (dateRange === 'today') {
          if (txDateStr !== todayStr) return false;
        } else if (dateRange === 'this_week') {
          if (txDate.getTime() < weekAgo.getTime()) return false;
        } else if (dateRange === 'this_month') {
          if (txDate.getFullYear() !== currentYear || txDate.getMonth() !== currentMonth) return false;
        } else if (dateRange === 'last_month') {
          const expectedMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const expectedYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (txDate.getFullYear() !== expectedYear || txDate.getMonth() !== expectedMonth) return false;
        }
      }

      // 7. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesCat = tx.categoryName.toLowerCase().includes(query);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        const matchesMerchant = tx.merchant ? tx.merchant.toLowerCase().includes(query) : false;
        const matchesRef = tx.upiReference ? tx.upiReference.toLowerCase().includes(query) : false;
        const matchesAmount = tx.amount.toString().includes(query);

        if (!matchesTitle && !matchesCat && !matchesNotes && !matchesMerchant && !matchesRef && !matchesAmount) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        case 'date_desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  }, [
    transactions,
    activeTab,
    selectedCategory,
    selectedAccountId,
    selectedProvider,
    minAmount,
    maxAmount,
    dateRange,
    searchQuery,
    sortBy,
  ]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.headerTop}>
          <View>
            <AppText variant="h2" weight="800">
              {t('transactions_title')}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
              {filteredTransactions.length} of {transactions.length} records found
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsFilterModalOpen(true)}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: activeFilterCount > 0 ? colors.primaryLight : colors.card,
                  borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  ...shadows.soft,
                },
              ]}
            >
              <Feather
                name="sliders"
                size={18}
                color={activeFilterCount > 0 ? colors.primary : colors.textPrimary}
              />
              {activeFilterCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    width: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText variant="caption" color="#FFFFFF" weight="800" style={{ fontSize: 9 }}>
                    {activeFilterCount}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsAddModalOpen(true)}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  ...shadows.soft,
                },
              ]}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View style={{ marginTop: spacing.md }}>
          <AppInput
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            iconName="search"
            rightIconName={searchQuery ? 'x' : undefined}
            onRightIconPress={() => setSearchQuery('')}
          />
        </View>

        {/* Date Preset Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.xs, marginBottom: spacing.xs }}
        >
          {DATE_PRESETS.map((preset) => {
            const isSelected = dateRange === preset.id;
            const labelMap: Record<DateRangePreset, string> = {
              all: t('all_time'),
              today: t('today'),
              this_week: t('this_week'),
              this_month: t('this_month'),
              last_month: t('last_month'),
            };
            return (
              <TouchableOpacity
                key={preset.id}
                activeOpacity={0.7}
                onPress={() => setDateRange(preset.id)}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radius.full,
                    marginRight: 6,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  weight={isSelected ? '700' : '500'}
                  color={isSelected ? colors.primary : colors.textSecondary}
                >
                  {labelMap[preset.id] || preset.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Filters Clear Bar */}
        {activeFilterCount > 0 && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.primaryLight,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radius.md,
              marginTop: 4,
            }}
          >
            <AppText variant="caption" color={colors.primary} weight="600">
              {activeFilterCount} {activeFilterCount > 1 ? t('active_filters_applied') : t('active_filter_applied')}
            </AppText>
            <TouchableOpacity onPress={resetFilters} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="x-circle" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <AppText variant="caption" color={colors.primary} weight="700">
                {t('reset_all')}
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Type Tabs */}
        <View style={[styles.tabsWrap, { backgroundColor: colors.surfaceVariant, borderRadius: radius.lg, marginTop: 6 }]}>
          {(['all', 'expense', 'income', 'saving'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            const label =
              tab === 'all'
                ? t('all')
                : tab === 'expense'
                ? t('expenses')
                : tab === 'income'
                ? t('income')
                : t('saving');

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
        maxToRenderPerBatch={10}
        windowSize={7}
        initialNumToRender={12}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={<PendingDetectedTransactionsBanner />}
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
            actionTitle={activeFilterCount > 0 ? 'Reset Filters' : 'Add Transaction'}
            onActionPress={() => (activeFilterCount > 0 ? resetFilters() : setIsAddModalOpen(true))}
          />
        )}
      />

      <AddTransactionModal
        visible={isAddModalOpen}
        initialType={activeTab === 'all' ? 'expense' : activeTab}
        onClose={() => setIsAddModalOpen(false)}
      />

      <TransactionFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        accounts={accounts}
        categories={categories}
        selectedAccountId={selectedAccountId}
        onSelectAccount={setSelectedAccountId}
        selectedCategoryId={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedProvider={selectedProvider}
        onSelectProvider={setSelectedProvider}
        minAmount={minAmount}
        onChangeMinAmount={setMinAmount}
        maxAmount={maxAmount}
        onChangeMaxAmount={setMaxAmount}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        onReset={resetFilters}
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
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  listContent: {
    paddingTop: 8,
  },
});
