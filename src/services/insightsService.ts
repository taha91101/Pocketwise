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
        filterCriteria: { categoryId: topCat.categoryId },
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
          filterCriteria: { categoryId: topCat.categoryId },
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
          filterCriteria: { categoryId: budget.categoryId },
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
          filterCriteria: { categoryId: budget.categoryId },
        });
      }
    }

    // 7. Goal milestones and pacing
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

      // Goal pacing check
      if (!metrics.isCompleted && goal.targetDate && goal.monthlyContribution > 0) {
        const targetDate = new Date(goal.targetDate);
        const monthsRemaining = Math.max(
          1,
          (targetDate.getFullYear() - now.getFullYear()) * 12 +
            (targetDate.getMonth() - now.getMonth())
        );
        const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
        const requiredMonthly = remainingAmount / monthsRemaining;

        if (goal.monthlyContribution < requiredMonthly * 0.85) {
          const deficit = Math.round(requiredMonthly - goal.monthlyContribution);
          insights.push({
            id: `ins-goal-behind-${goal.id}`,
            type: 'warning',
            title: `Behind Pace: ${goal.name}`,
            description: `To reach your goal on time, you need ${currencySymbol}${Math.round(requiredMonthly).toLocaleString()}/mo (${currencySymbol}${deficit.toLocaleString()} more than current ${currencySymbol}${goal.monthlyContribution.toLocaleString()}/mo).`,
            amountImpact: deficit,
            icon: 'clock',
            color: '#F59E0B',
            date: now.toISOString(),
          });
        } else if (goal.monthlyContribution >= requiredMonthly) {
          insights.push({
            id: `ins-goal-ontrack-${goal.id}`,
            type: 'achievement',
            title: `On Track: ${goal.name}`,
            description: `At ${currencySymbol}${goal.monthlyContribution.toLocaleString()}/mo, you are on track to reach ${goal.name} by ${targetDate.toLocaleDateString('default', { month: 'short', year: 'numeric' })}!`,
            icon: 'check',
            color: '#10B981',
            date: now.toISOString(),
          });
        }
      }
    }

    // 8. Month-over-month category spikes (>25% increase and >= ₹1,000 difference)
    const prevBreakdowns = FinancialCalculationsService.calculateCategoryBreakdown(
      transactions,
      prevMonthStart,
      prevMonthEnd
    );
    for (const currCat of breakdowns) {
      const prevCat = prevBreakdowns.find((p) => p.categoryId === currCat.categoryId);
      if (prevCat && prevCat.amount > 0) {
        const pctIncrease = Math.round(((currCat.amount - prevCat.amount) / prevCat.amount) * 100);
        const diffAmount = currCat.amount - prevCat.amount;
        if (pctIncrease >= 25 && diffAmount >= 1000) {
          insights.push({
            id: `ins-spike-${currCat.categoryId}`,
            type: 'warning',
            title: `Spike in ${currCat.categoryName}`,
            description: `Spending in ${currCat.categoryName} is up ${pctIncrease}% (${currencySymbol}${diffAmount.toLocaleString()} more than last month).`,
            amountImpact: diffAmount,
            icon: 'trending-up',
            color: '#EF4444',
            date: now.toISOString(),
            filterCriteria: { categoryId: currCat.categoryId },
          });
        }
      }
    }

    // 9. No-spend streak (consecutive recent days with zero discretionary expense)
    const currentMonthExpenses = transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;
      const d = new Date(tx.date);
      return d >= startOfMonth && d <= now;
    });

    const expenseDates = new Set(
      currentMonthExpenses.map((tx) => new Date(tx.date).toISOString().split('T')[0])
    );

    let streakDays = 0;
    // Check backwards from yesterday
    for (let i = 1; i <= Math.min(14, now.getDate() - 1); i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const iso = checkDate.toISOString().split('T')[0];
      if (!expenseDates.has(iso)) {
        streakDays++;
      } else {
        break;
      }
    }

    if (streakDays >= 2) {
      insights.push({
        id: 'ins-no-spend-streak',
        type: 'achievement',
        title: `🔥 ${streakDays}-Day No-Spend Streak!`,
        description: `You have gone ${streakDays} consecutive days without discretionary spending. Outstanding self-control!`,
        icon: 'zap',
        color: '#10B981',
        date: now.toISOString(),
      });
    }

    // 10. Outlier transaction flags (> 3x category median and >= ₹2,000)
    for (const cat of breakdowns) {
      const catExpenses = currentMonthExpenses
        .filter((tx) => tx.categoryId === cat.categoryId)
        .map((tx) => Number(tx.amount) || 0)
        .sort((a, b) => a - b);

      if (catExpenses.length >= 3) {
        const mid = Math.floor(catExpenses.length / 2);
        const median =
          catExpenses.length % 2 !== 0
            ? catExpenses[mid]
            : (catExpenses[mid - 1] + catExpenses[mid]) / 2;

        if (median > 0) {
          const outliers = currentMonthExpenses.filter(
            (tx) =>
              tx.categoryId === cat.categoryId &&
              tx.amount >= 2000 &&
              tx.amount >= median * 3
          );

          for (const outTx of outliers) {
            insights.push({
              id: `ins-outlier-${outTx.id}`,
              type: 'tip',
              title: `Unusual Expense: ${outTx.title}`,
              description: `This ${currencySymbol}${outTx.amount.toLocaleString()} transaction is ${Math.round((outTx.amount / median) * 10) / 10}x higher than your usual ${cat.categoryName} expense.`,
              amountImpact: outTx.amount,
              icon: 'alert-circle',
              color: '#F59E0B',
              date: now.toISOString(),
              filterCriteria: { transactionIds: [outTx.id], categoryId: cat.categoryId },
            });
          }
        }
      }
    }

    return insights;
  }
}
