import { InsightsService } from '../services/insightsService';
import { Account, Budget, SavingsGoal, Transaction } from '../types';

describe('InsightsService (Smarter Insights F3.4)', () => {
  const mockAccounts: Account[] = [
    { id: 'acc-1', name: 'HDFC', type: 'bank', balance: 50000, icon: 'bank', color: '#10B981' },
  ];

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);

  describe('Month-over-Month Category Spikes', () => {
    it('generates a warning when a category spending spikes by > 25% and >= ₹1,000', () => {
      const transactions: Transaction[] = [
        // Previous month dining: ₹2,000
        {
          id: 'tx-prev-1',
          title: 'Restaurant',
          amount: 2000,
          type: 'expense',
          categoryId: 'cat-dining',
          categoryName: 'Dining Out',
          categoryIcon: 'food',
          categoryColor: '#F59E0B',
          accountId: 'acc-1',
          accountName: 'HDFC',
          paymentMethod: 'card',
          date: prevMonthDate.toISOString(),
          createdAt: prevMonthDate.toISOString(),
        },
        // Current month dining: ₹5,000 (+150% spike!)
        {
          id: 'tx-curr-1',
          title: 'Fine Dining',
          amount: 5000,
          type: 'expense',
          categoryId: 'cat-dining',
          categoryName: 'Dining Out',
          categoryIcon: 'food',
          categoryColor: '#F59E0B',
          accountId: 'acc-1',
          accountName: 'HDFC',
          paymentMethod: 'card',
          date: currentMonthStart.toISOString(),
          createdAt: currentMonthStart.toISOString(),
        },
      ];

      const insights = InsightsService.generateInsights(transactions, mockAccounts, [], []);
      const spikeInsight = insights.find((i) => i.id === 'ins-spike-cat-dining');

      expect(spikeInsight).toBeDefined();
      expect(spikeInsight?.type).toBe('warning');
      expect(spikeInsight?.title).toContain('Spike in Dining Out');
      expect(spikeInsight?.description).toContain('150%');
      expect(spikeInsight?.filterCriteria?.categoryId).toBe('cat-dining');
    });
  });

  describe('Savings Goal Pacing', () => {
    it('flags behind pace when monthly contribution is insufficient', () => {
      // Target: 100,000 in 10 months -> needs 10,000/mo. Current is only 2,000/mo.
      const targetDate = new Date(now.getFullYear(), now.getMonth() + 10, 1).toISOString();
      const goals: SavingsGoal[] = [
        {
          id: 'goal-vacation',
          name: 'Europe Trip',
          targetAmount: 100000,
          currentAmount: 0,
          targetDate,
          monthlyContribution: 2000, // Insufficient!
          color: '#3B82F6',
          icon: 'airplane',
          createdAt: now.toISOString(),
        },
      ];

      const insights = InsightsService.generateInsights([], mockAccounts, [], goals);
      const pacingInsight = insights.find((i) => i.id === 'ins-goal-behind-goal-vacation');

      expect(pacingInsight).toBeDefined();
      expect(pacingInsight?.type).toBe('warning');
      expect(pacingInsight?.title).toContain('Behind Pace: Europe Trip');
    });

    it('flags on track when monthly contribution meets required pace', () => {
      // Target: 50,000 in 5 months -> needs 10,000/mo. Current is 12,000/mo.
      const targetDate = new Date(now.getFullYear(), now.getMonth() + 5, 1).toISOString();
      const goals: SavingsGoal[] = [
        {
          id: 'goal-emergency',
          name: 'Emergency Fund',
          targetAmount: 50000,
          currentAmount: 0,
          targetDate,
          monthlyContribution: 12000,
          color: '#10B981',
          icon: 'shield',
          createdAt: now.toISOString(),
        },
      ];

      const insights = InsightsService.generateInsights([], mockAccounts, [], goals);
      const onTrackInsight = insights.find((i) => i.id === 'ins-goal-ontrack-goal-emergency');

      expect(onTrackInsight).toBeDefined();
      expect(onTrackInsight?.type).toBe('achievement');
      expect(onTrackInsight?.title).toContain('On Track: Emergency Fund');
    });
  });

  describe('Outlier Transaction Detection', () => {
    it('detects single large transaction exceeding 3x category median', () => {
      const transactions: Transaction[] = [
        // 3 typical grocery visits of ₹500
        {
          id: 'tx-g1',
          title: 'Quick Groceries 1',
          amount: 500,
          type: 'expense',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          categoryIcon: 'cart',
          categoryColor: '#10B981',
          accountId: 'acc-1',
          accountName: 'HDFC',
          paymentMethod: 'upi',
          date: currentMonthStart.toISOString(),
          createdAt: currentMonthStart.toISOString(),
        },
        {
          id: 'tx-g2',
          title: 'Quick Groceries 2',
          amount: 600,
          type: 'expense',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          categoryIcon: 'cart',
          categoryColor: '#10B981',
          accountId: 'acc-1',
          accountName: 'HDFC',
          paymentMethod: 'upi',
          date: currentMonthStart.toISOString(),
          createdAt: currentMonthStart.toISOString(),
        },
        {
          id: 'tx-g3',
          title: 'Quick Groceries 3',
          amount: 550,
          type: 'expense',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          categoryIcon: 'cart',
          categoryColor: '#10B981',
          accountId: 'acc-1',
          accountName: 'HDFC',
          paymentMethod: 'upi',
          date: currentMonthStart.toISOString(),
          createdAt: currentMonthStart.toISOString(),
        },
        // Outlier grocery run: ₹5,000 (> 3x median of ~550)
        {
          id: 'tx-g-outlier',
          title: 'Bulk Wholesale Grocery',
          amount: 5000,
          type: 'expense',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          categoryIcon: 'cart',
          categoryColor: '#10B981',
          accountId: 'acc-1',
          accountName: 'HDFC',
          paymentMethod: 'card',
          date: currentMonthStart.toISOString(),
          createdAt: currentMonthStart.toISOString(),
        },
      ];

      const insights = InsightsService.generateInsights(transactions, mockAccounts, [], []);
      const outlierInsight = insights.find((i) => i.id === 'ins-outlier-tx-g-outlier');

      expect(outlierInsight).toBeDefined();
      expect(outlierInsight?.title).toContain('Bulk Wholesale Grocery');
      expect(outlierInsight?.filterCriteria?.transactionIds).toEqual(['tx-g-outlier']);
    });
  });

  describe('Budget Warnings with Filter Criteria', () => {
    it('attaches categoryId filter criteria to budget warnings', () => {
      const budget: Budget = {
        id: 'b-dining',
        name: 'Dining',
        amount: 2000,
        categoryId: 'cat-dining',
        period: 'monthly',
        startDate: currentMonthStart.toISOString(),
        endDate: now.toISOString(),
      };

      const transactions: Transaction[] = [
        {
          id: 'tx-d1',
          title: 'Dinner',
          amount: 2500, // Exceeded budget
          type: 'expense',
          categoryId: 'cat-dining',
          categoryName: 'Dining',
          categoryIcon: 'food',
          categoryColor: '#EF4444',
          accountId: 'acc-1',
          accountName: 'HDFC',
          paymentMethod: 'upi',
          date: currentMonthStart.toISOString(),
          createdAt: currentMonthStart.toISOString(),
        },
      ];

      const insights = InsightsService.generateInsights(transactions, mockAccounts, [budget], []);
      const bgtWarning = insights.find((i) => i.id === 'ins-bgt-exceeded-b-dining');

      expect(bgtWarning).toBeDefined();
      expect(bgtWarning?.filterCriteria?.categoryId).toBe('cat-dining');
    });
  });
});

