import { BudgetService } from '../services/budgetService';
import { Budget, Category, SavingsGoal, Transaction } from '../types';

describe('BudgetService (Budget Upgrades F3.2)', () => {
  const mockCategories: Category[] = [
    { id: 'cat-groceries', name: 'Groceries', icon: 'cart', color: '#10B981', type: 'expense' },
    { id: 'cat-dining', name: 'Dining Out', icon: 'restaurant', color: '#F59E0B', type: 'expense' },
    { id: 'cat-transport', name: 'Transport', icon: 'car', color: '#3B82F6', type: 'expense' },
  ];

  describe('getEffectiveLimit', () => {
    it('returns base amount when rollover is disabled', () => {
      const budget: Budget = {
        id: 'b-1',
        name: 'Groceries',
        amount: 10000,
        categoryId: 'cat-groceries',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        rolloverEnabled: false,
        rolloverAmount: 2000, // Should be ignored
      };

      expect(BudgetService.getEffectiveLimit(budget)).toBe(10000);
    });

    it('combines base and rollover when rollover is enabled', () => {
      const budget: Budget = {
        id: 'b-1',
        name: 'Groceries',
        amount: 10000,
        categoryId: 'cat-groceries',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        rolloverEnabled: true,
        rolloverAmount: 2500,
      };

      expect(BudgetService.getEffectiveLimit(budget)).toBe(12500);
    });

    it('caps effective limit at overallMonthlyCap', () => {
      const budget: Budget = {
        id: 'b-1',
        name: 'Groceries',
        amount: 10000,
        categoryId: 'cat-groceries',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        rolloverEnabled: true,
        rolloverAmount: 5000,
        overallMonthlyCap: 12000, // Cap at 12,000 instead of 15,000
      };

      expect(BudgetService.getEffectiveLimit(budget)).toBe(12000);
    });
  });

  describe('calculateRollovers', () => {
    // Current date is June 15, 2026. Previous month is May 2026.
    const currentDate = new Date(2026, 5, 15, 12, 0, 0);

    const budgets: Budget[] = [
      {
        id: 'b-1',
        name: 'Groceries',
        amount: 10000,
        categoryId: 'cat-groceries',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        rolloverEnabled: true,
      },
      {
        id: 'b-2',
        name: 'Dining Out',
        amount: 5000,
        categoryId: 'cat-dining',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        rolloverEnabled: false,
      },
      {
        id: 'b-3',
        name: 'Transport',
        amount: 4000,
        categoryId: 'cat-transport',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        rolloverEnabled: true,
        overallMonthlyCap: 5000,
      },
    ];

    const pastTransactions: Transaction[] = [
      // May groceries: 6,000 spent out of 10,000 -> 4,000 unspent
      {
        id: 'tx-1',
        title: 'Supermarket May',
        amount: 6000,
        type: 'expense',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        categoryIcon: 'cart',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'upi',
        date: new Date(2026, 4, 10).toISOString(),
        createdAt: new Date(2026, 4, 10).toISOString(),
      },
      // May dining: 2,000 spent out of 5,000 (but rollover disabled)
      {
        id: 'tx-2',
        title: 'Restaurant May',
        amount: 2000,
        type: 'expense',
        categoryId: 'cat-dining',
        categoryName: 'Dining Out',
        categoryIcon: 'restaurant',
        categoryColor: '#F59E0B',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'card',
        date: new Date(2026, 4, 12).toISOString(),
        createdAt: new Date(2026, 4, 12).toISOString(),
      },
      // May transport: only 500 spent out of 4,000 -> 3,500 unspent, but cap is 5,000 so max rollover is 1,000
      {
        id: 'tx-3',
        title: 'Uber May',
        amount: 500,
        type: 'expense',
        categoryId: 'cat-transport',
        categoryName: 'Transport',
        categoryIcon: 'car',
        categoryColor: '#3B82F6',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'upi',
        date: new Date(2026, 4, 15).toISOString(),
        createdAt: new Date(2026, 4, 15).toISOString(),
      },
    ];

    it('calculates unspent amount from previous month and applies cap', () => {
      const updated = BudgetService.calculateRollovers(budgets, pastTransactions, currentDate);

      // Groceries: 10,000 - 6,000 = 4,000 rolled over
      const groceryBudget = updated.find((b) => b.id === 'b-1');
      expect(groceryBudget?.rolloverAmount).toBe(4000);

      // Dining: Rollover disabled -> 0
      const diningBudget = updated.find((b) => b.id === 'b-2');
      expect(diningBudget?.rolloverAmount).toBe(0);

      // Transport: 4,000 - 500 = 3,500 unspent, capped at 5,000 - 4,000 = 1,000
      const transportBudget = updated.find((b) => b.id === 'b-3');
      expect(transportBudget?.rolloverAmount).toBe(1000);
    });
  });

  describe('generateBudgetSuggestions', () => {
    const currentDate = new Date(2026, 5, 15, 12, 0, 0);

    const historicalTransactions: Transaction[] = [
      // March groceries: 8,000
      {
        id: 'h-1',
        title: 'Grocery March',
        amount: 8000,
        type: 'expense',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        categoryIcon: 'cart',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'upi',
        date: new Date(2026, 2, 10).toISOString(),
        createdAt: new Date(2026, 2, 10).toISOString(),
      },
      // April groceries: 8,500
      {
        id: 'h-2',
        title: 'Grocery April',
        amount: 8500,
        type: 'expense',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        categoryIcon: 'cart',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'upi',
        date: new Date(2026, 3, 10).toISOString(),
        createdAt: new Date(2026, 3, 10).toISOString(),
      },
      // May groceries: 9,000
      {
        id: 'h-3',
        title: 'Grocery May',
        amount: 9000,
        type: 'expense',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        categoryIcon: 'cart',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'upi',
        date: new Date(2026, 4, 10).toISOString(),
        createdAt: new Date(2026, 4, 10).toISOString(),
      },
    ];

    it('computes 3-month average and suggests buffer-rounded limit', () => {
      const suggestions = BudgetService.generateBudgetSuggestions(
        historicalTransactions,
        mockCategories,
        currentDate
      );

      const grocerySug = suggestions.find((s) => s.categoryId === 'cat-groceries');
      expect(grocerySug).toBeDefined();
      // Total 25,500 over 3 months -> average 8,500
      expect(grocerySug?.averageMonthlySpend).toBe(8500);
      // 8,500 * 1.10 = 9,350 -> rounded up to nearest 100 = 9,400
      expect(grocerySug?.suggestedLimit).toBe(9400);
      expect(grocerySug?.dataMonthsCount).toBe(3);
    });
  });

  describe('calculateZeroBasedBudgeting', () => {
    const mockBudgets: Budget[] = [
      {
        id: 'b-1',
        name: 'Groceries',
        amount: 20000,
        categoryId: 'cat-groceries',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      },
      {
        id: 'b-2',
        name: 'Dining',
        amount: 10000,
        categoryId: 'cat-dining',
        period: 'monthly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      },
    ];

    const mockGoals: SavingsGoal[] = [
      {
        id: 'g-1',
        name: 'Emergency Fund',
        targetAmount: 300000,
        currentAmount: 100000,
        targetDate: '2027-06-01',
        monthlyContribution: 15000,
        color: '#10B981',
        icon: 'shield',
        createdAt: '2026-01-01',
      },
      {
        id: 'g-2',
        name: 'Vacation',
        targetAmount: 50000,
        currentAmount: 20000,
        targetDate: '2026-12-01',
        monthlyContribution: 5000,
        color: '#3B82F6',
        icon: 'airplane',
        createdAt: '2026-01-01',
      },
    ];

    it('correctly balances when income equals budgets + savings allocations', () => {
      // 20,000 + 10,000 + 15,000 + 5,000 = 50,000
      const summary = BudgetService.calculateZeroBasedBudgeting(50000, mockBudgets, mockGoals);

      expect(summary.totalAssignedToBudgets).toBe(30000);
      expect(summary.totalAssignedToGoals).toBe(20000);
      expect(summary.totalAssigned).toBe(50000);
      expect(summary.unassignedIncome).toBe(0);
      expect(summary.isBalanced).toBe(true);
      expect(summary.budgetPercentage).toBe(60);
      expect(summary.savingsPercentage).toBe(40);
    });

    it('reports unassigned income when income exceeds allocations', () => {
      const summary = BudgetService.calculateZeroBasedBudgeting(60000, mockBudgets, mockGoals);

      expect(summary.totalAssigned).toBe(50000);
      expect(summary.unassignedIncome).toBe(10000);
      expect(summary.isBalanced).toBe(false);
    });
  });
});

