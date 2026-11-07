import { useAppStore } from '../store/useAppStore';
import { RecurringPayment, Account, Transaction } from '../types';

describe('Recurring Auto-Post (F1.6)', () => {
  const initialAccounts: Account[] = [
    {
      id: 'acc-test-1',
      name: 'Salary Account',
      type: 'bank',
      balance: 10000,
      color: '#1A73E8',
      icon: 'credit-card',
    },
  ];

  beforeEach(() => {
    useAppStore.setState({
      accounts: initialAccounts,
      transactions: [],
      recurringPayments: [],
      autoRecordedNotice: null,
      isHydrated: true,
    });
  });

  it('automatically posts due recurring payments with autoRecord=true and debits account', async () => {
    const dueYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recurring: RecurringPayment = {
      id: 'rec-sub-1',
      title: 'Broadband Bill',
      amount: 1000,
      categoryId: 'cat-bills',
      categoryName: 'Bills',
      categoryIcon: 'wifi',
      categoryColor: '#4CAF50',
      accountId: 'acc-test-1',
      accountName: 'Salary Account',
      frequency: 'monthly',
      nextDueDate: dueYesterday,
      isActive: true,
      reminderDaysBefore: 2,
      autoRecord: true,
      createdAt: new Date().toISOString(),
    };

    useAppStore.setState({ recurringPayments: [recurring] });

    const postedCount = await useAppStore.getState().autoRecordDueRecurringPayments();
    expect(postedCount).toBe(1);

    const state = useAppStore.getState();
    expect(state.transactions.length).toBe(1);
    expect(state.transactions[0].title).toBe('Broadband Bill');
    expect(state.transactions[0].amount).toBe(1000);
    expect(state.transactions[0].source).toBe('recurring');
    expect(state.transactions[0].paymentMethod).toBe('Auto-Debit');

    // Account balance debited from 10000 -> 9000
    expect(state.accounts[0].balance).toBe(9000);

    // nextDueDate advanced
    expect(new Date(state.recurringPayments[0].nextDueDate).getTime()).toBeGreaterThan(
      new Date(dueYesterday).getTime()
    );

    // Notice is set
    expect(state.autoRecordedNotice).not.toBeNull();
    expect(state.autoRecordedNotice?.count).toBe(1);
  });

  it('skips recurring payments that have autoRecord=false or isActive=false', async () => {
    const dueYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recurringManual: RecurringPayment = {
      id: 'rec-sub-manual',
      title: 'Manual Gym Bill',
      amount: 500,
      categoryId: 'cat-health',
      categoryName: 'Health',
      categoryIcon: 'activity',
      categoryColor: '#E91E63',
      accountId: 'acc-test-1',
      accountName: 'Salary Account',
      frequency: 'monthly',
      nextDueDate: dueYesterday,
      isActive: true,
      reminderDaysBefore: 2,
      autoRecord: false,
      createdAt: new Date().toISOString(),
    };

    useAppStore.setState({ recurringPayments: [recurringManual] });

    const postedCount = await useAppStore.getState().autoRecordDueRecurringPayments();
    expect(postedCount).toBe(0);

    const state = useAppStore.getState();
    expect(state.transactions.length).toBe(0);
    expect(state.accounts[0].balance).toBe(10000);
  });

  it('guards against double posting if a matching transaction already exists', async () => {
    const dueYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const existingTx: Transaction = {
      id: 'tx-existing',
      title: 'Broadband Bill',
      amount: 1000,
      type: 'expense',
      categoryId: 'cat-bills',
      categoryName: 'Bills',
      categoryIcon: 'wifi',
      categoryColor: '#4CAF50',
      date: dueYesterday,
      accountId: 'acc-test-1',
      accountName: 'Salary Account',
      paymentMethod: 'UPI',
      createdAt: new Date().toISOString(),
    };

    const recurring: RecurringPayment = {
      id: 'rec-sub-1',
      title: 'Broadband Bill',
      amount: 1000,
      categoryId: 'cat-bills',
      categoryName: 'Bills',
      categoryIcon: 'wifi',
      categoryColor: '#4CAF50',
      accountId: 'acc-test-1',
      accountName: 'Salary Account',
      frequency: 'monthly',
      nextDueDate: dueYesterday,
      isActive: true,
      reminderDaysBefore: 2,
      autoRecord: true,
      createdAt: new Date().toISOString(),
    };

    useAppStore.setState({
      transactions: [existingTx],
      recurringPayments: [recurring],
    });

    const postedCount = await useAppStore.getState().autoRecordDueRecurringPayments();
    // Guard prevented duplicate post
    expect(postedCount).toBe(0);

    const state = useAppStore.getState();
    expect(state.transactions.length).toBe(1); // Still only 1 transaction
    expect(state.accounts[0].balance).toBe(10000); // Balance not debited twice
    // Next due date was advanced to catch up
    expect(new Date(state.recurringPayments[0].nextDueDate).getTime()).toBeGreaterThan(
      new Date(dueYesterday).getTime()
    );
  });

  it('undoAutoRecordedTransactions rolls back transactions, balances, and nextDueDate', async () => {
    const dueYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recurring: RecurringPayment = {
      id: 'rec-sub-undo',
      title: 'Subscription Undo Test',
      amount: 750,
      categoryId: 'cat-sub',
      categoryName: 'Subscriptions',
      categoryIcon: 'film',
      categoryColor: '#FF5722',
      accountId: 'acc-test-1',
      accountName: 'Salary Account',
      frequency: 'monthly',
      nextDueDate: dueYesterday,
      isActive: true,
      reminderDaysBefore: 2,
      autoRecord: true,
      createdAt: new Date().toISOString(),
    };

    useAppStore.setState({ recurringPayments: [recurring] });

    await useAppStore.getState().autoRecordDueRecurringPayments();
    expect(useAppStore.getState().transactions.length).toBe(1);
    expect(useAppStore.getState().accounts[0].balance).toBe(9250);

    // Call undo
    await useAppStore.getState().undoAutoRecordedTransactions();

    const finalState = useAppStore.getState();
    expect(finalState.transactions.length).toBe(0);
    expect(finalState.accounts[0].balance).toBe(10000);
    expect(finalState.recurringPayments[0].nextDueDate).toBe(dueYesterday);
    expect(finalState.autoRecordedNotice).toBeNull();
  });
});
