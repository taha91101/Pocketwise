import {
  Account,
  Budget,
  Category,
  RecurringPayment,
  SavingsGoal,
  Transaction,
} from '../types';

export type IntegrityIssueType =
  | 'ORPHAN_TRANSACTION_CATEGORY'
  | 'ORPHAN_TRANSACTION_ACCOUNT'
  | 'ORPHAN_BUDGET_CATEGORY'
  | 'ORPHAN_RECURRING_ACCOUNT'
  | 'ORPHAN_RECURRING_CATEGORY'
  | 'BROKEN_GOAL_LINK'
  | 'BALANCE_MISMATCH';

export interface IntegrityIssue {
  id: string;
  type: IntegrityIssueType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  entityId: string;
  suggestedAction: string;
}

export interface IntegrityAuditReport {
  isHealthy: boolean;
  issuesCount: number;
  issues: IntegrityIssue[];
  auditedAt: string;
  summary: {
    totalTransactions: number;
    totalAccounts: number;
    totalBudgets: number;
    totalRecurring: number;
    orphanedCount: number;
  };
}

export class DataIntegrityService {
  /**
   * Performs comprehensive audit across all accounts, transactions, budgets, goals, and categories
   */
  public static auditDataIntegrity(
    accounts: Account[],
    transactions: Transaction[],
    budgets: Budget[],
    goals: SavingsGoal[],
    recurring: RecurringPayment[],
    categories: Category[]
  ): IntegrityAuditReport {
    const issues: IntegrityIssue[] = [];

    const categoryIdSet = new Set(categories.map((c) => c.id));
    const accountIdSet = new Set(accounts.map((a) => a.id));
    const goalIdSet = new Set(goals.map((g) => g.id));

    // 1. Audit transactions for orphaned category or account
    for (const tx of transactions) {
      if (!categoryIdSet.has(tx.categoryId)) {
        issues.push({
          id: `issue-tx-cat-${tx.id}`,
          type: 'ORPHAN_TRANSACTION_CATEGORY',
          severity: 'medium',
          title: `Orphaned Category in "${tx.title}"`,
          description: `Transaction references category ID "${tx.categoryId}" which does not exist in your category list.`,
          entityId: tx.id,
          suggestedAction: 'Reassign to fallback category or restore category',
        });
      }

      if (!accountIdSet.has(tx.accountId)) {
        issues.push({
          id: `issue-tx-acc-${tx.id}`,
          type: 'ORPHAN_TRANSACTION_ACCOUNT',
          severity: 'high',
          title: `Orphaned Account in "${tx.title}"`,
          description: `Transaction references account ID "${tx.accountId}" which does not exist in your accounts list.`,
          entityId: tx.id,
          suggestedAction: 'Reassign to primary active account',
        });
      }

      if (tx.goalId && !goalIdSet.has(tx.goalId)) {
        issues.push({
          id: `issue-tx-goal-${tx.id}`,
          type: 'BROKEN_GOAL_LINK',
          severity: 'low',
          title: `Broken Goal Link in "${tx.title}"`,
          description: `Savings transaction references goal ID "${tx.goalId}" which was deleted or not found.`,
          entityId: tx.id,
          suggestedAction: 'Clear goal reference',
        });
      }
    }

    // 2. Audit budgets for orphaned category
    for (const bgt of budgets) {
      if (!categoryIdSet.has(bgt.categoryId)) {
        issues.push({
          id: `issue-bgt-cat-${bgt.id}`,
          type: 'ORPHAN_BUDGET_CATEGORY',
          severity: 'high',
          title: `Orphaned Budget Category in "${bgt.name}"`,
          description: `Budget tracks category "${bgt.categoryId}" which no longer exists.`,
          entityId: bgt.id,
          suggestedAction: 'Reassign budget category or delete budget',
        });
      }
    }

    // 3. Audit recurring payments for orphaned account or category
    for (const rec of recurring) {
      if (!accountIdSet.has(rec.accountId)) {
        issues.push({
          id: `issue-rec-acc-${rec.id}`,
          type: 'ORPHAN_RECURRING_ACCOUNT',
          severity: 'high',
          title: `Orphaned Account in Bill "${rec.title}"`,
          description: `Recurring payment debits account "${rec.accountId}" which is not found.`,
          entityId: rec.id,
          suggestedAction: 'Assign an active payment account',
        });
      }

      if (!categoryIdSet.has(rec.categoryId)) {
        issues.push({
          id: `issue-rec-cat-${rec.id}`,
          type: 'ORPHAN_RECURRING_CATEGORY',
          severity: 'medium',
          title: `Orphaned Category in Bill "${rec.title}"`,
          description: `Recurring bill references non-existent category "${rec.categoryId}".`,
          entityId: rec.id,
          suggestedAction: 'Reassign category',
        });
      }
    }

    return {
      isHealthy: issues.length === 0,
      issuesCount: issues.length,
      issues,
      auditedAt: new Date().toISOString(),
      summary: {
        totalTransactions: transactions.length,
        totalAccounts: accounts.length,
        totalBudgets: budgets.length,
        totalRecurring: recurring.length,
        orphanedCount: issues.length,
      },
    };
  }

