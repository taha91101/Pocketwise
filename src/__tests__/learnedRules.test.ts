import { useAppStore } from '../store/useAppStore';
import { StorageService } from '../storage/storageService';
import { STORAGE_KEYS } from '../storage/keys';
import { MerchantCategorizer } from '../services/upiParser';
import { DetectedTransaction } from '../types';

describe('Learned Merchant Rules Engine (F2.2)', () => {
  beforeEach(async () => {
    await StorageService.clearAll();
    useAppStore.setState({
      learnedMerchantRules: [],
      detectedTransactions: [],
      transactions: [],
      accounts: [
        {
          id: 'acc-1',
          name: 'Main Bank',
          type: 'bank',
          balance: 10000,
          accountNumberMasked: '1234',
          color: '#2563EB',
          icon: 'bank',
        },
      ],
      categories: [
        { id: 'cat-food', name: 'Food & Dining', icon: 'food', color: '#F59E0B', type: 'expense', isCustom: false },
        { id: 'cat-office', name: 'Office & Work', icon: 'briefcase', color: '#3B82F6', type: 'expense', isCustom: true },
      ],
    });
  });

  it('adds and persists a new learned rule', async () => {
    const store = useAppStore.getState();
    const rule = await store.addLearnedRule('Blue Tokai Coffee', 'cat-office', 'Office & Work', 'briefcase', '#3B82F6');

    expect(rule.merchantPattern).toBe('Blue Tokai Coffee');
    expect(rule.categoryId).toBe('cat-office');
    expect(rule.categoryName).toBe('Office & Work');

    const inStore = useAppStore.getState().learnedMerchantRules;
    expect(inStore).toHaveLength(1);
    expect(inStore[0].merchantPattern).toBe('Blue Tokai Coffee');

    // Verify storage persistence
    const saved = await StorageService.getItem(STORAGE_KEYS.LEARNED_RULES, []);
    expect(saved).toHaveLength(1);
  });

  it('updates category for existing rule rather than creating duplicate', async () => {
    const store = useAppStore.getState();
    await store.addLearnedRule('Starbucks', 'cat-food', 'Food & Dining');
    await store.addLearnedRule('Starbucks', 'cat-office', 'Office & Work');

    const rules = useAppStore.getState().learnedMerchantRules;
    expect(rules).toHaveLength(1);
    expect(rules[0].categoryId).toBe('cat-office');
    expect(rules[0].categoryName).toBe('Office & Work');
  });

  it('deletes a learned rule successfully', async () => {
    const store = useAppStore.getState();
    const rule = await store.addLearnedRule('Swiggy', 'cat-office', 'Office & Work');
    expect(useAppStore.getState().learnedMerchantRules).toHaveLength(1);

    await store.deleteLearnedRule(rule.id);
    expect(useAppStore.getState().learnedMerchantRules).toHaveLength(0);
  });

  it('automatically learns rule when confirming detected transaction with category change', async () => {
    const detectedTx: DetectedTransaction = {
      id: 'dt-1',
      amount: 450,
      type: 'expense',
      merchant: 'Starbucks Cyberhub',
      suggestedCategory: 'Food & Dining',
      suggestedCategoryId: 'cat-food',
      paymentMethod: 'UPI',
      paymentProvider: 'Google Pay',
      sourcePackage: 'com.google.android.apps.nbu.paisa.user',
      transactionTimestamp: Date.now(),
      createdAt: Date.now(),
      isAutomaticallyDetected: true,
      detectionConfidence: 0.95,
      rawReferenceHash: 'hash-1',
      status: 'DETECTED',
    };

    useAppStore.setState({ detectedTransactions: [detectedTx] });

    // Confirm with changed category: cat-office
    await useAppStore.getState().confirmDetectedTransaction('dt-1', {
      categoryId: 'cat-office',
    });

    const rules = useAppStore.getState().learnedMerchantRules;
    expect(rules).toHaveLength(1);
    expect(rules[0].categoryId).toBe('cat-office');
    expect(rules[0].categoryName).toBe('Office & Work');

    // Verify categorization now uses this rule
    const match = MerchantCategorizer.categorize('Starbucks Cyberhub', rules);
    expect(match.categoryId).toBe('cat-office');
  });
});
