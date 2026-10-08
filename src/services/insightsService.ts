import { Account, Budget, FinancialInsight, SavingsGoal, Transaction } from '../types';
import { FinancialCalculationsService } from './financialCalculations';

export class InsightsService {
  public static generateInsights(
    transactions: Transaction[],
    accounts: Account[],
    budgets: Budget[],
    goals: SavingsGoal[],
    currencySymbol: string = '₹'
  ): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const currentExpenses = FinancialCalculationsService.calculateTotalExpenses(transactions, startOfMonth, endOfMonth);
    const prevExpenses = FinancialCalculationsService.calculateTotalExpenses(transactions, prevMonthStart, prevMonthEnd);
    const currentIncome = FinancialCalculationsService.calculateTotalIncome(transactions, startOfMonth, endOfMonth);
    const currentSavings = FinancialCalculationsService.calculateTotalSavingsAllocated(transactions, startOfMonth, endOfMonth);

    // 1. Spending comparison insight
    if (prevExpenses > 0 && currentExpenses > 0) {
      const diffPct = Math.round(((currentExpenses - prevExpenses) / prevExpenses) * 100);
      if (diffPct < 0) {
        insights.push({
          id: 'ins-spending-reduced',
          type: 'achievement',
          title: 'Lower Spending Trend',
          description: `You spent ${Math.abs(diffPct)}% less this month compared to last month. Excellent financial discipline!`,
          icon: 'trending-down',
          color: '#10B981',
          date: now.toISOString(),
        });
      } else if (diffPct > 0) {
        insights.push({
          id: 'ins-spending-increased',
          type: 'warning',
          title: 'Spending Acceleration',
          description: `Your spending is up ${diffPct}% this month compared to last month. Review discretionary expenses.`,
          icon: 'trending-up',
          color: '#EF4444',
          date: now.toISOString(),
        });
      }
    }

    // 2. Biggest Category Breakdown
    const breakdowns = FinancialCalculationsService.calculateCategoryBreakdown(transactions, startOfMonth, endOfMonth);
    if (breakdowns.length > 0) {
      const topCat = breakdowns[0];
      insights.push({
        id: 'ins-top-cat',
        type: 'tip',
        title: `Top Expense: ${topCat.categoryName}`,
        description: `${topCat.categoryName} represents ${topCat.percentage}% (${currencySymbol}${topCat.amount.toLocaleString()}) of your monthly spend.`,
        amountImpact: topCat.amount,
        icon: 'pie-chart',
        color: topCat.categoryColor || '#3B82F6',
        date: now.toISOString(),
      });

      // 3. Smart "Save More" suggestion on top discretionary categories (food, shopping, entertainment)
      if (['cat-food', 'cat-shopping', 'cat-entertainment'].includes(topCat.categoryId) || topCat.categoryName.toLowerCase().includes('food') || topCat.categoryName.toLowerCase().includes('dining')) {
        const potentialSavings = Math.round(topCat.amount * 0.2);
        insights.push({
          id: 'ins-smart-save',
          type: 'saving',
          title: `Smart Save: ${topCat.categoryName}`,
          description: `You spent ${currencySymbol}${topCat.amount.toLocaleString()} on ${topCat.categoryName}. Trimming this by 20% puts ${currencySymbol}${potentialSavings.toLocaleString()}/month into savings.`,
          amountImpact: potentialSavings,
          icon: 'zap',
          color: '#0D9488',
          date: now.toISOString(),
        });
      }
    }

    // 4. Savings rate achievement
    if (currentIncome > 0) {
      const savingsRate = FinancialCalculationsService.calculateSavingsRate(currentIncome, currentSavings);
      if (savingsRate >= 20) {
        insights.push({
          id: 'ins-savings-rate-high',
          type: 'achievement',
          title: 'Strong Savings Rate',
          description: `You've saved ${savingsRate}% of your income this month! You are exceeding the standard 50/30/20 rule.`,
          icon: 'award',
          color: '#10B981',
          date: now.toISOString(),
        });
      } else if (savingsRate > 0) {
        insights.push({
          id: 'ins-savings-rate-normal',
          type: 'tip',
          title: 'Savings Progress',
          description: `You saved ${savingsRate}% of your income. Increasing this toward 20% will build your safety net faster.`,
          icon: 'target',
          color: '#3B82F6',
          date: now.toISOString(),
        });
      }
    }

    // 5. Average Daily Spend
    const dayOfMonth = Math.max(1, now.getDate());
    if (currentExpenses > 0) {
      const avgDaily = Math.round(currentExpenses / dayOfMonth);
      insights.push({
        id: 'ins-avg-daily',
        type: 'tip',
        title: 'Daily Spending Average',
        description: `Your average daily burn rate is ${currencySymbol}${avgDaily.toLocaleString()} per day this month.`,
        amountImpact: avgDaily,
        icon: 'calendar',
        color: '#6366F1',
        date: now.toISOString(),
      });
    }

    // 6. Budget Alerts in insights
    for (const budget of budgets) {
      const perf = FinancialCalculationsService.calculateBudgetPerformance(budget, transactions);
      if (perf.status === 'exceeded') {
        insights.push({
          id: `ins-bgt-exceeded-${budget.id}`,
          type: 'warning',
          title: `Budget Exceeded: ${budget.name}`,
          description: `You have spent ${currencySymbol}${perf.spent.toLocaleString()} against your ${currencySymbol}${budget.amount.toLocaleString()} limit (${perf.percentageUsed}% used).`,
          icon: 'alert-triangle',
          color: '#EF4444',
          date: now.toISOString(),
        });
      } else if (perf.status === 'warning') {
        insights.push({
          id: `ins-bgt-warn-${budget.id}`,
          type: 'warning',
          title: `Near Budget Limit: ${budget.name}`,
          description: `You've reached ${perf.percentageUsed}% of your ${budget.name} budget. ${currencySymbol}${perf.remaining.toLocaleString()} remaining.`,
          icon: 'alert-circle',
          color: '#F59E0B',
          date: now.toISOString(),
        });
      }
    }

    // 7. Goal milestones
    for (const goal of goals) {
      const metrics = FinancialCalculationsService.calculateGoalMetrics(goal);
      if (metrics.isCompleted) {
        insights.push({
          id: `ins-goal-done-${goal.id}`,
          type: 'achievement',
          title: `Goal Achieved: ${goal.name}! 🎉`,
          description: `Congratulations! You hit your target of ${currencySymbol}${goal.targetAmount.toLocaleString()}.`,
          icon: 'check-circle',
          color: '#10B981',
          date: now.toISOString(),
        });
      } else if (metrics.progressPercentage >= 50 && metrics.progressPercentage < 60) {
        insights.push({
          id: `ins-goal-halfway-${goal.id}`,
          type: 'achievement',
          title: `Halfway to ${goal.name}!`,
          description: `You have reached ${metrics.progressPercentage}% (${currencySymbol}${goal.currentAmount.toLocaleString()}) of your goal.`,
          icon: 'target',
          color: '#0D9488',
          date: now.toISOString(),
        });
      }
    }

    return insights;
  }
}
