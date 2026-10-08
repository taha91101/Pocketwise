import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../../components/common/AppText';
import { SavingsGoalCard } from '../../components/financial/SavingsGoalCard';
import { FinancialInsightCard } from '../../components/financial/FinancialInsightCard';
import { EmptyState } from '../../components/common/EmptyState';
import { AddGoalModal } from '../../components/modals/AddGoalModal';
import { AddGoalFundsModal } from '../../components/modals/AddGoalFundsModal';
import { WithdrawGoalFundsModal } from '../../components/modals/WithdrawGoalFundsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAppStore } from '../../store/useAppStore';
import { SavingsGoal } from '../../types';
import { FinancialCalculationsService } from '../../services/financialCalculations';
import { Feather } from '@expo/vector-icons';

export const SavingsScreen: React.FC = () => {
  const { colors, spacing, radius, shadows } = useTheme();
  const savingsGoals = useAppStore((state) => state.savingsGoals);
  const insights = useAppStore((state) => state.insights);
  const deleteSavingsGoal = useAppStore((state) => state.deleteSavingsGoal);
  const currencySymbol = useAppStore((state) => state.settings.currencySymbol);

  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [activeDepositGoal, setActiveDepositGoal] = useState<SavingsGoal | null>(null);
  const [activeWithdrawGoal, setActiveWithdrawGoal] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  const totalSaved = FinancialCalculationsService.calculateTotalGoalSavings(savingsGoals);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // Filter smart savings suggestions from insights
  const savingSuggestions = insights.filter((i) => i.type === 'saving' || i.type === 'tip');

  const handleDeleteGoal = async () => {
    if (goalToDelete) {
      await deleteSavingsGoal(goalToDelete.id);
      setGoalToDelete(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View>
          <AppText variant="h2" weight="800">
            Savings & Goals
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
            Build your wealth & emergency reserve
          </AppText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsAddGoalModalOpen(true)}
          style={[
            styles.addBtn,
            { backgroundColor: colors.primary, borderRadius: radius.full, ...shadows.soft },
          ]}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={savingsGoals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg, paddingBottom: 80 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => {
          if (savingsGoals.length === 0) return null;
          return (
            <View style={{ marginBottom: spacing.lg }}>
              {/* Total Saved Showcase Card */}
              <View
                style={[
                  styles.totalSavedCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radius.xxl,
                    padding: spacing.xl,
                    ...shadows.soft,
                  },
                ]}
              >
                <View style={styles.topInfo}>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Total Accumulated Savings
                  </AppText>
                  <View style={styles.growthBadge}>
                    <Feather name="target" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                    <AppText variant="caption" color={colors.primary} weight="700">
                      {savingsGoals.filter((g) => g.isCompleted).length}/{savingsGoals.length} Achieved
                    </AppText>
                  </View>
                </View>

                <AppText variant="amountLarge" weight="800" style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
                  {FinancialCalculationsService.formatCurrency(totalSaved, currencySymbol)}
                </AppText>

                <View style={[styles.cardFooter, { borderTopColor: colors.borderLight, paddingTop: spacing.md }]}>
                  <AppText variant="caption" color={colors.textMuted}>
                    {overallProgress}% of total {FinancialCalculationsService.formatCurrency(totalTarget, currencySymbol)} target
                  </AppText>
                  <AppText variant="caption" color={colors.primary} weight="700">
                    {savingsGoals.length} Active Goals
                  </AppText>
                </View>
              </View>

            {/* Smart "Save More" Suggestions */}
            {savingSuggestions.length > 0 && (
              <View style={{ marginTop: spacing.xl }}>
                <AppText variant="subtitle1" weight="700" style={{ marginBottom: spacing.xs }}>
                  Smart "Save More" Suggestions 💡
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
                  Personalized savings tips based on your spending
                </AppText>
                {savingSuggestions.map((sug) => (
                  <FinancialInsightCard key={sug.id} insight={sug} />
                ))}
              </View>
            )}

            <AppText variant="subtitle1" weight="700" style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
              Your Goals
            </AppText>
          </View>
        );
      }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.md }}>
            <SavingsGoalCard
              goal={item}
              onContributePress={(g) => setActiveDepositGoal(g)}
              onWithdrawPress={(g) => setActiveWithdrawGoal(g)}
              onEditPress={(g) => setGoalToDelete(g)}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            iconName="target"
            title="No savings goals yet"
            description="Create your first goal like an Emergency Fund or Vacation plan."
            actionTitle="Create Goal"
            onActionPress={() => setIsAddGoalModalOpen(true)}
          />
        )}
      />

      <AddGoalModal
        visible={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
      />

      <AddGoalFundsModal
        visible={activeDepositGoal !== null}
        goal={activeDepositGoal}
        onClose={() => setActiveDepositGoal(null)}
      />

      <WithdrawGoalFundsModal
        visible={activeWithdrawGoal !== null}
        goal={activeWithdrawGoal}
        onClose={() => setActiveWithdrawGoal(null)}
      />

      <ConfirmDialog
        visible={goalToDelete !== null}
        title="Delete Savings Goal?"
        message={`Are you sure you want to delete "${goalToDelete?.name}"?`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDeleteGoal}
        onCancel={() => setGoalToDelete(null)}
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
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 8,
  },
  totalSavedCard: {
    width: '100%',
    borderWidth: 1,
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
