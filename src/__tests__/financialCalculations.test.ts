import { describe, test, expect } from '@jest/globals';
import { FinancialCalculationsService } from '../services/financialCalculations';
import { Account, Budget, SavingsGoal, Transaction } from '../types';

describe('FinancialCalculationsService', () => {
  const mockAccounts: Account[] = [
    { id: 'acc-1', name: 'Bank', type: 'bank', balance: 50000, icon: 'credit-card', color: '#10B981' },
    { id: 'acc-2', name: 'Cash', type: 'cash', balance: 5000, icon: 'dollar-sign', color: '#3B82F6' },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Salary',
      amount: 75000,
      type: 'income',
      categoryId: 'cat-salary',
      categoryName: 'Salary',
      categoryIcon: 'briefcase',
      categoryColor: '#10B981',
      date: '2026-10-01T10:00:00Z',
      accountId: 'acc-1',
      accountName: 'Bank',
      paymentMethod: 'Bank Transfer',
      createdAt: '2026-10-01T10:00:00Z',
    },
    {
      id: 'tx-2',
      title: 'Groceries',
      amount: 4500,
      type: 'expense',
      categoryId: 'cat-food',
      categoryName: 'Food & Dining',
      categoryIcon: 'utensils',
      categoryColor: '#F97316',
      date: '2026-10-02T10:00:00Z',
      accountId: 'acc-1',
      accountName: 'Bank',
      paymentMethod: 'UPI',
      createdAt: '2026-10-02T10:00:00Z',
    },
    {
      id: 'tx-3',
      title: 'Savings Transfer',
      amount: 15000,
      type: 'saving',
      categoryId: 'cat-savings',
      categoryName: 'Savings Goal',
      categoryIcon: 'target',
      categoryColor: '#10B981',
      date: '2026-10-03T10:00:00Z',
      accountId: 'acc-1',
      accountName: 'Bank',
      goalId: 'goal-1',
      paymentMethod: 'Bank Transfer',
      createdAt: '2026-10-03T10:00:00Z',
    },
    {
      id: 'tx-4',
      title: 'ATM Withdrawal (Transfer)',
      amount: 2000,
      type: 'transfer',
      categoryId: 'cat-transfer',
      categoryName: 'Account Transfer',
      categoryIcon: 'refresh-cw',
      categoryColor: '#64748B',
      date: '2026-10-04T10:00:00Z',
      accountId: 'acc-1',
      accountName: 'Bank',
      destinationAccountId: 'acc-2',
      destinationAccountName: 'Cash',
      paymentMethod: 'Cash',
      createdAt: '2026-10-04T10:00:00Z',
    },
  ];

  const mockGoals: SavingsGoal[] = [
    {
      id: 'goal-1',
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 35000,
      targetDate: '2027-10-01',
      monthlyContribution: 5000,
      color: '#0D9488',
      icon: 'shield',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockBudget: Budget = {
    id: 'bgt-1',
    name: 'Food Budget',
    amount: 10000,
    categoryId: 'cat-food',
    period: 'monthly',
    startDate: '2026-10-01T00:00:00Z',
    endDate: '2026-10-31T23:59:59Z',
    alertThreshold: 80,
  };

  test('calculates total income strictly excluding transfers and savings', () => {
    const income = FinancialCalculationsService.calculateTotalIncome(mockTransactions);
    expect(income).toBe(75000);
  });

  test('calculates total expenses strictly excluding transfers and savings', () => {
    const expenses = FinancialCalculationsService.calculateTotalExpenses(mockTransactions);
    expect(expenses).toBe(4500);
  });

  test('calculates savings allocated correctly', () => {
    const savings = FinancialCalculationsService.calculateTotalSavingsAllocated(mockTransactions);
    expect(savings).toBe(15000);
  });

  test('calculates available account balance across all accounts', () => {
    const totalBalance = FinancialCalculationsService.calculateTotalAccountBalance(mockAccounts);
    expect(totalBalance).toBe(55000);
  });

  test('calculates savings rate percentage accurately', () => {
    const rate = FinancialCalculationsService.calculateSavingsRate(75000, 15000);
    expect(rate).toBe(20);
  });

  test('calculates budget performance and threshold alerts', () => {
    const perfNormal = FinancialCalculationsService.calculateBudgetPerformance(mockBudget, mockTransactions);
    expect(perfNormal.spent).toBe(4500);
    expect(perfNormal.remaining).toBe(5500);
    expect(perfNormal.percentageUsed).toBe(45);
    expect(perfNormal.status).toBe('normal');

    // Test warning status
    const warningTx: Transaction[] = [
      ...mockTransactions,
      {
        id: 'tx-extra',
        title: 'Fancy Dinner',
        amount: 4000,
        type: 'expense',
        categoryId: 'cat-food',
        categoryName: 'Food & Dining',
        categoryIcon: 'utensils',
        categoryColor: '#F97316',
        date: '2026-10-05T10:00:00Z',
        accountId: 'acc-1',
        accountName: 'Bank',
        paymentMethod: 'UPI',
        createdAt: '2026-10-05T10:00:00Z',
      },
    ];
    const perfWarning = FinancialCalculationsService.calculateBudgetPerformance(mockBudget, warningTx);
    expect(perfWarning.spent).toBe(8500);
    expect(perfWarning.percentageUsed).toBe(85);
    expect(perfWarning.status).toBe('warning');

    // Test exceeded status
    const exceededTx: Transaction[] = [
      ...warningTx,
      {
        id: 'tx-extra-2',
        title: 'Party',
        amount: 2000,
        type: 'expense',
        categoryId: 'cat-food',
        categoryName: 'Food & Dining',
        categoryIcon: 'utensils',
        categoryColor: '#F97316',
        date: '2026-10-06T10:00:00Z',
        accountId: 'acc-1',
        accountName: 'Bank',
        paymentMethod: 'UPI',
        createdAt: '2026-10-06T10:00:00Z',
      },
    ];
    const perfExceeded = FinancialCalculationsService.calculateBudgetPerformance(mockBudget, exceededTx);
    expect(perfExceeded.spent).toBe(10500);
    expect(perfExceeded.status).toBe('exceeded');
  });

  test('calculates goal metrics with remaining and required monthly amount', () => {
    const metrics = FinancialCalculationsService.calculateGoalMetrics(mockGoals[0]);
    expect(metrics.remainingAmount).toBe(65000);
    expect(metrics.progressPercentage).toBe(35);
    expect(metrics.isCompleted).toBe(false);
    expect(metrics.requiredMonthly).toBeGreaterThan(0);
  });

  test('processes account transfer conserving net worth without phantom income or expense', () => {
    const initialTotal = FinancialCalculationsService.calculateTotalAccountBalance(mockAccounts);
    const { updatedAccounts, error } = FinancialCalculationsService.processAccountTransfer(
      mockAccounts,
      'acc-1',
      'acc-2',
      5000
    );

    expect(error).toBeUndefined();
    const finalTotal = FinancialCalculationsService.calculateTotalAccountBalance(updatedAccounts);
    expect(finalTotal).toBe(initialTotal); // Conservation of funds

    const updatedSource = updatedAccounts.find((a) => a.id === 'acc-1');
    const updatedDest = updatedAccounts.find((a) => a.id === 'acc-2');

    expect(updatedSource?.balance).toBe(45000);
    expect(updatedDest?.balance).toBe(10000);
  });

  test('formats currency properly with negative values and symbols', () => {
    expect(FinancialCalculationsService.formatCurrency(52450, '₹')).toBe('₹52,450');
    expect(FinancialCalculationsService.formatCurrency(-8000, '₹')).toBe('-₹8,000');
    expect(FinancialCalculationsService.formatCurrency(0, '$')).toBe('$0');
  });
});
