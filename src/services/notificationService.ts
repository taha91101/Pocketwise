import { Budget, NotificationSettings, RecurringPayment, SavingsGoal, Transaction } from '../types';
import { FinancialCalculationsService } from './financialCalculations';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'budget' | 'recurring' | 'savings' | 'summary' | 'goal';
  timestamp: string;
  read?: boolean;
}

export class NotificationService {
  /**
   * Generates active notifications based on current financial metrics and user preferences
   */
  public static checkAndGenerateNotifications(
    settings: NotificationSettings,
    budgets: Budget[],
    transactions: Transaction[],
    recurringPayments: RecurringPayment[],
    savingsGoals: SavingsGoal[],
    currencySymbol: string = '₹'
  ): AppNotification[] {
    const list: AppNotification[] = [];
    const now = new Date();

    // 1. Budget Warnings
    if (settings.budgetWarnings) {
      for (const bgt of budgets) {
        const perf = FinancialCalculationsService.calculateBudgetPerformance(bgt, transactions);
        if (perf.status === 'exceeded') {
          list.push({
            id: `notif-bgt-exc-${bgt.id}`,
            title: `⚠️ Budget Exceeded: ${bgt.name}`,
            body: `You've spent ${currencySymbol}${perf.spent.toLocaleString()} which is ${perf.percentageUsed}% of your budget limit.`,
            type: 'budget',
            timestamp: now.toISOString(),
          });
        } else if (perf.status === 'warning') {
          list.push({
            id: `notif-bgt-warn-${bgt.id}`,
            title: `🔔 Budget Warning: ${bgt.name}`,
            body: `You've used ${perf.percentageUsed}% of your ${bgt.name} budget. ${currencySymbol}${perf.remaining.toLocaleString()} left.`,
            type: 'budget',
            timestamp: now.toISOString(),
          });
        }
      }
    }

    // 2. Upcoming Recurring Payments
    if (settings.recurringPayments) {
      for (const rec of recurringPayments) {
        if (!rec.isActive) continue;
        const dueDate = new Date(rec.nextDueDate);
        const diffMs = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= rec.reminderDaysBefore && diffDays >= 0) {
          const dueText = diffDays === 0 ? 'due today' : diffDays === 1 ? 'due tomorrow' : `due in ${diffDays} days`;
          list.push({
            id: `notif-rec-${rec.id}`,
            title: `📅 Payment Reminder: ${rec.title}`,
            body: `${rec.title} of ${currencySymbol}${rec.amount.toLocaleString()} is ${dueText}.`,
            type: 'recurring',
            timestamp: now.toISOString(),
          });
        }
      }
    }

    // 3. Goal Milestones
    if (settings.goalMilestones) {
      for (const goal of savingsGoals) {
        const metrics = FinancialCalculationsService.calculateGoalMetrics(goal);
        if (metrics.isCompleted) {
          list.push({
            id: `notif-goal-${goal.id}`,
            title: `🎉 Goal Completed: ${goal.name}!`,
            body: `Congratulations! You reached your full target of ${currencySymbol}${goal.targetAmount.toLocaleString()}.`,
            type: 'goal',
            timestamp: now.toISOString(),
          });
        }
      }
    }

    return list;
  }
}
