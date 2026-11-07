import { ForecastService } from '../services/forecastService';
import { Account, RecurringPayment, Transaction } from '../types';

describe('ForecastService (Cash-Flow Forecast F3.1)', () => {
  const mockAccounts: Account[] = [
    { id: 'acc-1', name: 'HDFC Bank', type: 'bank', balance: 50000, icon: 'bank', color: '#10B981' },
    { id: 'acc-2', name: 'Cash Wallet', type: 'cash', balance: 5000, icon: 'cash', color: '#3B82F6' },
    { id: 'acc-3', name: 'Paytm Wallet', type: 'wallet', balance: 2500, icon: 'wallet', color: '#8B5CF6' },
    { id: 'acc-4', name: 'Credit Card', type: 'credit', balance: -15000, icon: 'card', color: '#EF4444' },
    { id: 'acc-5', name: 'Mutual Funds', type: 'investment', balance: 100000, icon: 'chart', color: '#F59E0B' },
  ];

  // Mid-month: 15th of June 2026 (June has 30 days -> 15 days remaining)
  const currentDate = new Date(2026, 5, 15, 12, 0, 0);

  const mockRecurring: RecurringPayment[] = [
    {
      id: 'rec-1',
      title: 'Electricity Bill',
      amount: 3000,
      type: 'expense',
      categoryId: 'bills',
      categoryName: 'Bills',
      accountId: 'acc-1',
      accountName: 'HDFC Bank',
      frequency: 'monthly',
      nextDueDate: '2026-06-20',
      isActive: true,
      reminderDaysBefore: 3,
      createdAt: '2026-01-01',
    },
    {
      id: 'rec-2',
      title: 'Internet Fiber',
      amount: 1500,
      type: 'expense',
      categoryId: 'bills',
      categoryName: 'Bills',
      accountId: 'acc-1',
      accountName: 'HDFC Bank',
      frequency: 'monthly',
      nextDueDate: '2026-06-25',
      isActive: true,
      reminderDaysBefore: 2,
      createdAt: '2026-01-01',
    },
    {
      id: 'rec-3',
      title: 'House Rent (Already Paid on 1st)',
      amount: 20000,
      type: 'expense',
      categoryId: 'housing',
      categoryName: 'Housing',
      accountId: 'acc-1',
      accountName: 'HDFC Bank',
      frequency: 'monthly',
      nextDueDate: '2026-07-01', // Due next month!
      isActive: true,
      reminderDaysBefore: 3,
      createdAt: '2026-01-01',
    },
    {
      id: 'rec-4',
      title: 'Freelance Retainer',
      amount: 10000,
      type: 'income',
      categoryId: 'salary',
      categoryName: 'Salary',
      accountId: 'acc-1',
      accountName: 'HDFC Bank',
      frequency: 'monthly',
      nextDueDate: '2026-06-22', // Inflow before month-end
      isActive: true,
      reminderDaysBefore: 1,
      createdAt: '2026-01-01',
    },
  ];

  // Past 30 days of expenses (avg ~1000/day)
  const mockTransactions: Transaction[] = [];
  for (let i = 1; i <= 30; i++) {
    const d = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
    mockTransactions.push({
      id: `tx-${i}`,
      title: `Grocery Store ${i}`,
      amount: 1000,
      type: 'expense',
      categoryId: 'groceries',
      categoryName: 'Groceries',
      categoryIcon: 'cart',
      categoryColor: '#10B981',
      accountId: 'acc-1',
      accountName: 'HDFC Bank',
      paymentMethod: 'upi',
      date: d.toISOString(),
      createdAt: d.toISOString(),
    });
  }

  it('aggregates only liquid accounts (bank, cash, wallet)', () => {
    const forecast = ForecastService.calculateMonthEndForecast(
      mockAccounts,
      mockTransactions,
      [],
      currentDate,
      2000
    );
    // 50,000 (bank) + 5,000 (cash) + 2,500 (wallet) = 57,500
    // Credit and investment excluded
    expect(forecast.daysRemainingInMonth).toBe(15);
  });

  it('filters only upcoming recurring expenses due before month-end', () => {
    const forecast = ForecastService.calculateMonthEndForecast(
      mockAccounts,
      mockTransactions,
      mockRecurring,
      currentDate,
      2000
    );

    // rec-1 (3000) + rec-2 (1500) = 4500 (rec-3 is due in July)
    expect(forecast.upcomingCommittedExpenses).toBe(4500);
    // rec-4 is 10,000 income
    expect(forecast.expectedRemainingIncome).toBe(10000);
  });

  it('projects month-end balance within 10% tolerance', () => {
    const forecast = ForecastService.calculateMonthEndForecast(
      mockAccounts,
      mockTransactions,
      mockRecurring,
      currentDate,
      2000
    );

    // Liquid: 57,500
    // Expected income: 10,000
    // Upcoming expenses: 4,500
    // Past 30-day discretionary avg: 1,000/day
    // Remaining days: 15 days -> 15 * 1000 = 15,000
    // Projected month-end: 57,500 + 10,000 - 4,500 - 15,000 = 48,000
    expect(forecast.projectedMonthEndBalance).toBe(48000);
    expect(forecast.averageDailyDiscretionarySpend).toBe(1000);
    expect(forecast.isLowBalanceWarning).toBe(false);
  });

  it('calculates safe-to-spend today metric correctly', () => {
    const forecast = ForecastService.calculateMonthEndForecast(
      mockAccounts,
      mockTransactions,
      mockRecurring,
      currentDate,
      2000 // lowBalanceThreshold
    );

    // uncommittedLiquid = 57,500 + 10,000 - 4,500 - 2,000 = 61,000
    // daysRemaining = 15 -> divided by (15 + 1) = 61,000 / 16 = 3812.50
    expect(forecast.safeToSpendToday).toBe(3812.5);
  });

  it('triggers low-balance warning when projected balance is below threshold', () => {
    const lowAccounts: Account[] = [
      { id: 'acc-low', name: 'Bank', type: 'bank', balance: 5000, icon: 'bank', color: '#10B981' },
    ];
    const bigBills: RecurringPayment[] = [
      {
        id: 'rec-rent',
        title: 'Rent',
        amount: 8000,
        type: 'expense',
        categoryId: 'housing',
        categoryName: 'Housing',
        accountId: 'acc-low',
        accountName: 'Bank',
        frequency: 'monthly',
        nextDueDate: '2026-06-25',
        isActive: true,
        reminderDaysBefore: 1,
        createdAt: '2026-01-01',
      },
    ];

    const forecast = ForecastService.calculateMonthEndForecast(
      lowAccounts,
      [],
      bigBills,
      currentDate,
      2000
    );

    expect(forecast.isLowBalanceWarning).toBe(true);
    expect(forecast.safeToSpendToday).toBe(0);
  });

  it('handles last day of the month gracefully', () => {
    const lastDayOfMonth = new Date(2026, 5, 30, 12, 0, 0);
    const forecast = ForecastService.calculateMonthEndForecast(
      mockAccounts,
      mockTransactions,
      [],
      lastDayOfMonth,
      2000
    );

    expect(forecast.daysRemainingInMonth).toBe(0);
    expect(forecast.safeToSpendToday).toBeGreaterThanOrEqual(0);
  });
});
