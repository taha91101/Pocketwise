import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Budget, NotificationSettings, RecurringPayment, SavingsGoal, Transaction } from '../types';
import { FinancialCalculationsService } from './financialCalculations';

export const POCKETWISE_NOTIFICATION_CHANNEL_ID = 'pocketwise_reminders';

// Setup foreground notification presentation handler
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    // Graceful fallback in environments without native notification handlers
  }
}

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
   * Initializes notification channels required on Android 8+
   */
  public static async initNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync(POCKETWISE_NOTIFICATION_CHANNEL_ID, {
        name: 'PocketWise Reminders & Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A73E8',
      });
    } catch (error) {
      console.warn('Failed to configure Android notification channel:', error);
    }
  }

  /**
   * Requests runtime notification permissions on Android 13+ and iOS.
   */
  public static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const existing = await Notifications.getPermissionsAsync();
      if (existing.granted || existing.status === 'granted') {
        return true;
      }
      const response = await Notifications.requestPermissionsAsync();
      return response.granted || response.status === 'granted';
    } catch (error) {
      console.warn('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedules or reschedules native local notifications for upcoming recurring payments,
   * budget threshold warnings, and goal milestones based on user settings.
   */
  public static async syncSystemNotifications(
    settings: NotificationSettings,
    budgets: Budget[],
    transactions: Transaction[],
    recurringPayments: RecurringPayment[],
    savingsGoals: SavingsGoal[],
    currencySymbol: string = '₹'
  ): Promise<number> {
    if (Platform.OS === 'web') return 0;
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return 0;

      await this.initNotificationChannels();

      // Cancel previous scheduled reminders to avoid duplication
      await Notifications.cancelAllScheduledNotificationsAsync();

      let scheduledCount = 0;
      const now = new Date();

      // 1. Upcoming Recurring Payments
      if (settings.recurringPayments) {
        for (const rec of recurringPayments) {
          if (!rec.isActive) continue;

          const dueDate = new Date(rec.nextDueDate);
          const reminderDays = rec.reminderDaysBefore || 1;
          const triggerDate = new Date(dueDate.getTime() - reminderDays * 24 * 60 * 60 * 1000);
          triggerDate.setHours(9, 0, 0, 0); // 9:00 AM

          if (triggerDate.getTime() > now.getTime()) {
            const body = settings.hideAmountsInNotifications
              ? `${rec.title} is due soon.`
              : `${rec.title} of ${currencySymbol}${rec.amount.toLocaleString()} is due soon.`;

            await Notifications.scheduleNotificationAsync({
              content: {
                title: `📅 Bill Reminder: ${rec.title}`,
                body,
                data: { type: 'recurring', id: rec.id },
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: triggerDate,
                channelId: POCKETWISE_NOTIFICATION_CHANNEL_ID,
              },
            });
            scheduledCount++;
          }
        }
      }

      // 2. Budget Threshold Warnings
      if (settings.budgetWarnings) {
        for (const bgt of budgets) {
          const perf = FinancialCalculationsService.calculateBudgetPerformance(bgt, transactions);
          if (perf.status === 'exceeded') {
            const body = settings.hideAmountsInNotifications
              ? `You have exceeded your ${bgt.name} budget limit.`
              : `You've spent ${currencySymbol}${perf.spent.toLocaleString()} (${perf.percentageUsed}% of ${bgt.name} limit).`;

            await Notifications.scheduleNotificationAsync({
              content: {
                title: `⚠️ Budget Exceeded: ${bgt.name}`,
                body,
                data: { type: 'budget', id: bgt.id },
                sound: true,
              },
              trigger: {
                channelId: POCKETWISE_NOTIFICATION_CHANNEL_ID,
              },
            });
            scheduledCount++;
          } else if (perf.status === 'warning') {
            const body = settings.hideAmountsInNotifications
              ? `You've used ${perf.percentageUsed}% of your ${bgt.name} budget.`
              : `You've used ${perf.percentageUsed}% of ${bgt.name}. ${currencySymbol}${perf.remaining.toLocaleString()} left.`;

            await Notifications.scheduleNotificationAsync({
              content: {
                title: `🔔 Budget Alert: ${bgt.name}`,
                body,
                data: { type: 'budget', id: bgt.id },
                sound: true,
              },
              trigger: {
                channelId: POCKETWISE_NOTIFICATION_CHANNEL_ID,
              },
            });
            scheduledCount++;
          }
        }
      }

      // 3. Goal Milestones
      if (settings.goalMilestones) {
        for (const goal of savingsGoals) {
          const metrics = FinancialCalculationsService.calculateGoalMetrics(goal);
          if (metrics.isCompleted) {
            const body = settings.hideAmountsInNotifications
              ? `You've achieved your savings target for ${goal.name}!`
              : `You reached your full target of ${currencySymbol}${goal.targetAmount.toLocaleString()} for ${goal.name}!`;

            await Notifications.scheduleNotificationAsync({
              content: {
                title: `🎉 Goal Completed: ${goal.name}!`,
                body,
                data: { type: 'goal', id: goal.id },
                sound: true,
              },
              trigger: {
                channelId: POCKETWISE_NOTIFICATION_CHANNEL_ID,
              },
            });
            scheduledCount++;
          }
        }
      }

      return scheduledCount;
    } catch (error) {
      console.warn('Failed to sync system notifications:', error);
      return 0;
    }
  }

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

  /**
   * Calculates the next due date for a recurring commitment given its frequency,
   * accounting for month-end clamps (e.g., Jan 31 -> Feb 28/29) and leap years.
   */
  public static calculateNextDueDate(
    currentDueDate: string | Date,
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Date {
    const date = new Date(currentDueDate);
    const targetDay = date.getDate();

    switch (frequency) {
      case 'daily': {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        return next;
      }
      case 'weekly': {
        const next = new Date(date);
        next.setDate(next.getDate() + 7);
        return next;
      }
      case 'monthly': {
        const year = date.getFullYear();
        const month = date.getMonth();
        const nextMonth = month + 1;
        const targetYear = year + Math.floor(nextMonth / 12);
        const normalizedMonth = nextMonth % 12;

        const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
        const clampedDay = Math.min(targetDay, daysInTargetMonth);

        const next = new Date(date);
        next.setDate(1);
        next.setFullYear(targetYear);
        next.setMonth(normalizedMonth);
        next.setDate(clampedDay);
        return next;
      }
      case 'yearly': {
        const targetYear = date.getFullYear() + 1;
        const month = date.getMonth();
        const daysInTargetMonth = new Date(targetYear, month + 1, 0).getDate();
        const clampedDay = Math.min(targetDay, daysInTargetMonth);

        const next = new Date(date);
        next.setDate(1);
        next.setFullYear(targetYear);
        next.setMonth(month);
        next.setDate(clampedDay);
        return next;
      }
    }
  }
}