  /**
   * Reconcile an account balance with real-world bank/statement balance
   * Generates a balance adjustment transaction and updates the account balance cleanly.
   */
  public static reconcileAccount(
    account: Account,
    actualBalance: number,
    notes?: string
  ): {
    updatedAccount: Account;
    adjustmentTx: Omit<Transaction, 'id' | 'createdAt'> | null;
    difference: number;
  } {
    const currentBalance = Number(account.balance) || 0;
    const difference = Math.round((actualBalance - currentBalance) * 100) / 100;

    if (difference === 0) {
      return {
        updatedAccount: account,
        adjustmentTx: null,
        difference: 0,
      };
    }

    const isCredit = difference > 0;
    const absDiff = Math.abs(difference);

    const adjustmentTx: Omit<Transaction, 'id' | 'createdAt'> = {
      title: `Balance Reconciliation (${isCredit ? 'Credit' : 'Debit'})`,
      amount: absDiff,
      type: isCredit ? 'income' : 'expense',
      categoryId: 'cat-adjustment',
      categoryName: 'Account Adjustment',
      categoryIcon: 'sliders',
      categoryColor: '#6366F1',
      accountId: account.id,
      accountName: account.name,
      paymentMethod: 'Adjustment',
      date: new Date().toISOString(),
      notes: notes || `Reconciled from ${currentBalance} to ${actualBalance}`,
    };

    const updatedAccount: Account = {
      ...account,
      balance: actualBalance,
    };

    return {
      updatedAccount,
      adjustmentTx,
      difference,
    };
  }

  /**
   * Repair orphaned transaction categories by mapping them to a designated fallback category
   */
  public static repairOrphanedCategories(
    transactions: Transaction[],
    validCategoryIds: Set<string>,
    fallbackCategory: Category
  ): Transaction[] {
    return transactions.map((tx) => {
      if (!validCategoryIds.has(tx.categoryId)) {
        return {
          ...tx,
          categoryId: fallbackCategory.id,
          categoryName: fallbackCategory.name,
          categoryIcon: fallbackCategory.icon,
          categoryColor: fallbackCategory.color,
        };
      }
      return tx;
    });
  }

  /**
   * Repair orphaned transaction accounts by mapping them to a fallback account
   */
  public static repairOrphanedAccounts(
    transactions: Transaction[],
    validAccountIds: Set<string>,
    fallbackAccount: Account
  ): Transaction[] {
    return transactions.map((tx) => {
      if (!validAccountIds.has(tx.accountId)) {
        return {
          ...tx,
          accountId: fallbackAccount.id,
          accountName: fallbackAccount.name,
        };
      }
      return tx;
    });
  }
}

