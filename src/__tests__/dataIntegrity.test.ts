import { DataIntegrityService } from '../services/dataIntegrityService';
import { Account, Budget, Category, RecurringPayment, SavingsGoal, Transaction } from '../types';

describe('DataIntegrityService (F4.4 Data Integrity & Reconciliation)', () => {
  const mockCategories: Category[] = [
    { id: 'cat-groceries', name: 'Groceries', icon: 'cart', color: '#10B981', type: 'expense' },
    { id: 'cat-bills', name: 'Bills', icon: 'zap', color: '#EF4444', type: 'expense' },
  ];

  const mockAccounts: Account[] = [
    { id: 'acc-hdfc', name: 'HDFC Bank', type: 'bank', balance: 50000, icon: 'bank', color: '#10B981' },
  ];

  const mockGoals: SavingsGoal[] = [
    {
      id: 'goal-emergency',
      name: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 20000,
      targetDate: '2027-01-01',
      monthlyContribution: 5000,
      color: '#10B981',
      icon: 'shield',
      createdAt: '2026-01-01',
    },
  ];

  describe('auditDataIntegrity', () => {
    it('reports clean health when all references exist', () => {
      const validTx: Transaction[] = [
        {
          id: 'tx-1',
          title: 'Grocery Run',
          amount: 1200,
          type: 'expense',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          categoryIcon: 'cart',
          categoryColor: '#10B981',
          accountId: 'acc-hdfc',
          accountName: 'HDFC Bank',
          paymentMethod: 'UPI',
          date: '2026-11-01',
          createdAt: '2026-11-01T10:00:00Z',
        },
      ];

      const report = DataIntegrityService.auditDataIntegrity(
        mockAccounts,
        validTx,
        [],
        mockGoals,
        [],
        mockCategories
      );

      expect(report.isHealthy).toBe(true);
      expect(report.issuesCount).toBe(0);
    });

    it('detects orphaned categories and orphaned accounts in transactions', () => {
      const badTx: Transaction[] = [
        {
          id: 'tx-orphan-cat',
          title: 'Unknown Merchant',
          amount: 500,
          type: 'expense',
          categoryId: 'cat-deleted-id',
          categoryName: 'Deleted Category',
          categoryIcon: 'tag',
          categoryColor: '#999999',
          accountId: 'acc-hdfc',
          accountName: 'HDFC Bank',
          paymentMethod: 'UPI',
          date: '2026-11-01',
          createdAt: '2026-11-01T10:00:00Z',
        },
        {
          id: 'tx-orphan-acc',
          title: 'Old Card Transaction',
          amount: 800,
          type: 'expense',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          categoryIcon: 'cart',
          categoryColor: '#10B981',
          accountId: 'acc-deleted-card',
          accountName: 'Closed Card',
          paymentMethod: 'Card',
          date: '2026-11-01',
          createdAt: '2026-11-01T10:00:00Z',
        },
      ];

      const report = DataIntegrityService.auditDataIntegrity(
        mockAccounts,
        badTx,
        [],
        [],
        [],
        mockCategories
      );

      expect(report.isHealthy).toBe(false);
      expect(report.issuesCount).toBe(2);

      const catIssue = report.issues.find((i) => i.type === 'ORPHAN_TRANSACTION_CATEGORY');
      expect(catIssue).toBeDefined();

      const accIssue = report.issues.find((i) => i.type === 'ORPHAN_TRANSACTION_ACCOUNT');
      expect(accIssue).toBeDefined();
    });

    it('detects orphaned categories in budgets and orphaned accounts in recurring bills', () => {
      const badBudgets: Budget[] = [
        {
          id: 'b-1',
          name: 'Old Category Budget',
          amount: 5000,
          categoryId: 'cat-nonexistent',
          period: 'monthly',
          startDate: '2026-11-01',
          endDate: '2026-11-30',
        },
      ];

      const badRecurring: RecurringPayment[] = [
        {
          id: 'r-1',
          title: 'Gym',
          amount: 1500,
          categoryId: 'cat-bills',
          categoryName: 'Bills',
          accountId: 'acc-nonexistent',
          accountName: 'Ghost Account',
          frequency: 'monthly',
          nextDueDate: '2026-11-20',
          isActive: true,
          reminderDaysBefore: 1,
          createdAt: '2026-01-01',
        },
      ];

      const report = DataIntegrityService.auditDataIntegrity(
        mockAccounts,
        [],
        badBudgets,
        [],
        badRecurring,
        mockCategories
      );

      expect(report.issuesCount).toBe(2);
      expect(report.issues.some((i) => i.type === 'ORPHAN_BUDGET_CATEGORY')).toBe(true);
      expect(report.issues.some((i) => i.type === 'ORPHAN_RECURRING_ACCOUNT')).toBe(true);
    });
  });

  describe('reconcileAccount', () => {
    it('creates credit adjustment when actual balance is higher than app balance', () => {
      const acc = mockAccounts[0]; // balance: 50,000
      // Real statement says 52,500 (+2,500 discrepancy)
      const res = DataIntegrityService.reconcileAccount(acc, 52500, 'Bank statement match');

      expect(res.difference).toBe(2500);
      expect(res.updatedAccount.balance).toBe(52500);
      expect(res.adjustmentTx).toBeDefined();
      expect(res.adjustmentTx?.type).toBe('income');
      expect(res.adjustmentTx?.amount).toBe(2500);
      expect(res.adjustmentTx?.title).toContain('Credit');
    });

    it('creates debit adjustment when actual balance is lower than app balance', () => {
      const acc = mockAccounts[0]; // balance: 50,000
      // Real statement says 48,000 (-2,000 discrepancy)
      const res = DataIntegrityService.reconcileAccount(acc, 48000, 'Bank statement match');

      expect(res.difference).toBe(-2000);
      expect(res.updatedAccount.balance).toBe(48000);
      expect(res.adjustmentTx).toBeDefined();
      expect(res.adjustmentTx?.type).toBe('expense');
      expect(res.adjustmentTx?.amount).toBe(2000);
      expect(res.adjustmentTx?.title).toContain('Debit');
    });

    it('returns null adjustment when balances already match', () => {
      const acc = mockAccounts[0];
      const res = DataIntegrityService.reconcileAccount(acc, 50000);

      expect(res.difference).toBe(0);
      expect(res.adjustmentTx).toBeNull();
    });
  });

  describe('repair utilities', () => {
    it('repairs orphaned categories by remapping to fallback category', () => {
      const txs: Transaction[] = [
        {
          id: 'tx-1',
          title: 'Unknown',
          amount: 500,
          type: 'expense',
          categoryId: 'invalid-cat-id',
          categoryName: 'Unknown',
          categoryIcon: 'tag',
          categoryColor: '#999999',
          accountId: 'acc-hdfc',
          accountName: 'HDFC',
          paymentMethod: 'UPI',
          date: '2026-11-01',
          createdAt: '2026-11-01',
        },
      ];

      const validSet = new Set(['cat-groceries']);
      const fallbackCat = mockCategories[0]; // cat-groceries

      const repaired = DataIntegrityService.repairOrphanedCategories(txs, validSet, fallbackCat);

      expect(repaired[0].categoryId).toBe('cat-groceries');
      expect(repaired[0].categoryName).toBe('Groceries');
    });
  });
});
