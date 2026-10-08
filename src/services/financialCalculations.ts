import { Account, Budget, FinancialOverview, SavingsGoal, Transaction } from '../types';

export class FinancialCalculationsService {
  /**
   * Calculate Total Income from transactions within an optional date range
   * Transfers and Savings do NOT count as income.
   */
  public static calculateTotalIncome(
    transactions: Transaction[],
    startDate?: Date,
    endDate?: Date
  ): number {
    return transactions
      .filter((tx) => {
        if (tx.type !== 'income') return false;
        if (!startDate && !endDate) return true;
        const txDate = new Date(tx.date);
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        return true;
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }

  /**
   * Calculate Total Expenses from transactions within an optional date range
   * Transfers and Savings allocations do NOT count as expenses.
   */
  public static calculateTotalExpenses(
    transactions: Transaction[],
    startDate?: Date,
    endDate?: Date
  ): number {
    return transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        if (!startDate && !endDate) return true;
        const txDate = new Date(tx.date);
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        return true;
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }

  /**
   * Calculate Total Savings allocated within an optional date range
   */
  public static calculateTotalSavingsAllocated(
    transactions: Transaction[],
    startDate?: Date,
    endDate?: Date
  ): number {
    return transactions
      .filter((tx) => {
        if (tx.type !== 'saving') return false;
        if (!startDate && !endDate) return true;
        const txDate = new Date(tx.date);
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        return true;
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }

  /**
   * Calculate total current saved amount across all goals
   */
  public static calculateTotalGoalSavings(goals: SavingsGoal[]): number {
    return goals.reduce((sum, goal) => sum + Number(goal.currentAmount || 0), 0);
  }

  /**
   * Calculate Total Available Balance across all accounts.
   */
  public static calculateTotalAccountBalance(accounts: Account[]): number {
    return accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
  }

  /**
   * Calculate savings rate percentage: (Savings / Income) * 100
   */
  public static calculateSavingsRate(income: number, savings: number): number {
    if (income <= 0) return 0;
    const rate = (savings / income) * 100;
    return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
  }

  /**
   * Calculate Month-over-month percentage change
   */
  public static calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return Math.round(change * 10) / 10;
  }

  /**
   * Calculate comprehensive financial overview for a given month or overall
   */
  public static calculateOverview(
    accounts: Account[],
    transactions: Transaction[],
    goals: SavingsGoal[],
    monthDate: Date = new Date()
  ): FinancialOverview {
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    const prevMonthStart = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
    const prevMonthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth(), 0, 23, 59, 59);

    const totalIncome = this.calculateTotalIncome(transactions, startOfMonth, endOfMonth);
    const totalExpenses = this.calculateTotalExpenses(transactions, startOfMonth, endOfMonth);
    const totalSavingsAllocated = this.calculateTotalSavingsAllocated(transactions, startOfMonth, endOfMonth);

    const prevIncome = this.calculateTotalIncome(transactions, prevMonthStart, prevMonthEnd);
    const prevExpenses = this.calculateTotalExpenses(transactions, prevMonthStart, prevMonthEnd);
    const prevNet = prevIncome - prevExpenses;
    const currentNet = totalIncome - totalExpenses;

    const availableBalance = this.calculateTotalAccountBalance(accounts);
    const totalGoalSavings = this.calculateTotalGoalSavings(goals);

    const netSavingsRate = this.calculateSavingsRate(totalIncome, totalSavingsAllocated);
    const monthOverMonthGrowth = this.calculateGrowthPercentage(currentNet, prevNet);

    const openingBalance = availableBalance - currentNet + totalSavingsAllocated;
    const closingBalance = availableBalance;

    return {
      availableBalance,
      totalIncome,
      totalExpenses,
      totalSavings: totalGoalSavings > 0 ? totalGoalSavings : totalSavingsAllocated,
      netSavingsRate,
      monthOverMonthGrowth,
      openingBalance,
      closingBalance,
    };
  }

  /**
   * Calculate category breakdown for expenses
   */
  public static calculateCategoryBreakdown(
    transactions: Transaction[],
    startDate?: Date,
    endDate?: Date
  ): { categoryId: string; categoryName: string; categoryColor: string; amount: number; percentage: number }[] {
    const expenseTx = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      if (!startDate && !endDate) return true;
      const d = new Date(tx.date);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });

    const totalExpense = expenseTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    if (totalExpense === 0) return [];

    const map = new Map<string, { categoryId: string; categoryName: string; categoryColor: string; amount: number }>();

    for (const tx of expenseTx) {
      const existing = map.get(tx.categoryId) || {
        categoryId: tx.categoryId,
        categoryName: tx.categoryName,
        categoryColor: tx.categoryColor || '#64748B',
        amount: 0,
      };
      existing.amount += Number(tx.amount || 0);
      map.set(tx.categoryId, existing);
    }

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        percentage: Math.round((item.amount / totalExpense) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate status and spent amount for a specific Budget
   */
  public static calculateBudgetPerformance(
    budget: Budget,
    transactions: Transaction[]
  ): {
    spent: number;
    remaining: number;
    percentageUsed: number;
    status: 'normal' | 'warning' | 'exceeded';
  } {
    const start = new Date(budget.startDate);
    const end = new Date(budget.endDate);

    const spent = transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        if (tx.categoryId !== budget.categoryId) return false;
        const d = new Date(tx.date);
        return d >= start && d <= end;
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const remaining = Math.max(0, budget.amount - spent);
    const percentageUsed = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
    const threshold = budget.alertThreshold || 80;

    let status: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (percentageUsed >= 100) {
      status = 'exceeded';
    } else if (percentageUsed >= threshold) {
      status = 'warning';
    }

    return {
      spent,
      remaining,
      percentageUsed,
      status,
    };
  }

  /**
   * Calculate Savings Goal metrics:
   * remaining, progress %, required monthly savings to hit target by targetDate
   */
  public static calculateGoalMetrics(goal: SavingsGoal): {
    remainingAmount: number;
    progressPercentage: number;
    requiredMonthly: number;
    monthsRemaining: number;
    isCompleted: boolean;
  } {
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    const progressPercentage = goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;

    const today = new Date();
    const target = new Date(goal.targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30.4));

    const requiredMonthly = remainingAmount > 0
      ? Math.ceil(remainingAmount / monthsRemaining)
      : 0;

    return {
      remainingAmount,
      progressPercentage,
      requiredMonthly,
      monthsRemaining,
      isCompleted: goal.currentAmount >= goal.targetAmount,
    };
  }

  /**
   * Execute an Account-to-Account transfer
   * Returns updated accounts array with correct balances
   */
  public static processAccountTransfer(
    accounts: Account[],
    fromAccountId: string,
    toAccountId: string,
    amount: number
  ): { updatedAccounts: Account[]; error?: string } {
    if (fromAccountId === toAccountId) {
      return { updatedAccounts: accounts, error: 'Source and destination accounts cannot be the same' };
    }
    if (amount <= 0) {
      return { updatedAccounts: accounts, error: 'Transfer amount must be greater than zero' };
    }

    const fromAccount = accounts.find((a) => a.id === fromAccountId);
    const toAccount = accounts.find((a) => a.id === toAccountId);

    if (!fromAccount || !toAccount) {
      return { updatedAccounts: accounts, error: 'Account not found' };
    }

    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === fromAccountId) {
        return { ...acc, balance: acc.balance - amount };
      }
      if (acc.id === toAccountId) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });

    return { updatedAccounts };
  }

  /**
   * Format currency values nicely (e.g. ₹52,450)
   */
  public static formatCurrency(amount: number, symbol: string = '₹'): string {
    const isNegative = amount < 0;
    const absVal = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(absVal);

    return `${isNegative ? '-' : ''}${symbol}${formatted}`;
  }
}
