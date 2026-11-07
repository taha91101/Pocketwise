import { Account, CashFlowForecast, RecurringPayment, Transaction } from '../types';

export class ForecastService {
  /**
   * Calculates comprehensive cash-flow forecast for the current month.
   */
  public static calculateMonthEndForecast(
    accounts: Account[],
    transactions: Transaction[],
    recurringPayments: RecurringPayment[],
    currentDate: Date = new Date(),
    lowBalanceThreshold: number = 2000
  ): CashFlowForecast {
    // 1. Calculate liquid balance (banks, cash, wallets)
    const liquidBalance = accounts
      .filter((a) => a.type === 'bank' || a.type === 'wallet' || a.type === 'cash')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    // 2. Calendar metrics for current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    const dayOfMonth = currentDate.getDate();

    // Days in current month
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const daysRemaining = Math.max(0, totalDaysInMonth - dayOfMonth);

    const monthStartIso = new Date(year, month, 1).toISOString().split('T')[0];
    const monthEndIso = new Date(year, month, totalDaysInMonth).toISOString().split('T')[0];
    const todayIso = currentDate.toISOString().split('T')[0];

    // 3. Upcoming committed recurring expenses & income between today and month-end
    const upcomingRecurring = recurringPayments.filter((r) => {
      if (!r.isActive) return false;
      const due = r.nextDueDate ? r.nextDueDate.split('T')[0] : '';
      return due >= todayIso && due <= monthEndIso;
    });

    const upcomingCommittedExpenses = upcomingRecurring
      .filter((r) => r.type !== 'income')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const upcomingCommittedIncome = upcomingRecurring
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // 4. Expected remaining income in current month (salary / regular income due before month-end)
    const expectedIncome = upcomingCommittedIncome;

    // 5. Average daily discretionary spend (last 30 days of expenses, excluding recurring)
    const thirtyDaysAgoMs = currentDate.getTime() - 30 * 24 * 60 * 60 * 1000;
    const pastExpenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const tTime = new Date(t.date).getTime();
      return tTime >= thirtyDaysAgoMs && tTime <= currentDate.getTime();
    });

    let averageDailyDiscretionarySpend = 0;
    if (pastExpenses.length > 0) {
      const totalPastExpense = pastExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const earliestTxTime = Math.min(...pastExpenses.map((t) => new Date(t.date).getTime()));
      const daysSpan = Math.max(
        1,
        Math.min(30, Math.ceil((currentDate.getTime() - earliestTxTime) / (24 * 60 * 60 * 1000)))
      );
      averageDailyDiscretionarySpend = Math.round((totalPastExpense / daysSpan) * 100) / 100;
    } else {
      // Fallback: estimate from current month expenses
      const currentMonthExpenses = transactions.filter((t) => {
        if (t.type !== 'expense') return false;
        const dStr = t.date ? t.date.split('T')[0] : '';
        return dStr >= monthStartIso && dStr <= todayIso;
      });
      const currTotal = currentMonthExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      averageDailyDiscretionarySpend =
        dayOfMonth > 0 ? Math.round((currTotal / dayOfMonth) * 100) / 100 : 0;
    }

    // 6. Projected month-end balance
    const projectedDiscretionaryRemaining = averageDailyDiscretionarySpend * daysRemaining;
    const projectedMonthEndBalance = Math.round(
      (liquidBalance + expectedIncome - upcomingCommittedExpenses - projectedDiscretionaryRemaining) *
        100
    ) / 100;

    // 7. Safe-to-spend today
    // Amount user can spend today without dipping below buffer by month-end
    const uncommittedLiquid =
      liquidBalance + expectedIncome - upcomingCommittedExpenses - lowBalanceThreshold;
    const safeToSpendToday =
      daysRemaining > 0
        ? Math.max(0, Math.round((uncommittedLiquid / (daysRemaining + 1)) * 100) / 100)
        : Math.max(0, Math.round(uncommittedLiquid * 100) / 100);

    // 8. Low balance warning evaluation
    const isLowBalanceWarning =
      projectedMonthEndBalance < lowBalanceThreshold || uncommittedLiquid < 0;

    // 9. Confidence score based on historical data depth
    let confidenceScore = 0.6;
    if (transactions.length >= 60) confidenceScore = 0.95;
    else if (transactions.length >= 30) confidenceScore = 0.85;
    else if (transactions.length >= 10) confidenceScore = 0.75;

    return {
      projectedMonthEndBalance,
      safeToSpendToday,
      upcomingCommittedExpenses,
      expectedRemainingIncome: expectedIncome,
      averageDailyDiscretionarySpend,
      daysRemainingInMonth: daysRemaining,
      isLowBalanceWarning,
      lowBalanceThreshold,
      confidenceScore,
    };
  }
}
