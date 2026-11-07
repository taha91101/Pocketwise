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

describe('Shared Expenses Management (F3.6)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await useAppStore.getState().resetToDefaults();
  });

  it('records a new shared expense (you lent)', async () => {
    const expense = await useAppStore.getState().addSharedExpense({
      friendName: 'Rahul Sharma',
      amount: 1250,
      type: 'you_lent',
      notes: 'Dinner at Social split 50/50',
    });

    expect(expense.id).toBeDefined();
    expect(expense.friendName).toBe('Rahul Sharma');
    expect(expense.amount).toBe(1250);
    expect(expense.type).toBe('you_lent');
    expect(expense.isSettled).toBe(false);

    const state = useAppStore.getState();
    expect(state.sharedExpenses.length).toBe(1);
    expect(state.sharedExpenses[0].friendName).toBe('Rahul Sharma');
  });

  it('settles a shared expense successfully', async () => {
    const expense = await useAppStore.getState().addSharedExpense({
      friendName: 'Priya Patel',
      amount: 800,
      type: 'you_borrowed',
      notes: 'Concert ticket advance',
    });

    expect(expense.isSettled).toBe(false);

    const settled = await useAppStore.getState().settleSharedExpense(expense.id);
    expect(settled).toBe(true);

    const updated = useAppStore.getState().sharedExpenses.find((s) => s.id === expense.id);
    expect(updated?.isSettled).toBe(true);
    expect(updated?.settledAt).toBeDefined();
  });

  it('deletes a shared expense record', async () => {
    const expense = await useAppStore.getState().addSharedExpense({
      friendName: 'Amit Verma',
      amount: 450,
      type: 'you_lent',
    });

    expect(useAppStore.getState().sharedExpenses.length).toBe(1);

    await useAppStore.getState().deleteSharedExpense(expense.id);

    expect(useAppStore.getState().sharedExpenses.length).toBe(0);
  });
});

