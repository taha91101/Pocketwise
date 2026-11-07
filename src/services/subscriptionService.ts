import { RecurringPayment, Transaction } from '../types';

export interface SubscriptionCandidate {
  id: string;
  title: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  merchant: string;
  occurrences: number;
  lastDate: string;
  suggestedCategoryId: string;
  suggestedCategoryName: string;
}

export interface PriceIncreaseAlert {
  recurringId: string;
  title: string;
  oldAmount: number;
  newAmount: number;
  difference: number;
  percentageIncrease: number;
  detectedDate: string;
}

export interface DuplicateSubscriptionGroup {
  categoryOrDomain: string;
  items: { id: string; title: string; amount: number }[];
  totalMonthlyCost: number;
  warning: string;
}

export interface YearlyCostRollup {
  totalAnnualCost: number;
  totalMonthlyEquivalent: number;
  count: number;
  byCategory: { categoryName: string; annualAmount: number }[];
}

export class SubscriptionService {
  /**
   * Calculates total annualized recurring expense rollup across all active items.
   */
  public static calculateYearlyRollup(recurring: RecurringPayment[]): YearlyCostRollup {
    const active = recurring.filter((r) => r.isActive && r.type !== 'income');
    let totalAnnualCost = 0;
    const categoryMap = new Map<string, number>();

    for (const r of active) {
      let annualAmount = 0;
      switch (r.frequency) {
        case 'daily':
          annualAmount = r.amount * 365;
          break;
        case 'weekly':
          annualAmount = r.amount * 52;
          break;
        case 'monthly':
          annualAmount = r.amount * 12;
          break;
        case 'yearly':
          annualAmount = r.amount * 1;
          break;
        default:
          annualAmount = r.amount * 12;
      }

      totalAnnualCost += annualAmount;
      const catName = r.categoryName || 'Other';
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + annualAmount);
    }

    const byCategory = Array.from(categoryMap.entries())
      .map(([categoryName, annualAmount]) => ({
        categoryName,
        annualAmount: Math.round(annualAmount),
      }))
      .sort((a, b) => b.annualAmount - a.annualAmount);

