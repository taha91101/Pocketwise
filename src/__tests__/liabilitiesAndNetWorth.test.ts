import { useAppStore } from '../store/useAppStore';
import { StorageService } from '../storage/storageService';

jest.mock('../storage/storageService', () => ({
  StorageService: {
    getItem: jest.fn().mockImplementation((key, fallback) => Promise.resolve(fallback)),
    setItem: jest.fn().mockResolvedValue(true),
    removeItem: jest.fn().mockResolvedValue(true),
    clearAll: jest.fn().mockResolvedValue(true),
  },
}));

describe('Liabilities and Net Worth Management (F3.5)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await useAppStore.getState().resetToDefaults();
  });

  it('adds a new liability and updates net worth', async () => {
    const initialOverview = useAppStore.getState().overview;
    const initialNetWorth = initialOverview.netWorth || 0;

    const liability = await useAppStore.getState().addLiability({
      name: 'HDFC Regalia Credit Card',
      type: 'credit_card',
      totalAmount: 50000,
      remainingAmount: 25000,
      minimumMonthlyPayment: 2500,
      dueDate: '2026-06-25',
      statementDate: '2026-06-05',
      creditLimit: 150000,
    });

    expect(liability.id).toBeDefined();
    expect(liability.isPaidOff).toBe(false);

    const state = useAppStore.getState();
    expect(state.liabilities.length).toBe(1);
    expect(state.overview.totalLiabilities).toBe(25000);
    // Net worth should decrease by 25,000
    expect(state.overview.netWorth).toBe(initialNetWorth - 25000);
  });

  it('records liability payment and deducts from bank account', async () => {
    const bankAccount = await useAppStore.getState().addAccount({
      name: 'Salary Account',
      type: 'bank',
      balance: 100000,
      icon: 'bank',
      color: '#10B981',
    });

    const liability = await useAppStore.getState().addLiability({
      name: 'Personal Loan',
      type: 'loan',
      totalAmount: 50000,
      remainingAmount: 20000,
      minimumMonthlyPayment: 5000,
      dueDate: '2026-06-20',
    });

    // Make payment of 10,000 from Salary Account
    const success = await useAppStore
      .getState()
      .recordLiabilityPayment(liability.id, 10000, bankAccount.id);

    expect(success).toBe(true);

    const state = useAppStore.getState();
    const updatedLiability = state.liabilities.find((l) => l.id === liability.id);
    expect(updatedLiability?.remainingAmount).toBe(10000);
    expect(updatedLiability?.isPaidOff).toBe(false);

    // Bank balance should be deducted: 100,000 - 10,000 = 90,000
    const updatedAcc = state.accounts.find((a) => a.id === bankAccount.id);
    expect(updatedAcc?.balance).toBe(90000);

    // Payment transaction should be logged
    const paymentTx = state.transactions.find((t) => t.title.includes('Personal Loan'));
    expect(paymentTx).toBeDefined();
    expect(paymentTx?.amount).toBe(10000);
  });

  it('marks liability as paid off when remaining balance reaches zero', async () => {
    const liability = await useAppStore.getState().addLiability({
      name: 'Laptop EMI',
      type: 'emi',
      totalAmount: 30000,
      remainingAmount: 5000,
      minimumMonthlyPayment: 5000,
      dueDate: '2026-06-15',
    });

    await useAppStore.getState().recordLiabilityPayment(liability.id, 5000);

    const state = useAppStore.getState();
    const updated = state.liabilities.find((l) => l.id === liability.id);
    expect(updated?.remainingAmount).toBe(0);
    expect(updated?.isPaidOff).toBe(true);
    // Since paid off, total liabilities should be 0
    expect(state.overview.totalLiabilities).toBe(0);
  });

  it('deletes liability and recalculates net worth', async () => {
    const liability = await useAppStore.getState().addLiability({
      name: 'Old Loan',
      type: 'loan',
      totalAmount: 10000,
      remainingAmount: 10000,
      minimumMonthlyPayment: 1000,
      dueDate: '2026-06-15',
    });

    expect(useAppStore.getState().liabilities.length).toBe(1);

    await useAppStore.getState().deleteLiability(liability.id);

    expect(useAppStore.getState().liabilities.length).toBe(0);
    expect(useAppStore.getState().overview.totalLiabilities).toBe(0);
  });
});

