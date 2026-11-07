import { Budget, Category, SavingsGoal, Transaction } from '../types';

export interface BudgetSuggestion {
  categoryId: string;
  categoryName: string;
  averageMonthlySpend: number;
  suggestedLimit: number;
  dataMonthsCount: number;
  recentMonthlyTotals: number[];
}

export interface ZeroBasedBudgetSummary {
  monthlyIncome: number;
  totalAssignedToBudgets: number;
  totalAssignedToGoals: number;
  totalAssigned: number;
  unassignedIncome: number;
  isBalanced: boolean;
  budgetPercentage: number;
  savingsPercentage: number;
  unassignedPercentage: number;
}

export class BudgetService {
  /**
   * Calculates effective spending limit for a budget, including rollover if enabled.
   */
  public static getEffectiveLimit(budget: Budget): number {
    const base = Number(budget.amount) || 0;
    if (!budget.rolloverEnabled) {
      return base;
    }
    const rollover = Math.max(0, Number(budget.rolloverAmount) || 0);
    const combined = base + rollover;
    if (budget.overallMonthlyCap && budget.overallMonthlyCap > 0) {
      return Math.min(combined, budget.overallMonthlyCap);
    }
    return combined;
  }

  /**
   * Applies rollover calculation at month boundary or refresh.
   * If a budget has rolloverEnabled, unspent amount from the previous calendar month
   * rolls over into rolloverAmount for the current month.
   */
  public static calculateRollovers(
    budgets: Budget[],
    transactions: Transaction[],
    currentDate: Date = new Date()
  ): Budget[] {
    const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthStart = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
    const prevMonthEnd = new Date(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const prevMonthTransactions = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const d = new Date(tx.date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });

    return budgets.map((b) => {
      if (!b.rolloverEnabled) {
        return {
          ...b,
          rolloverAmount: 0,
        };
      }

      // Calculate actual spending in previous month for this category
      const spentInPrevMonth = prevMonthTransactions
        .filter((tx) => tx.categoryId === b.categoryId)
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      const unspent = Math.max(0, b.amount - spentInPrevMonth);
      let calculatedRollover = Math.round(unspent);

      if (b.overallMonthlyCap && b.overallMonthlyCap > 0) {
        const maxAllowedRollover = Math.max(0, b.overallMonthlyCap - b.amount);
        calculatedRollover = Math.min(calculatedRollover, maxAllowedRollover);
      }

      return {
        ...b,
        rolloverAmount: calculatedRollover,
      };
    });
  }

  /**
   * Analyzes spending over the last 1 to 3 months to provide smart suggestions for budget limits.
   */
  public static generateBudgetSuggestions(
    transactions: Transaction[],
    categories: Category[],
    currentDate: Date = new Date()
  ): BudgetSuggestion[] {
    const results: BudgetSuggestion[] = [];

    // Analyze up to 3 previous full months
    const monthBuckets: { start: Date; end: Date }[] = [];
    for (let m = 1; m <= 3; m++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - m, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      monthBuckets.push({ start, end });
    }

    // Expense categories
    const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

    for (const cat of expenseCategories) {
      const monthlySpends: number[] = [];

      for (const bucket of monthBuckets) {
        const spent = transactions
          .filter((tx) => {
            if (tx.type !== 'expense' || tx.categoryId !== cat.id) return false;
            const txDate = new Date(tx.date);
            return txDate >= bucket.start && txDate <= bucket.end;
          })
          .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        monthlySpends.push(spent);
      }

      const activeMonths = monthlySpends.filter((s) => s > 0);
      if (activeMonths.length === 0) continue;

      const totalSpent = monthlySpends.reduce((a, b) => a + b, 0);
      const averageMonthlySpend = Math.round(totalSpent / monthBuckets.length);

      // Suggest limit: average + 10% buffer, rounded up to nearest 100
      const withBuffer = averageMonthlySpend * 1.1;
      const suggestedLimit = Math.max(500, Math.ceil(withBuffer / 100) * 100);

      results.push({
        categoryId: cat.id,
        categoryName: cat.name,
        averageMonthlySpend,
        suggestedLimit,
        dataMonthsCount: activeMonths.length,
        recentMonthlyTotals: monthlySpends,
      });
    }

    // Sort by largest average spend first
    return results.sort((a, b) => b.averageMonthlySpend - a.averageMonthlySpend);
  }

  /**
   * Computes zero-based budgeting allocation metrics.
   * "Every rupee has a job": Income = Budgets + Savings Goals + Leftover.
   */
  public static calculateZeroBasedBudgeting(
    monthlyIncome: number,
    budgets: Budget[],
    goals: SavingsGoal[]
  ): ZeroBasedBudgetSummary {
    const validIncome = Math.max(0, Number(monthlyIncome) || 0);

    const totalAssignedToBudgets = budgets.reduce(
      (sum, b) => sum + (Number(b.amount) || 0),
      0
    );

    const totalAssignedToGoals = goals
      .filter((g) => !g.isCompleted)
      .reduce((sum, g) => sum + (Number(g.monthlyContribution) || 0), 0);

    const totalAssigned = totalAssignedToBudgets + totalAssignedToGoals;
    const unassignedIncome = Math.round((validIncome - totalAssigned) * 100) / 100;
    const isBalanced = validIncome > 0 && Math.abs(unassignedIncome) < 1;

    const budgetPercentage =
      validIncome > 0 ? Math.round((totalAssignedToBudgets / validIncome) * 1000) / 10 : 0;
    const savingsPercentage =
      validIncome > 0 ? Math.round((totalAssignedToGoals / validIncome) * 1000) / 10 : 0;
    const unassignedPercentage =
      validIncome > 0 ? Math.max(0, Math.round((unassignedIncome / validIncome) * 1000) / 10) : 0;

    return {
      monthlyIncome: validIncome,
      totalAssignedToBudgets,
      totalAssignedToGoals,
      totalAssigned,
      unassignedIncome,
      isBalanced,
      budgetPercentage,
      savingsPercentage,
      unassignedPercentage,
    };
  }
}

