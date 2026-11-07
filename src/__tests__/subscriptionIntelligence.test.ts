import { SubscriptionService } from '../services/subscriptionService';
import { RecurringPayment, Transaction } from '../types';

describe('SubscriptionService (Recurring Intelligence F3.3)', () => {
  const referenceDate = new Date(2026, 5, 15, 12, 0, 0); // June 15, 2026

  describe('calculateYearlyRollup', () => {
    const mockRecurring: RecurringPayment[] = [
      {
        id: 'r-1',
        title: 'Netflix',
        amount: 649,
        type: 'expense',
        frequency: 'monthly',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        accountId: 'acc-1',
        accountName: 'HDFC',
        nextDueDate: '2026-06-20',
        isActive: true,
        reminderDaysBefore: 1,
        createdAt: '2026-01-01',
      },
      {
        id: 'r-2',
        title: 'Gym Membership',
        amount: 1500,
        type: 'expense',
        frequency: 'monthly',
        categoryId: 'health',
        categoryName: 'Health & Fitness',
        accountId: 'acc-1',
        accountName: 'HDFC',
        nextDueDate: '2026-06-25',
        isActive: true,
        reminderDaysBefore: 2,
        createdAt: '2026-01-01',
      },
      {
        id: 'r-3',
        title: 'Amazon Prime',
        amount: 1499,
        type: 'expense',
        frequency: 'yearly',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        accountId: 'acc-1',
        accountName: 'HDFC',
        nextDueDate: '2026-10-10',
        isActive: true,
        reminderDaysBefore: 5,
        createdAt: '2026-01-01',
      },
      {
        id: 'r-4',
        title: 'Inactive Gym',
        amount: 5000,
        type: 'expense',
        frequency: 'monthly',
        categoryId: 'health',
        categoryName: 'Health',
        accountId: 'acc-1',
        accountName: 'HDFC',
        nextDueDate: '2026-01-01',
        isActive: false, // Inactive!
        reminderDaysBefore: 1,
        createdAt: '2026-01-01',
      },
    ];

    it('calculates total annual cost and category breakdown', () => {
      const rollup = SubscriptionService.calculateYearlyRollup(mockRecurring);

      // r-1: 649 * 12 = 7,788
      // r-2: 1500 * 12 = 18,000
      // r-3: 1499 * 1 = 1,499
      // Total: 7,788 + 18,000 + 1,499 = 27,287
      expect(rollup.totalAnnualCost).toBe(27287);
      expect(rollup.totalMonthlyEquivalent).toBe(Math.round(27287 / 12));
      expect(rollup.count).toBe(3);

      // Entertainment: 7788 + 1499 = 9287
      const ent = rollup.byCategory.find((c) => c.categoryName === 'Entertainment');
      expect(ent?.annualAmount).toBe(9287);
    });
  });

  describe('detectSubscriptionCandidates', () => {
    const existingRecurring: RecurringPayment[] = [
      {
        id: 'r-1',
        title: 'Netflix',
        amount: 649,
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        accountId: 'acc-1',
        accountName: 'HDFC',
        frequency: 'monthly',
        nextDueDate: '2026-06-20',
        isActive: true,
        reminderDaysBefore: 1,
        createdAt: '2026-01-01',
      },
    ];

    const transactions: Transaction[] = [
      // 3 transactions of Spotify for ₹119 ~30 days apart
      {
        id: 'tx-s1',
        title: 'Spotify India',
        merchant: 'Spotify',
        amount: 119,
        type: 'expense',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        categoryIcon: 'music',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'card',
        date: new Date(2026, 3, 15).toISOString(),
        createdAt: new Date(2026, 3, 15).toISOString(),
      },
      {
        id: 'tx-s2',
        title: 'Spotify India',
        merchant: 'Spotify',
        amount: 119,
        type: 'expense',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        categoryIcon: 'music',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'card',
        date: new Date(2026, 4, 15).toISOString(),
        createdAt: new Date(2026, 4, 15).toISOString(),
      },
      {
        id: 'tx-s3',
        title: 'Spotify India',
        merchant: 'Spotify',
        amount: 119,
        type: 'expense',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        categoryIcon: 'music',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'card',
        date: new Date(2026, 5, 14).toISOString(),
        createdAt: new Date(2026, 5, 14).toISOString(),
      },
      // Netflix transactions (should be ignored because Netflix is in existingRecurring)
      {
        id: 'tx-n1',
        title: 'Netflix',
        amount: 649,
        type: 'expense',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        categoryIcon: 'film',
        categoryColor: '#EF4444',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'card',
        date: new Date(2026, 4, 20).toISOString(),
        createdAt: new Date(2026, 4, 20).toISOString(),
      },
    ];

    it('auto-detects Spotify subscription with monthly frequency and amount', () => {
      const candidates = SubscriptionService.detectSubscriptionCandidates(
        transactions,
        existingRecurring,
        referenceDate
      );

      expect(candidates.length).toBe(1);
      expect(candidates[0].merchant).toBe('Spotify');
      expect(candidates[0].amount).toBe(119);
      expect(candidates[0].frequency).toBe('monthly');
      expect(candidates[0].occurrences).toBe(3);
    });
  });

  describe('detectPriceIncreases', () => {
    const recurring: RecurringPayment[] = [
      {
        id: 'rec-hotstar',
        title: 'Disney+ Hotstar',
        amount: 899,
        previousAmount: 899,
        type: 'expense',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        accountId: 'acc-1',
        accountName: 'HDFC',
        frequency: 'yearly',
        nextDueDate: '2026-07-01',
        isActive: true,
        reminderDaysBefore: 3,
        createdAt: '2025-06-01',
      },
    ];

    const recentTransactions: Transaction[] = [
      {
        id: 'tx-hotstar-new',
        title: 'Disney+ Hotstar renewal',
        amount: 1499, // price increased from 899 to 1499
        type: 'expense',
        categoryId: 'entertainment',
        categoryName: 'Entertainment',
        categoryIcon: 'film',
        categoryColor: '#3B82F6',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'card',
        date: new Date(2026, 5, 10).toISOString(),
        createdAt: new Date(2026, 5, 10).toISOString(),
      },
    ];

    it('flags price increase when recent payment is higher', () => {
      const alerts = SubscriptionService.detectPriceIncreases(recurring, recentTransactions);

      expect(alerts.length).toBe(1);
      expect(alerts[0].title).toBe('Disney+ Hotstar');
      expect(alerts[0].oldAmount).toBe(899);
      expect(alerts[0].newAmount).toBe(1499);
      expect(alerts[0].difference).toBe(600);
      expect(alerts[0].percentageIncrease).toBe(67);
    });
  });

  describe('detectDuplicateSubscriptions', () => {
    const recurringWithOverlap: RecurringPayment[] = [
      {
        id: 'r-1',
        title: 'Netflix Premium',
        amount: 649,
        type: 'expense',
        frequency: 'monthly',
        categoryId: 'cat-streaming',
        categoryName: 'Entertainment',
        accountId: 'acc-1',
        accountName: 'HDFC',
        nextDueDate: '2026-06-20',
        isActive: true,
        reminderDaysBefore: 1,
        createdAt: '2026-01-01',
      },
      {
        id: 'r-2',
        title: 'Disney+ Hotstar Super',
        amount: 299,
        type: 'expense',
        frequency: 'monthly',
        categoryId: 'cat-streaming',
        categoryName: 'Entertainment',
        accountId: 'acc-1',
        accountName: 'HDFC',
        nextDueDate: '2026-06-25',
        isActive: true,
        reminderDaysBefore: 1,
        createdAt: '2026-01-01',
      },
      {
        id: 'r-3',
        title: 'Amazon Prime Video',
        amount: 179,
        type: 'expense',
        frequency: 'monthly',
        categoryId: 'cat-streaming',
        categoryName: 'Entertainment',
        accountId: 'acc-1',
        accountName: 'HDFC',
        nextDueDate: '2026-06-28',
        isActive: true,
        reminderDaysBefore: 1,
        createdAt: '2026-01-01',
      },
    ];

    it('warns about multiple overlapping streaming subscriptions', () => {
      const duplicates = SubscriptionService.detectDuplicateSubscriptions(recurringWithOverlap);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].items.length).toBe(3);
      expect(duplicates[0].totalMonthlyCost).toBe(1127); // 649 + 299 + 179
      expect(duplicates[0].warning).toContain('3 active subscriptions');
    });
  });
});

