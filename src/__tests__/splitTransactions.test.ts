import { useAppStore } from '../store/useAppStore';
import { StorageService } from '../storage/storageService';
import { UPIDetectionService } from '../services/upiDetectionService';
import { DetectedTransaction, TransactionSplit } from '../types';

describe('Split Transactions Engine (F2.6)', () => {
  beforeEach(async () => {
    await StorageService.clearAll();
    useAppStore.setState({
      transactions: [],
      accounts: [
        {
          id: 'acc-1',
          name: 'HDFC Bank',
          type: 'bank',
          balance: 20000,
          accountNumberMasked: '4321',
          color: '#2563EB',
          icon: 'bank',
        },
      ],
      categories: [
        { id: 'cat-groceries', name: 'Groceries', icon: 'shopping-cart', color: '#10B981', type: 'expense', isCustom: false },
        { id: 'cat-food', name: 'Food & Dining', icon: 'food', color: '#F59E0B', type: 'expense', isCustom: false },
        { id: 'cat-home', name: 'Home & Utilities', icon: 'home', color: '#6366F1', type: 'expense', isCustom: false },
      ],
    });
  });

  it('records an expense with multi-category splits and deducts single total from account', async () => {
    const store = useAppStore.getState();
    const initialBalance = store.accounts[0].balance; // 20000

    const splits: TransactionSplit[] = [
      {
        id: 'split-1',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        categoryIcon: 'shopping-cart',
        categoryColor: '#10B981',
        amount: 1500,
        notes: 'Monthly staples',
      },
      {
        id: 'split-2',
        categoryId: 'cat-food',
        categoryName: 'Food & Dining',
        categoryIcon: 'food',
        categoryColor: '#F59E0B',
        amount: 500,
        notes: 'Snacks & beverages',
      },
    ];

    const tx = await store.addTransaction({
      title: 'DMart Superstore',
      amount: 2000,
      type: 'expense',
      categoryId: 'cat-groceries',
      categoryName: 'Groceries',
      categoryIcon: 'shopping-cart',
      categoryColor: '#10B981',
      date: new Date().toISOString(),
      accountId: 'acc-1',
      accountName: 'HDFC Bank',
      paymentMethod: 'UPI',
      splits,
    });

    expect(tx.id).toBeDefined();
    expect(tx.splits).toHaveLength(2);
    expect(tx.splits?.[0].amount).toBe(1500);
    expect(tx.splits?.[1].amount).toBe(500);

    // Verify account balance: debited exactly 2000 once
    const updatedAcc = useAppStore.getState().accounts.find((a) => a.id === 'acc-1');
    expect(updatedAcc?.balance).toBe(initialBalance - 2000); // 18000
  });

  it('updates split categories and recalculates properly', async () => {
    const store = useAppStore.getState();

    const tx = await store.addTransaction({
      title: 'Target Retail',
      amount: 1000,
      type: 'expense',
      categoryId: 'cat-groceries',
      categoryName: 'Groceries',
      categoryIcon: 'shopping-cart',
      categoryColor: '#10B981',
      date: new Date().toISOString(),
      accountId: 'acc-1',
      accountName: 'HDFC Bank',
      paymentMethod: 'UPI',
      splits: [
        {
          id: 's-1',
          categoryId: 'cat-groceries',
          categoryName: 'Groceries',
          categoryIcon: 'shopping-cart',
          categoryColor: '#10B981',
          amount: 600,
        },
        {
          id: 's-2',
          categoryId: 'cat-food',
          categoryName: 'Food & Dining',
          categoryIcon: 'food',
          categoryColor: '#F59E0B',
          amount: 400,
        },
      ],
    });

    // Update splits
    const updatedSplits: TransactionSplit[] = [
      {
        id: 's-1',
        categoryId: 'cat-groceries',
        categoryName: 'Groceries',
        categoryIcon: 'shopping-cart',
        categoryColor: '#10B981',
        amount: 800,
      },
      {
        id: 's-3',
        categoryId: 'cat-home',
        categoryName: 'Home & Utilities',
        categoryIcon: 'home',
        categoryColor: '#6366F1',
        amount: 200,
      },
    ];

    await store.updateTransaction(tx.id, { splits: updatedSplits });

    const updatedTx = useAppStore.getState().transactions.find((t) => t.id === tx.id);
    expect(updatedTx?.splits).toHaveLength(2);
    expect(updatedTx?.splits?.[0].amount).toBe(800);
    expect(updatedTx?.splits?.[1].categoryName).toBe('Home & Utilities');
  });

  it('UPIDetectionService helper preserves splits when converting detected transaction', () => {
    const detected: DetectedTransaction = {
      id: 'dt-split-1',
      amount: 3000,
      type: 'expense',
      merchant: 'IKEA India',
      suggestedCategory: 'Shopping',
      suggestedCategoryId: 'cat-shopping',
      paymentMethod: 'UPI',
      paymentProvider: 'PhonePe',
      sourcePackage: 'com.phonepe.app',
      transactionTimestamp: Date.now(),
      createdAt: Date.now(),
      isAutomaticallyDetected: true,
      detectionConfidence: 0.95,
      rawReferenceHash: 'hash-ikea',
      status: 'DETECTED',
      splits: [
        {
          id: 'sp-1',
          categoryId: 'cat-home',
          categoryName: 'Home & Utilities',
          categoryIcon: 'home',
          categoryColor: '#6366F1',
          amount: 2500,
        },
        {
          id: 'sp-2',
          categoryId: 'cat-food',
          categoryName: 'Food & Dining',
          categoryIcon: 'food',
          categoryColor: '#F59E0B',
          amount: 500,
        },
      ],
    };

    const categories = useAppStore.getState().categories;
    const accounts = useAppStore.getState().accounts;

    const input = UPIDetectionService.convertDetectedToTransactionInput(detected, categories, accounts);
    expect(input.splits).toHaveLength(2);
    expect(input.splits?.[0].amount).toBe(2500);
    expect(input.splits?.[1].amount).toBe(500);
  });
});

