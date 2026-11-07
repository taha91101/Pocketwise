import { NotificationService } from '../services/notificationService';
import { Budget, NotificationSettings, RecurringPayment, SavingsGoal, Transaction } from '../types';

describe('NotificationService & Recurring Logic', () => {
  const defaultSettings: NotificationSettings = {
    budgetWarnings: true,
    recurringPayments: true,
    savingsReminders: true,
    monthlySummary: true,
    goalMilestones: true,
    automaticExpenseDetection: true,
    autoConfirmHighConfidence: true,
    detectRefunds: true,
    detectBankNotifications: true,
  };

  const sampleBudget: Budget = {
    id: 'bgt-food',
    categoryId: 'cat-food',
    name: 'Monthly Dining',
    amount: 1000,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    alertThreshold: 80,
  };

  const sampleGoal: SavingsGoal = {
    id: 'goal-vacation',
    name: 'Vacation Vault',
    targetAmount: 5000,
    currentAmount: 2000,
    targetDate: '2027-12-31',
    monthlyContribution: 500,
    color: '#10B981',
    icon: 'plane',
    isCompleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  describe('checkAndGenerateNotifications - Notification Generation', () => {
    it('returns empty array when all relevant settings are false', () => {
      const disabledSettings: NotificationSettings = {
        ...defaultSettings,
        budgetWarnings: false,
        recurringPayments: false,
        goalMilestones: false,
      };

      const result = NotificationService.checkAndGenerateNotifications(
        disabledSettings,
        [sampleBudget],
        [],
        [],
        [sampleGoal]
      );

      expect(result).toEqual([]);
    });

    describe('Budget Warnings & Exceeded Thresholds', () => {
      it('generates a warning notification when budget spend is between 80% and 99%', () => {
        const transactions: Transaction[] = [
          {
            id: 'tx-1',
            title: 'Dinner',
            amount: 850, // 85% of 1000
            type: 'expense',
            categoryId: 'cat-food',
            categoryName: 'Food & Dining',
            categoryIcon: 'coffee',
            categoryColor: '#EF4444',
            date: new Date().toISOString(),
            accountId: 'acc-1',
            accountName: 'Main',
            paymentMethod: 'UPI',
            createdAt: new Date().toISOString(),
          },
        ];

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [sampleBudget],
          transactions,
          [],
          []
        );

        const budgetNotif = notifs.find((n) => n.type === 'budget');
        expect(budgetNotif).toBeDefined();
        expect(budgetNotif?.title).toContain('🔔 Budget Warning');
        expect(budgetNotif?.body).toContain('85%');
      });

      it('generates an exceeded notification when budget spend is >= 100%', () => {
        const transactions: Transaction[] = [
          {
            id: 'tx-2',
            title: 'Feast',
            amount: 1100, // 110% of 1000
            type: 'expense',
            categoryId: 'cat-food',
            categoryName: 'Food & Dining',
            categoryIcon: 'coffee',
            categoryColor: '#EF4444',
            date: new Date().toISOString(),
            accountId: 'acc-1',
            accountName: 'Main',
            paymentMethod: 'UPI',
            createdAt: new Date().toISOString(),
          },
        ];

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [sampleBudget],
          transactions,
          [],
          []
        );

        const budgetNotif = notifs.find((n) => n.type === 'budget');
        expect(budgetNotif).toBeDefined();
        expect(budgetNotif?.title).toContain('⚠️ Budget Exceeded');
        expect(budgetNotif?.body).toContain('110%');
      });

      it('does not generate notification when budget spend is under 80%', () => {
        const transactions: Transaction[] = [
          {
            id: 'tx-3',
            title: 'Snack',
            amount: 500, // 50%
            type: 'expense',
            categoryId: 'cat-food',
            categoryName: 'Food & Dining',
            categoryIcon: 'coffee',
            categoryColor: '#EF4444',
            date: new Date().toISOString(),
            accountId: 'acc-1',
            accountName: 'Main',
            paymentMethod: 'UPI',
            createdAt: new Date().toISOString(),
          },
        ];

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [sampleBudget],
          transactions,
          [],
          []
        );

        const budgetNotifs = notifs.filter((n) => n.type === 'budget');
        expect(budgetNotifs.length).toBe(0);
      });
    });

    describe('Savings Goal Milestones', () => {
      it('generates milestone celebration when a goal is completed', () => {
        const completedGoal: SavingsGoal = {
          ...sampleGoal,
          currentAmount: 5000,
          isCompleted: true,
        };

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [],
          [completedGoal]
        );

        const goalNotif = notifs.find((n) => n.type === 'goal');
        expect(goalNotif).toBeDefined();
        expect(goalNotif?.title).toContain('🎉 Goal Completed');
        expect(goalNotif?.body).toContain('5,000');
      });

      it('does not generate milestone when goal is incomplete', () => {
        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [],
          [sampleGoal] // currentAmount: 2000 of 5000
        );

        const goalNotifs = notifs.filter((n) => n.type === 'goal');
        expect(goalNotifs.length).toBe(0);
      });
    });

    describe('Recurring Payment Reminders & Inactive Logic', () => {
      it('skips inactive recurring payments completely even if due today', () => {
        const todayIso = new Date().toISOString();
        const inactiveRecurring: RecurringPayment = {
          id: 'rec-inactive',
          title: 'Cancelled Gym Membership',
          amount: 1500,
          frequency: 'monthly',
          categoryId: 'cat-health',
          categoryName: 'Health',
          accountId: 'acc-1',
          accountName: 'Checking',
          nextDueDate: todayIso,
          isActive: false, // Inactive
          reminderDaysBefore: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        };

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [inactiveRecurring],
          []
        );

        expect(notifs.filter((n) => n.type === 'recurring').length).toBe(0);
      });

      it('generates "due today" reminder when due date is today', () => {
        const now = new Date();
        const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString();

        const recurring: RecurringPayment = {
          id: 'rec-today',
          title: 'Electricity Bill',
          amount: 2400,
          frequency: 'monthly',
          categoryId: 'cat-bills',
          categoryName: 'Bills',
          accountId: 'acc-1',
          accountName: 'Checking',
          nextDueDate: todayIso,
          isActive: true,
          reminderDaysBefore: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        };

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [recurring],
          []
        );

        const recNotif = notifs.find((n) => n.id === `notif-rec-${recurring.id}`);
        expect(recNotif).toBeDefined();
        expect(recNotif?.body).toContain('due today');
      });

      it('generates "due tomorrow" reminder when due date is 1 day away', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const recurring: RecurringPayment = {
          id: 'rec-tomorrow',
          title: 'Netflix Subscription',
          amount: 649,
          frequency: 'monthly',
          categoryId: 'cat-sub',
          categoryName: 'Subscription',
          accountId: 'acc-1',
          accountName: 'Checking',
          nextDueDate: tomorrow.toISOString(),
          isActive: true,
          reminderDaysBefore: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        };

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [recurring],
          []
        );

        const recNotif = notifs.find((n) => n.id === `notif-rec-${recurring.id}`);
        expect(recNotif).toBeDefined();
        expect(recNotif?.body).toContain('due tomorrow');
      });

      it('generates "due in X days" when due within reminderDaysBefore', () => {
        const inThreeDays = new Date();
        inThreeDays.setDate(inThreeDays.getDate() + 3);

        const recurring: RecurringPayment = {
          id: 'rec-3d',
          title: 'WiFi Broadband',
          amount: 999,
          frequency: 'monthly',
          categoryId: 'cat-bills',
          categoryName: 'Bills',
          accountId: 'acc-1',
          accountName: 'Checking',
          nextDueDate: inThreeDays.toISOString(),
          isActive: true,
          reminderDaysBefore: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
        };

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [recurring],
          []
        );

        const recNotif = notifs.find((n) => n.id === `notif-rec-${recurring.id}`);
        expect(recNotif).toBeDefined();
        expect(recNotif?.body).toContain('due in 3 days');
      });

      it('does not generate reminder if due date is beyond reminderDaysBefore', () => {
        const inTenDays = new Date();
        inTenDays.setDate(inTenDays.getDate() + 10);

        const recurring: RecurringPayment = {
          id: 'rec-far',
          title: 'Rent',
          amount: 25000,
          frequency: 'monthly',
          categoryId: 'cat-housing',
          categoryName: 'Housing',
          accountId: 'acc-1',
          accountName: 'Checking',
          nextDueDate: inTenDays.toISOString(),
          isActive: true,
          reminderDaysBefore: 3, // only remind 3 days before
          createdAt: '2026-01-01T00:00:00.000Z',
        };

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [recurring],
          []
        );

        expect(notifs.filter((n) => n.type === 'recurring').length).toBe(0);
      });

      it('does not generate advance reminder for past due recurring items (diffDays < 0)', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        const recurring: RecurringPayment = {
          id: 'rec-overdue',
          title: 'Old Bill',
          amount: 500,
          frequency: 'monthly',
          categoryId: 'cat-bills',
          categoryName: 'Bills',
          accountId: 'acc-1',
          accountName: 'Checking',
          nextDueDate: pastDate.toISOString(),
          isActive: true,
          reminderDaysBefore: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        };

        const notifs = NotificationService.checkAndGenerateNotifications(
          defaultSettings,
          [],
          [],
          [recurring],
          []
        );

        expect(notifs.filter((n) => n.type === 'recurring').length).toBe(0);
      });
    });
  });

  describe('NotificationService.calculateNextDueDate - Calendar Edge Cases', () => {
    describe('Daily frequency', () => {
      it('advances daily by exactly 1 day', () => {
        const next = NotificationService.calculateNextDueDate('2026-05-10T10:00:00.000Z', 'daily');
        expect(next.getDate()).toBe(11);
        expect(next.getMonth()).toBe(4); // May
      });

      it('handles leap day correctly (Feb 28 to Feb 29 in leap year 2024)', () => {
        const next = NotificationService.calculateNextDueDate('2024-02-28T12:00:00.000Z', 'daily');
        expect(next.getFullYear()).toBe(2024);
        expect(next.getMonth()).toBe(1); // Feb
        expect(next.getDate()).toBe(29);
      });

      it('handles non-leap year (Feb 28 to Mar 1 in 2023)', () => {
        const next = NotificationService.calculateNextDueDate('2023-02-28T12:00:00.000Z', 'daily');
        expect(next.getFullYear()).toBe(2023);
        expect(next.getMonth()).toBe(2); // Mar
        expect(next.getDate()).toBe(1);
      });

      it('handles year rollover (Dec 31 to Jan 1)', () => {
        const next = NotificationService.calculateNextDueDate('2026-12-31T12:00:00.000Z', 'daily');
        expect(next.getFullYear()).toBe(2027);
        expect(next.getMonth()).toBe(0); // Jan
        expect(next.getDate()).toBe(1);
      });
    });

    describe('Weekly frequency', () => {
      it('advances weekly by 7 days across month boundary', () => {
        const next = NotificationService.calculateNextDueDate('2026-01-28T12:00:00.000Z', 'weekly');
        expect(next.getMonth()).toBe(1); // Feb
        expect(next.getDate()).toBe(4);
      });

      it('advances weekly across year boundary', () => {
        const next = NotificationService.calculateNextDueDate('2026-12-28T12:00:00.000Z', 'weekly');
        expect(next.getFullYear()).toBe(2027);
        expect(next.getMonth()).toBe(0); // Jan
        expect(next.getDate()).toBe(4);
      });
    });

    describe('Monthly frequency - Month-End Clamping & Leap Years', () => {
      it('advances standard mid-month date to next month on same day', () => {
        const next = NotificationService.calculateNextDueDate('2026-04-15T10:00:00.000Z', 'monthly');
        expect(next.getFullYear()).toBe(2026);
        expect(next.getMonth()).toBe(4); // May
        expect(next.getDate()).toBe(15);
      });

      it('clamps Jan 31 to Feb 28 in a non-leap year (2023)', () => {
        const next = NotificationService.calculateNextDueDate('2023-01-31T10:00:00.000Z', 'monthly');
        expect(next.getFullYear()).toBe(2023);
        expect(next.getMonth()).toBe(1); // Feb
        expect(next.getDate()).toBe(28);
      });

      it('clamps Jan 31 to Feb 29 in a leap year (2024)', () => {
        const next = NotificationService.calculateNextDueDate('2024-01-31T10:00:00.000Z', 'monthly');
        expect(next.getFullYear()).toBe(2024);
        expect(next.getMonth()).toBe(1); // Feb
        expect(next.getDate()).toBe(29);
      });

      it('clamps March 31 to April 30 (30-day month)', () => {
        const next = NotificationService.calculateNextDueDate('2026-03-31T10:00:00.000Z', 'monthly');
        expect(next.getFullYear()).toBe(2026);
        expect(next.getMonth()).toBe(3); // April
        expect(next.getDate()).toBe(30);
      });

      it('handles year transition from Dec 31 to Jan 31 of next year', () => {
        const next = NotificationService.calculateNextDueDate('2026-12-31T10:00:00.000Z', 'monthly');
        expect(next.getFullYear()).toBe(2027);
        expect(next.getMonth()).toBe(0); // Jan
        expect(next.getDate()).toBe(31);
      });
    });

    describe('Yearly frequency - Leap Day Handling', () => {
      it('advances standard date by 1 year', () => {
        const next = NotificationService.calculateNextDueDate('2026-06-15T10:00:00.000Z', 'yearly');
        expect(next.getFullYear()).toBe(2027);
        expect(next.getMonth()).toBe(5); // June
        expect(next.getDate()).toBe(15);
      });

      it('clamps Feb 29 from leap year to Feb 28 in non-leap year', () => {
        const next = NotificationService.calculateNextDueDate('2024-02-29T10:00:00.000Z', 'yearly');
        expect(next.getFullYear()).toBe(2025);
        expect(next.getMonth()).toBe(1); // Feb
        expect(next.getDate()).toBe(28);
      });
    });
  });
});
