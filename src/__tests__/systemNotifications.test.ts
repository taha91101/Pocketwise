import * as Notifications from 'expo-notifications';
import { NotificationService, POCKETWISE_NOTIFICATION_CHANNEL_ID } from '../services/notificationService';
import { Budget, NotificationSettings, RecurringPayment, SavingsGoal, Transaction } from '../types';

describe('System Notifications Service (F1.5)', () => {
  const defaultSettings: NotificationSettings = {
    budgetWarnings: true,
    recurringPayments: true,
    savingsReminders: true,
    monthlySummary: true,
    goalMilestones: true,
    hideAmountsInNotifications: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes android notification channel with high importance', async () => {
    await NotificationService.initNotificationChannels();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      POCKETWISE_NOTIFICATION_CHANNEL_ID,
      expect.objectContaining({
        name: expect.stringContaining('PocketWise'),
        importance: Notifications.AndroidImportance.HIGH,
      })
    );
  });

  it('requests notification permissions when not yet granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'undetermined',
      granted: false,
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
    });

    const result = await NotificationService.requestPermissions();
    expect(result).toBe(true);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('schedules notifications for upcoming recurring payments respecting privacy setting', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
    });

    const futureDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const recurring: RecurringPayment[] = [
      {
        id: 'rec-1',
        title: 'Electricity Bill',
        amount: 2500,
        categoryId: 'cat-bills',
        categoryName: 'Bills',
        categoryIcon: 'zap',
        categoryColor: '#FFA000',
        accountId: 'acc-1',
        accountName: 'Bank',
        frequency: 'monthly',
        nextDueDate: futureDue,
        isActive: true,
        reminderDaysBefore: 1, // trigger is ~2 days from now, which is > now
        createdAt: new Date().toISOString(),
      },
    ];

    const scheduled = await NotificationService.syncSystemNotifications(
      defaultSettings,
      [],
      [],
      recurring,
      [],
      '₹'
    );

    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('Electricity Bill'),
          body: 'Electricity Bill is due soon.', // Amount hidden due to privacy setting
        }),
        trigger: expect.objectContaining({
          channelId: POCKETWISE_NOTIFICATION_CHANNEL_ID,
        }),
      })
    );
    expect(scheduled).toBe(1);
  });

  it('reveals amounts in notification when hideAmountsInNotifications is false', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
    });

    const futureDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const recurring: RecurringPayment[] = [
      {
        id: 'rec-1',
        title: 'Netflix',
        amount: 649,
        categoryId: 'cat-sub',
        categoryName: 'Subscriptions',
        categoryIcon: 'film',
        categoryColor: '#E50914',
        accountId: 'acc-1',
        accountName: 'Card',
        frequency: 'monthly',
        nextDueDate: futureDue,
        isActive: true,
        reminderDaysBefore: 1,
        createdAt: new Date().toISOString(),
      },
    ];

    await NotificationService.syncSystemNotifications(
      { ...defaultSettings, hideAmountsInNotifications: false },
      [],
      [],
      recurring,
      [],
      '₹'
    );

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: expect.stringContaining('₹649'),
        }),
      })
    );
  });

  it('schedules budget exceeded notifications when spent >= limit', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
      granted: true,
    });

    const now = new Date().toISOString();
    const budget: Budget = {
      id: 'bgt-food',
      name: 'Food & Dining',
      amount: 5000,
      period: 'monthly',
      categoryId: 'cat-food',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    };

    const tx: Transaction = {
      id: 'tx-1',
      title: 'Dinner Banquet',
      amount: 6000,
      type: 'expense',
      categoryId: 'cat-food',
      categoryName: 'Food & Dining',
      categoryIcon: 'coffee',
      categoryColor: '#FF5722',
      date: now,
      accountId: 'acc-1',
      accountName: 'Bank',
      paymentMethod: 'UPI',
      createdAt: now,
    };

    const count = await NotificationService.syncSystemNotifications(
      defaultSettings,
      [budget],
      [tx],
      [],
      [],
      '₹'
    );

    expect(count).toBe(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: expect.stringContaining('Budget Exceeded: Food & Dining'),
        }),
        trigger: expect.objectContaining({
          channelId: POCKETWISE_NOTIFICATION_CHANNEL_ID,
        }),
      })
    );
  });
});
