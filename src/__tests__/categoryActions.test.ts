import { useAppStore } from '../store/useAppStore';
import { DEMO_ACCOUNTS } from '../constants/initialData';
import { Transaction } from '../types';

const makeTx = (overrides: Partial<Omit<Transaction, 'id' | 'createdAt'>> = {}): Omit<Transaction, 'id' | 'createdAt'> => ({
  title: 'Sample Tx',
  amount: 200,
  type: 'expense',
  categoryId: 'cat-custom-test',
  categoryName: 'Custom Initial',
  categoryIcon: 'tag',
  categoryColor: '#EF4444',
  date: new Date().toISOString(),
  time: '12:00',
  accountId: 'acc-bank-1',
  accountName: 'HDFC Salary Account',
  paymentMethod: 'UPI',
  ...overrides,
});

describe('useAppStore - Custom Category Actions & Reassignment', () => {
  beforeEach(async () => {
    useAppStore.setState({
      accounts: JSON.parse(JSON.stringify(DEMO_ACCOUNTS)),
      transactions: [],
      budgets: [],
      categories: [
        {
          id: 'cat-groceries',
          name: 'Groceries',
          icon: 'shopping-cart',
          color: '#10B981',
          type: 'expense',
          isCustom: false,
        },
        {
          id: 'cat-other',
          name: 'Other',
          icon: 'tag',
          color: '#64748B',
          type: 'both',
          isCustom: false,
        },
      ],
    });
  });

  it('addCategory creates a new custom category with isCustom: true', async () => {
    const state = useAppStore.getState();
    const initialCount = state.categories.length;

    const created = await state.addCategory({
      name: 'Pet Care',
      icon: 'heart',
      color: '#EC4899',
      type: 'expense',
    });

    expect(created.id).toContain('cat-custom-');
    expect(created.isCustom).toBe(true);
    expect(created.name).toBe('Pet Care');

    const updatedCategories = useAppStore.getState().categories;
    expect(updatedCategories.length).toBe(initialCount + 1);
    expect(updatedCategories.find((c) => c.id === created.id)).toBeDefined();
  });

  it('updateCategory modifies category details and cascades changes to existing transactions', async () => {
    const state = useAppStore.getState();

    // 1. Add custom category
    const cat = await state.addCategory({
      name: 'Gaming',
      icon: 'tv',
      color: '#8B5CF6',
      type: 'expense',
    });

    // 2. Add transaction with this category
    const tx = await state.addTransaction(
      makeTx({
        title: 'Steam Game',
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
      })
    );

    // 3. Update category name, icon, and color
    const success = await useAppStore.getState().updateCategory(cat.id, {
      name: 'Video Games & VR',
      icon: 'play',
      color: '#3B82F6',
    });
    expect(success).toBe(true);

    const updatedCat = useAppStore.getState().categories.find((c) => c.id === cat.id);
    expect(updatedCat?.name).toBe('Video Games & VR');
    expect(updatedCat?.icon).toBe('play');
    expect(updatedCat?.color).toBe('#3B82F6');

    // 4. Verify cascade to transaction
    const updatedTx = useAppStore.getState().transactions.find((t) => t.id === tx.id);
    expect(updatedTx?.categoryName).toBe('Video Games & VR');
    expect(updatedTx?.categoryIcon).toBe('play');
    expect(updatedTx?.categoryColor).toBe('#3B82F6');
  });

  it('deleteCategory reassigns existing transactions and budgets to fallback category', async () => {
    const state = useAppStore.getState();

    // 1. Add custom category
    const customCat = await state.addCategory({
      name: 'Temporary Bucket',
      icon: 'package',
      color: '#F59E0B',
      type: 'expense',
    });

    // 2. Add transaction using this custom category
    const tx = await state.addTransaction(
      makeTx({
        title: 'Misc Item',
        categoryId: customCat.id,
        categoryName: customCat.name,
      })
    );

    // 3. Add budget using this custom category
    const budget = await state.addBudget({
      name: 'Temp Budget',
      amount: 1000,
      categoryId: customCat.id,
      period: 'monthly',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });

    // 4. Delete custom category and reassign to 'cat-groceries'
    const success = await useAppStore.getState().deleteCategory(customCat.id, 'cat-groceries');
    expect(success).toBe(true);

    // Category should be deleted
    expect(useAppStore.getState().categories.some((c) => c.id === customCat.id)).toBe(false);

    // Transaction should now point to cat-groceries
    const reassignedTx = useAppStore.getState().transactions.find((t) => t.id === tx.id);
    expect(reassignedTx?.categoryId).toBe('cat-groceries');
    expect(reassignedTx?.categoryName).toBe('Groceries');

    // Budget should now point to cat-groceries
    const reassignedBudget = useAppStore.getState().budgets.find((b) => b.id === budget.id);
    expect(reassignedBudget?.categoryId).toBe('cat-groceries');
  });

  it('deleteCategory fails if fallback category does not exist or is the same category', async () => {
    const state = useAppStore.getState();
    const cat = await state.addCategory({
      name: 'Unique',
      icon: 'star',
      color: '#10B981',
      type: 'both',
    });

    expect(await state.deleteCategory(cat.id, 'non-existent-cat')).toBe(false);
    expect(await state.deleteCategory(cat.id, cat.id)).toBe(false);
  });
});