    return {
      totalAnnualCost: Math.round(totalAnnualCost),
      totalMonthlyEquivalent: Math.round(totalAnnualCost / 12),
      count: active.length,
      byCategory,
    };
  }

  /**
   * Scans past 90 days of expense transactions to detect recurring subscription candidates.
   */
  public static detectSubscriptionCandidates(
    transactions: Transaction[],
    existingRecurring: RecurringPayment[],
    referenceDate: Date = new Date()
  ): SubscriptionCandidate[] {
    const ninetyDaysAgo = referenceDate.getTime() - 90 * 24 * 60 * 60 * 1000;
    const expenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const tTime = new Date(t.date).getTime();
      return tTime >= ninetyDaysAgo && tTime <= referenceDate.getTime();
    });

    // Group transactions by normalized merchant / title
    const groups = new Map<string, Transaction[]>();
    for (const tx of expenses) {
      const key = (tx.merchant || tx.title || '').trim().toLowerCase();
      if (!key || key.length < 3) continue;

      // Skip if already in existing recurring payments
      const alreadyExists = existingRecurring.some((r) => {
        const rTitle = r.title.toLowerCase();
        return rTitle.includes(key) || key.includes(rTitle);
      });
      if (alreadyExists) continue;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(tx);
    }

    const candidates: SubscriptionCandidate[] = [];

    for (const [key, group] of groups.entries()) {
      if (group.length < 2) continue;

      // Sort chronological
      const sorted = [...group].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Check time differences between consecutive transactions
      const intervals: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const diffDays = Math.round(
          (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        intervals.push(diffDays);
      }

      // Check if amounts are consistent (within 10% of each other or identical)
      const amounts = sorted.map((t) => Number(t.amount) || 0);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const isConsistentAmount = amounts.every((a) => Math.abs(a - avgAmount) <= avgAmount * 0.15);

      if (!isConsistentAmount) continue;

      // Check cadence
      const isMonthly = intervals.some((d) => d >= 25 && d <= 35);
      const isWeekly = intervals.some((d) => d >= 6 && d <= 8);

      if (isMonthly || isWeekly) {
        const latest = sorted[sorted.length - 1];
        candidates.push({
          id: `cand-${key.replace(/\s+/g, '-')}`,
          title: latest.merchant || latest.title,
          amount: Math.round(avgAmount),
          frequency: isMonthly ? 'monthly' : 'weekly',
          merchant: latest.merchant || latest.title,
          occurrences: sorted.length,
          lastDate: latest.date,
          suggestedCategoryId: latest.categoryId,
          suggestedCategoryName: latest.categoryName,
        });
      }
    }

    return candidates;
  }

  /**
   * Flags price increases for existing active subscriptions based on recent transactions.
   */
  public static detectPriceIncreases(
    recurring: RecurringPayment[],
    recentTransactions: Transaction[]
  ): PriceIncreaseAlert[] {
    const alerts: PriceIncreaseAlert[] = [];

    for (const rec of recurring) {
      if (!rec.isActive || rec.type === 'income') continue;

      // Find matching recent transactions in the last 45 days
      const matchingTxs = recentTransactions.filter((tx) => {
        if (tx.type !== 'expense') return false;
        const txTitle = (tx.title || '').toLowerCase();
        const txMerchant = (tx.merchant || '').toLowerCase();
        const rTitle = rec.title.toLowerCase();
        return txTitle.includes(rTitle) || txMerchant.includes(rTitle) || rTitle.includes(txTitle);
      });

      if (matchingTxs.length === 0) continue;

      // Find highest recent payment
      const latestTx = matchingTxs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      const baselineAmount = rec.previousAmount || rec.amount;
      if (latestTx.amount > baselineAmount) {
        const difference = Math.round((latestTx.amount - baselineAmount) * 100) / 100;
        const percentageIncrease = Math.round((difference / baselineAmount) * 100);

        if (percentageIncrease >= 5) {
          // Significant price jump >= 5%
          alerts.push({
            recurringId: rec.id,
            title: rec.title,
            oldAmount: baselineAmount,
            newAmount: latestTx.amount,
            difference,
            percentageIncrease,
            detectedDate: latestTx.date,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Identifies potentially redundant/duplicate subscriptions in the same category
   * (e.g. Netflix, Prime Video, Hotstar, SonyLIV).
   */
  public static detectDuplicateSubscriptions(
    recurring: RecurringPayment[]
  ): DuplicateSubscriptionGroup[] {
    const active = recurring.filter((r) => r.isActive && r.type !== 'income');
    const streamingKeywords = [
      'netflix',
      'prime',
      'hotstar',
      'disney',
      'spotify',
      'apple music',
      'youtube',
      'hulu',
      'sony',
      'zee5',
    ];

    // Group by categoryId
    const catGroups = new Map<string, RecurringPayment[]>();
    for (const r of active) {
      const list = catGroups.get(r.categoryId) || [];
      list.push(r);
      catGroups.set(r.categoryId, list);
    }

    const duplicates: DuplicateSubscriptionGroup[] = [];

    for (const [catId, items] of catGroups.entries()) {
      if (items.length >= 2) {
        // Check if multiple items match streaming or entertainment keywords
        const streamingItems = items.filter((item) => {
          const lower = item.title.toLowerCase();
          return streamingKeywords.some((k) => lower.includes(k));
        });

        const targetGroup = streamingItems.length >= 2 ? streamingItems : items;

        if (targetGroup.length >= 2) {
          const totalMonthly = targetGroup.reduce((sum, item) => {
            let m = item.amount;
            if (item.frequency === 'yearly') m = item.amount / 12;
            if (item.frequency === 'weekly') m = item.amount * 4.33;
            return sum + m;
          }, 0);

          duplicates.push({
            categoryOrDomain: targetGroup[0].categoryName || 'Entertainment',
            items: targetGroup.map((i) => ({ id: i.id, title: i.title, amount: i.amount })),
            totalMonthlyCost: Math.round(totalMonthly),
            warning: `You have ${targetGroup.length} active subscriptions in ${targetGroup[0].categoryName}. Consider consolidating to save ₹${Math.round(totalMonthly)}/month.`,
          });
        }
      }
    }

    return duplicates;
  }
}

