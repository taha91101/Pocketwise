import { create } from 'zustand';
import {
  Account,
  Budget,
  Category,
  FinancialInsight,
  FinancialOverview,
  PaymentMethodItem,
  RecurringPayment,
  SavingsGoal,
  Transaction,
  UserSettings,
  DetectedTransaction,
} from '../types';
import { UPIDetectionService } from '../services/upiDetectionService';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { DEFAULT_PAYMENT_METHODS } from '../constants/paymentMethods';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_RECURRING_PAYMENTS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_TRANSACTIONS,
  INITIAL_USER_SETTINGS,
} from '../constants/initialData';
import { StorageService } from '../storage/storageService';
import { STORAGE_KEYS } from '../storage/keys';
import { FinancialCalculationsService } from '../services/financialCalculations';
import { InsightsService } from '../services/insightsService';
import { AppExportData } from '../services/exportImportService';
import { NotificationService } from '../services/notificationService';

interface AppState {
  // Data
  isHydrated: boolean;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
  categories: Category[];
  paymentMethods: PaymentMethodItem[];
  settings: UserSettings;

  // Computed & Derived
  overview: FinancialOverview;
  insights: FinancialInsight[];

  // Actions - Initialization
  hydrate: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  importData: (data: AppExportData) => Promise<boolean>;

  // Actions - Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, updated: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  duplicateTransaction: (id: string) => Promise<Transaction | null>;

  // Actions - Accounts
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account>;
  updateAccount: (id: string, updated: Partial<Account>) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, notes?: string) => Promise<boolean>;

  // Actions - Budgets
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<Budget>;
  updateBudget: (id: string, updated: Partial<Budget>) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;

  // Actions - Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<SavingsGoal>;
  updateSavingsGoal: (id: string, updated: Partial<SavingsGoal>) => Promise<boolean>;
  deleteSavingsGoal: (id: string) => Promise<boolean>;
  contributeToGoal: (goalId: string, accountId: string, amount: number, notes?: string) => Promise<boolean>;
  withdrawFromGoal: (goalId: string, accountId: string, amount: number, notes?: string) => Promise<boolean>;

  // Actions - Recurring Payments
  addRecurringPayment: (payment: Omit<RecurringPayment, 'id' | 'createdAt'>) => Promise<RecurringPayment>;
  updateRecurringPayment: (id: string, updated: Partial<RecurringPayment>) => Promise<boolean>;
  deleteRecurringPayment: (id: string) => Promise<boolean>;
  toggleRecurringPayment: (id: string) => Promise<boolean>;
  autoRecordDueRecurringPayments: () => Promise<number>;
  autoRecordedNotice: {
    count: number;
    transactionIds: string[];
    items: { txId: string; recId: string; previousDueDate: string }[];
  } | null;
  clearAutoRecordedNotice: () => void;
  undoAutoRecordedTransactions: () => Promise<void>;

  // Actions - Categories
  addCategory: (category: Omit<Category, 'id' | 'isCustom'>) => Promise<Category>;
  updateCategory: (id: string, updated: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: string, fallbackCategoryId: string) => Promise<boolean>;

  // Actions - Settings
  updateSettings: (updated: Partial<UserSettings>) => Promise<void>;
  completeOnboarding: (data: Partial<UserSettings>) => Promise<void>;
  completeWalkthrough: () => Promise<void>;
  restartWalkthrough: () => Promise<void>;

  // Data - Automatic UPI Expense Detection
  detectedTransactions: DetectedTransaction[];
  isNotificationAccessGranted: boolean;

  // Actions - Automatic UPI Expense Detection
  syncDetectedTransactions: () => Promise<void>;
  processIncomingDetectedTransaction: (detected: DetectedTransaction) => Promise<Transaction | null>;
  confirmDetectedTransaction: (id: string, edits?: Partial<Transaction>) => Promise<Transaction | null>;
  rejectDetectedTransaction: (id: string) => Promise<boolean>;
  clearDetectedTransactions: () => Promise<void>;
  checkNotificationAccessStatus: () => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isHydrated: false,
  accounts: INITIAL_ACCOUNTS,
  transactions: INITIAL_TRANSACTIONS,
  budgets: INITIAL_BUDGETS,
  savingsGoals: INITIAL_SAVINGS_GOALS,
  recurringPayments: INITIAL_RECURRING_PAYMENTS,
  categories: DEFAULT_CATEGORIES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  settings: INITIAL_USER_SETTINGS,
  detectedTransactions: [],
  isNotificationAccessGranted: false,
  autoRecordedNotice: null,

  overview: FinancialCalculationsService.calculateOverview(
    INITIAL_ACCOUNTS,
    INITIAL_TRANSACTIONS,
    INITIAL_SAVINGS_GOALS
  ),
  insights: InsightsService.generateInsights(
    INITIAL_TRANSACTIONS,
    INITIAL_ACCOUNTS,
    INITIAL_BUDGETS,
    INITIAL_SAVINGS_GOALS,
    INITIAL_USER_SETTINGS.currencySymbol
  ),

  hydrate: async () => {
    try {
      const [
        savedAccounts,
        savedTransactions,
        savedBudgets,
        savedGoals,
        savedRecurring,
        savedSettings,
        savedCategories,
        savedDetected,
      ] = await Promise.all([
        StorageService.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS),
        StorageService.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
        StorageService.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS),
        StorageService.getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, INITIAL_SAVINGS_GOALS),
        StorageService.getItem<RecurringPayment[]>(STORAGE_KEYS.RECURRING_PAYMENTS, INITIAL_RECURRING_PAYMENTS),
        StorageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS, INITIAL_USER_SETTINGS),
        StorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),
        StorageService.getItem<DetectedTransaction[]>(STORAGE_KEYS.DETECTED_TRANSACTIONS, []),
      ]);

      const overview = FinancialCalculationsService.calculateOverview(savedAccounts, savedTransactions, savedGoals);
      const insights = InsightsService.generateInsights(
        savedTransactions,
        savedAccounts,
        savedBudgets,
        savedGoals,
        savedSettings.currencySymbol
      );

      // Check native storage & permissions
      let finalDetected = savedDetected || [];
      let isAccessGranted = false;

      if (UPIDetectionService.isAvailable()) {
        try {
          isAccessGranted = await UPIDetectionService.isNotificationAccessGranted();
          const nativeList = await UPIDetectionService.getDetectedTransactions();
          if (nativeList && nativeList.length > 0) {
            // Merge by ID keeping most recent
            const map = new Map<string, DetectedTransaction>();
            nativeList.forEach((item) => map.set(item.id, item));
            finalDetected.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            finalDetected = Array.from(map.values()).sort(
              (a, b) => b.transactionTimestamp - a.transactionTimestamp
            );
          }
        } catch (e) {
          console.warn('Native detection check error:', e);
        }

        // Subscribe to real-time events
        UPIDetectionService.subscribeToDetectionEvents(async (incomingTx) => {
          await get().processIncomingDetectedTransaction(incomingTx);
        });
      }

      set({
        isHydrated: true,
        accounts: savedAccounts,
        transactions: savedTransactions,
        budgets: savedBudgets,
        savingsGoals: savedGoals,
        recurringPayments: savedRecurring,
        settings: savedSettings,
        categories: savedCategories,
        detectedTransactions: finalDetected,
        isNotificationAccessGranted: isAccessGranted,
        overview,
        insights,
      });

      // Catch-up auto-recording for due recurring payments
      await get().autoRecordDueRecurringPayments();

      // Synchronize system notifications
      try {
        await NotificationService.syncSystemNotifications(
          get().settings.notifications,
          get().budgets,
          get().transactions,
          get().recurringPayments,
          get().savingsGoals,
          get().settings.currencySymbol
        );
      } catch (notifErr) {
        console.warn('Notification sync error on hydrate:', notifErr);
      }
    } catch (e) {
      console.error('Hydration error:', e);
      set({ isHydrated: true });
    }
  },

  resetToDefaults: async () => {
    await StorageService.clearAll();
    const overview = FinancialCalculationsService.calculateOverview(
      INITIAL_ACCOUNTS,
      INITIAL_TRANSACTIONS,
      INITIAL_SAVINGS_GOALS
    );
    const insights = InsightsService.generateInsights(
      INITIAL_TRANSACTIONS,
      INITIAL_ACCOUNTS,
      INITIAL_BUDGETS,
      INITIAL_SAVINGS_GOALS,
      INITIAL_USER_SETTINGS.currencySymbol
    );
    set({
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      budgets: INITIAL_BUDGETS,
      savingsGoals: INITIAL_SAVINGS_GOALS,
      recurringPayments: INITIAL_RECURRING_PAYMENTS,
      categories: DEFAULT_CATEGORIES,
      settings: INITIAL_USER_SETTINGS,
      overview,
      insights,
    });
  },

  importData: async (data: AppExportData) => {
    try {
      const accounts = data.accounts || INITIAL_ACCOUNTS;
      const transactions = data.transactions || [];
      const budgets = data.budgets || [];
      const savingsGoals = data.savingsGoals || [];
      const recurringPayments = data.recurringPayments || [];
      const categories = data.categories || get().categories || DEFAULT_CATEGORIES;
      const settings = data.settings || get().settings;

      await Promise.all([
        StorageService.setItem(STORAGE_KEYS.ACCOUNTS, accounts),
        StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, transactions),
        StorageService.setItem(STORAGE_KEYS.BUDGETS, budgets),
        StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, savingsGoals),
        StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, recurringPayments),
        StorageService.setItem(STORAGE_KEYS.CATEGORIES, categories),
        StorageService.setItem(STORAGE_KEYS.USER_SETTINGS, settings),
      ]);

      const overview = FinancialCalculationsService.calculateOverview(accounts, transactions, savingsGoals);
      const insights = InsightsService.generateInsights(
        transactions,
        accounts,
        budgets,
        savingsGoals,
        settings.currencySymbol
      );

      set({
        accounts,
        transactions,
        budgets,
        savingsGoals,
        recurringPayments,
        categories,
        settings,
        overview,
        insights,
      });
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  },

  addTransaction: async (txData) => {
    const state = get();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    // If user has not created any account yet, auto-create a primary Cash account with 0 opening balance
    let baseAccounts = [...state.accounts];
    if (baseAccounts.length === 0) {
      const defaultAccount: Account = {
        id: newTx.accountId || `acc-${Date.now()}`,
        name: newTx.accountName || 'Cash',
        type: 'cash',
        balance: 0,
        icon: 'dollar-sign',
        color: '#10B981',
      };
      newTx.accountId = defaultAccount.id;
      newTx.accountName = defaultAccount.name;
      baseAccounts = [defaultAccount];
    }

    // Update account balances appropriately
    const updatedAccounts = baseAccounts.map((acc) => {
      if (newTx.type === 'expense' && acc.id === newTx.accountId) {
        return { ...acc, balance: acc.balance - newTx.amount };
      }
      if (newTx.type === 'income' && acc.id === newTx.accountId) {
        return { ...acc, balance: acc.balance + newTx.amount };
      }
      if (newTx.type === 'saving' && acc.id === newTx.accountId) {
        return { ...acc, balance: acc.balance - newTx.amount };
      }
      if (newTx.type === 'transfer') {
        if (acc.id === newTx.accountId) {
          return { ...acc, balance: acc.balance - newTx.amount };
        }
        if (acc.id === newTx.destinationAccountId) {
          return { ...acc, balance: acc.balance + newTx.amount };
        }
      }
      return acc;
    });

    // If it's a savings transaction with a goalId, update the goal current amount
    let updatedGoals = state.savingsGoals;
    if (newTx.type === 'saving' && newTx.goalId) {
      updatedGoals = state.savingsGoals.map((g) => {
        if (g.id === newTx.goalId) {
          const nextAmount = g.currentAmount + newTx.amount;
          return { ...g, currentAmount: nextAmount, isCompleted: nextAmount >= g.targetAmount };
        }
        return g;
      });
    }

    const updatedTransactions = [newTx, ...state.transactions];

    await Promise.all([
      StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions),
      StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts),
      StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals),
    ]);

    const overview = FinancialCalculationsService.calculateOverview(updatedAccounts, updatedTransactions, updatedGoals);
    const insights = InsightsService.generateInsights(
      updatedTransactions,
      updatedAccounts,
      state.budgets,
      updatedGoals,
      state.settings.currencySymbol
    );

    set({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      savingsGoals: updatedGoals,
      overview,
      insights,
    });

    return newTx;
  },

  updateTransaction: async (id, updated) => {
    const state = get();
    const existing = state.transactions.find((t) => t.id === id);
    if (!existing) return false;

    // First revert old transaction balance
    let tempAccounts = state.accounts.map((acc) => {
      if (existing.type === 'expense' && acc.id === existing.accountId) {
        return { ...acc, balance: acc.balance + existing.amount };
      }
      if (existing.type === 'income' && acc.id === existing.accountId) {
        return { ...acc, balance: acc.balance - existing.amount };
      }
      if (existing.type === 'saving' && acc.id === existing.accountId) {
        return { ...acc, balance: acc.balance + existing.amount };
      }
      if (existing.type === 'transfer') {
        if (acc.id === existing.accountId) return { ...acc, balance: acc.balance + existing.amount };
        if (acc.id === existing.destinationAccountId) return { ...acc, balance: acc.balance - existing.amount };
      }
      return acc;
    });

    const mergedTx: Transaction = { ...existing, ...updated };

    // Apply new balance
    const updatedAccounts = tempAccounts.map((acc) => {
      if (mergedTx.type === 'expense' && acc.id === mergedTx.accountId) {
        return { ...acc, balance: acc.balance - mergedTx.amount };
      }
      if (mergedTx.type === 'income' && acc.id === mergedTx.accountId) {
        return { ...acc, balance: acc.balance + mergedTx.amount };
      }
      if (mergedTx.type === 'saving' && acc.id === mergedTx.accountId) {
        return { ...acc, balance: acc.balance - mergedTx.amount };
      }
      if (mergedTx.type === 'transfer') {
        if (acc.id === mergedTx.accountId) return { ...acc, balance: acc.balance - mergedTx.amount };
        if (acc.id === mergedTx.destinationAccountId) return { ...acc, balance: acc.balance + mergedTx.amount };
      }
      return acc;
    });

    const updatedTransactions = state.transactions.map((t) => (t.id === id ? mergedTx : t));

    await Promise.all([
      StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions),
      StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts),
    ]);

    const overview = FinancialCalculationsService.calculateOverview(updatedAccounts, updatedTransactions, state.savingsGoals);
    const insights = InsightsService.generateInsights(
      updatedTransactions,
      updatedAccounts,
      state.budgets,
      state.savingsGoals,
      state.settings.currencySymbol
    );

    set({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      overview,
      insights,
    });

    return true;
  },

  deleteTransaction: async (id) => {
    const state = get();
    const existing = state.transactions.find((t) => t.id === id);
    if (!existing) return false;

    // Revert account balance
    const updatedAccounts = state.accounts.map((acc) => {
      if (existing.type === 'expense' && acc.id === existing.accountId) {
        return { ...acc, balance: acc.balance + existing.amount };
      }
      if (existing.type === 'income' && acc.id === existing.accountId) {
        return { ...acc, balance: acc.balance - existing.amount };
      }
      if (existing.type === 'saving' && acc.id === existing.accountId) {
        return { ...acc, balance: acc.balance + existing.amount };
      }
      if (existing.type === 'transfer') {
        if (acc.id === existing.accountId) return { ...acc, balance: acc.balance + existing.amount };
        if (acc.id === existing.destinationAccountId) return { ...acc, balance: acc.balance - existing.amount };
      }
      return acc;
    });

    // If saving transaction linked to a goal, revert goal amount
    let updatedGoals = state.savingsGoals;
    if (existing.type === 'saving' && existing.goalId) {
      updatedGoals = state.savingsGoals.map((g) => {
        if (g.id === existing.goalId) {
          const nextAmount = Math.max(0, g.currentAmount - existing.amount);
          return { ...g, currentAmount: nextAmount, isCompleted: nextAmount >= g.targetAmount };
        }
        return g;
      });
    }

    const updatedTransactions = state.transactions.filter((t) => t.id !== id);

    await Promise.all([
      StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions),
      StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts),
      StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals),
    ]);

    const overview = FinancialCalculationsService.calculateOverview(updatedAccounts, updatedTransactions, updatedGoals);
    const insights = InsightsService.generateInsights(
      updatedTransactions,
      updatedAccounts,
      state.budgets,
      updatedGoals,
      state.settings.currencySymbol
    );

    set({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      savingsGoals: updatedGoals,
      overview,
      insights,
    });

    return true;
  },

  duplicateTransaction: async (id) => {
    const state = get();
    const existing = state.transactions.find((t) => t.id === id);
    if (!existing) return null;

    const { id: _, createdAt: __, ...txData } = existing;
    return await state.addTransaction({
      ...txData,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    });
  },

  addAccount: async (accData) => {
    const state = get();
    const newAccount: Account = {
      ...accData,
      id: `acc-${Date.now()}`,
    };
    const updatedAccounts = [...state.accounts, newAccount];

    await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
    const overview = FinancialCalculationsService.calculateOverview(updatedAccounts, state.transactions, state.savingsGoals);

    set({ accounts: updatedAccounts, overview });
    return newAccount;
  },

  updateAccount: async (id, updated) => {
    const state = get();
    const updatedAccounts = state.accounts.map((acc) => (acc.id === id ? { ...acc, ...updated } : acc));

    await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
    const overview = FinancialCalculationsService.calculateOverview(updatedAccounts, state.transactions, state.savingsGoals);

    set({ accounts: updatedAccounts, overview });
    return true;
  },

  deleteAccount: async (id) => {
    const state = get();
    const updatedAccounts = state.accounts.filter((acc) => acc.id !== id);
    await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
    const overview = FinancialCalculationsService.calculateOverview(updatedAccounts, state.transactions, state.savingsGoals);

    set({ accounts: updatedAccounts, overview });
    return true;
  },

  transferBetweenAccounts: async (fromId, toId, amount, notes) => {
    const state = get();
    const fromAcc = state.accounts.find((a) => a.id === fromId);
    const toAcc = state.accounts.find((a) => a.id === toId);

    if (!fromAcc || !toAcc || amount <= 0) return false;

    await state.addTransaction({
      title: `Transfer to ${toAcc.name}`,
      amount,
      type: 'transfer',
      categoryId: 'cat-transfer',
      categoryName: 'Account Transfer',
      categoryIcon: 'refresh-cw',
      categoryColor: '#64748B',
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      accountId: fromId,
      accountName: fromAcc.name,
      destinationAccountId: toId,
      destinationAccountName: toAcc.name,
      paymentMethod: 'Transfer',
      notes: notes || `Transferred from ${fromAcc.name} to ${toAcc.name}`,
    });

    return true;
  },

  addBudget: async (budgetData) => {
    const state = get();
    const newBudget: Budget = {
      ...budgetData,
      id: `bgt-${Date.now()}`,
    };
    const updatedBudgets = [...state.budgets, newBudget];

    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updatedBudgets);
    const insights = InsightsService.generateInsights(
      state.transactions,
      state.accounts,
      updatedBudgets,
      state.savingsGoals,
      state.settings.currencySymbol
    );

    set({ budgets: updatedBudgets, insights });
    return newBudget;
  },

  updateBudget: async (id, updated) => {
    const state = get();
    const updatedBudgets = state.budgets.map((b) => (b.id === id ? { ...b, ...updated } : b));

    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updatedBudgets);
    const insights = InsightsService.generateInsights(
      state.transactions,
      state.accounts,
      updatedBudgets,
      state.savingsGoals,
      state.settings.currencySymbol
    );

    set({ budgets: updatedBudgets, insights });
    return true;
  },

  deleteBudget: async (id) => {
    const state = get();
    const updatedBudgets = state.budgets.filter((b) => b.id !== id);

    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updatedBudgets);
    const insights = InsightsService.generateInsights(
      state.transactions,
      state.accounts,
      updatedBudgets,
      state.savingsGoals,
      state.settings.currencySymbol
    );

    set({ budgets: updatedBudgets, insights });
    return true;
  },

  addSavingsGoal: async (goalData) => {
    const state = get();
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedGoals = [...state.savingsGoals, newGoal];

    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals);
    const overview = FinancialCalculationsService.calculateOverview(state.accounts, state.transactions, updatedGoals);
    const insights = InsightsService.generateInsights(
      state.transactions,
      state.accounts,
      state.budgets,
      updatedGoals,
      state.settings.currencySymbol
    );

    set({ savingsGoals: updatedGoals, overview, insights });
    return newGoal;
  },

  updateSavingsGoal: async (id, updated) => {
    const state = get();
    const updatedGoals = state.savingsGoals.map((g) => (g.id === id ? { ...g, ...updated } : g));

    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals);
    const overview = FinancialCalculationsService.calculateOverview(state.accounts, state.transactions, updatedGoals);
    const insights = InsightsService.generateInsights(
      state.transactions,
      state.accounts,
      state.budgets,
      updatedGoals,
      state.settings.currencySymbol
    );

    set({ savingsGoals: updatedGoals, overview, insights });
    return true;
  },

  deleteSavingsGoal: async (id) => {
    const state = get();
    const updatedGoals = state.savingsGoals.filter((g) => g.id !== id);

    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals);
    const overview = FinancialCalculationsService.calculateOverview(state.accounts, state.transactions, updatedGoals);
    const insights = InsightsService.generateInsights(
      state.transactions,
      state.accounts,
      state.budgets,
      updatedGoals,
      state.settings.currencySymbol
    );

    set({ savingsGoals: updatedGoals, overview, insights });
    return true;
  },

  contributeToGoal: async (goalId, accountId, amount, notes) => {
    const state = get();
    const goal = state.savingsGoals.find((g) => g.id === goalId);
    const account = state.accounts.find((a) => a.id === accountId);

    if (!goal || !account || amount <= 0) return false;

    await state.addTransaction({
      title: `Contribution to ${goal.name}`,
      amount,
      type: 'saving',
      categoryId: 'cat-savings',
      categoryName: 'Savings Goal',
      categoryIcon: 'target',
      categoryColor: '#10B981',
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      accountId,
      accountName: account.name,
      goalId: goal.id,
      goalName: goal.name,
      paymentMethod: 'Bank Transfer',
      notes: notes || `Allocated ₹${amount} to ${goal.name}`,
    });

    return true;
  },

  withdrawFromGoal: async (goalId, accountId, amount, notes) => {
    const state = get();
    const goal = state.savingsGoals.find((g) => g.id === goalId);
    const account = state.accounts.find((a) => a.id === accountId);

    if (!goal || !account || amount <= 0 || amount > goal.currentAmount) return false;

    // Deduct from goal
    const updatedGoals = state.savingsGoals.map((g) => {
      if (g.id === goalId) {
        const nextAmt = Math.max(0, g.currentAmount - amount);
        return { ...g, currentAmount: nextAmt, isCompleted: nextAmt >= g.targetAmount };
      }
      return g;
    });

    // Credit to account
    const updatedAccounts = state.accounts.map((a) => {
      if (a.id === accountId) {
        return { ...a, balance: a.balance + amount };
      }
      return a;
    });

    // Log withdrawal transaction as income or transfer
    const newTx: Transaction = {
      id: `tx-wd-${Date.now()}`,
      title: `Withdrawal from ${goal.name}`,
      amount,
      type: 'income',
      categoryId: 'cat-savings',
      categoryName: 'Savings Withdrawal',
      categoryIcon: 'arrow-down-left',
      categoryColor: '#3B82F6',
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      accountId,
      accountName: account.name,
      goalId: goal.id,
      goalName: goal.name,
      paymentMethod: 'Bank Transfer',
      notes: notes || `Withdrew ₹${amount} from ${goal.name}`,
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTx, ...state.transactions];

    await Promise.all([
      StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals),
      StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts),
      StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions),
    ]);

    const overview = FinancialCalculationsService.calculateOverview(updatedAccounts, updatedTransactions, updatedGoals);
    const insights = InsightsService.generateInsights(
      updatedTransactions,
      updatedAccounts,
      state.budgets,
      updatedGoals,
      state.settings.currencySymbol
    );

    set({
      savingsGoals: updatedGoals,
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      overview,
      insights,
    });

    return true;
  },

  addRecurringPayment: async (recData) => {
    const state = get();
    const newPayment: RecurringPayment = {
      ...recData,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedRecurring = [...state.recurringPayments, newPayment];

    await StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, updatedRecurring);
    set({ recurringPayments: updatedRecurring });
    return newPayment;
  },

  updateRecurringPayment: async (id, updated) => {
    const state = get();
    const updatedRecurring = state.recurringPayments.map((r) => (r.id === id ? { ...r, ...updated } : r));

    await StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, updatedRecurring);
    set({ recurringPayments: updatedRecurring });
    return true;
  },

  deleteRecurringPayment: async (id) => {
    const state = get();
    const updatedRecurring = state.recurringPayments.filter((r) => r.id !== id);

    await StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, updatedRecurring);
    set({ recurringPayments: updatedRecurring });
    return true;
  },

  toggleRecurringPayment: async (id) => {
    const state = get();
    const target = state.recurringPayments.find((r) => r.id === id);
    if (!target) return false;

    return await state.updateRecurringPayment(id, { isActive: !target.isActive });
  },

  clearAutoRecordedNotice: () => {
    set({ autoRecordedNotice: null });
  },

  autoRecordDueRecurringPayments: async (): Promise<number> => {
    const { recurringPayments, transactions, accounts } = get();
    const now = new Date();

    const dueItems = recurringPayments.filter(
      (rec) => rec.isActive && rec.autoRecord && new Date(rec.nextDueDate).getTime() <= now.getTime()
    );

    if (dueItems.length === 0) return 0;

    const newTransactions: Transaction[] = [];
    const updatedRecurring = [...recurringPayments];
    const updatedAccounts = [...accounts];
    const undoLog: { txId: string; recId: string; previousDueDate: string }[] = [];

    for (const rec of dueItems) {
      const recDue = new Date(rec.nextDueDate);

      // Guard against double-posting: check if an expense with identical title and amount was logged within ±2 days
      const isAlreadyPosted = transactions.some((tx) => {
        if (tx.type !== 'expense' || Math.abs(tx.amount - rec.amount) > 0.01) return false;
        const txDate = new Date(tx.date);
        const dayDiff = Math.abs((txDate.getTime() - recDue.getTime()) / (1000 * 60 * 60 * 24));
        return (
          dayDiff <= 2 &&
          (tx.title.toLowerCase().includes(rec.title.toLowerCase()) ||
            rec.title.toLowerCase().includes(tx.title.toLowerCase()))
        );
      });

      const previousDueDate = rec.nextDueDate;
      const nextDue = NotificationService.calculateNextDueDate(rec.nextDueDate, rec.frequency);
      const recIndex = updatedRecurring.findIndex((r) => r.id === rec.id);
      if (recIndex !== -1) {
        updatedRecurring[recIndex] = {
          ...updatedRecurring[recIndex],
          nextDueDate: nextDue.toISOString(),
        };
      }

      if (isAlreadyPosted) {
        continue;
      }

      const txId = `tx-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const tx: Transaction = {
        id: txId,
        title: rec.title,
        amount: rec.amount,
        type: 'expense',
        categoryId: rec.categoryId,
        categoryName: rec.categoryName,
        categoryIcon: rec.categoryIcon || 'repeat',
        categoryColor: rec.categoryColor || '#1A73E8',
        date: previousDueDate,
        time: '09:00',
        accountId: rec.accountId,
        accountName: rec.accountName,
        paymentMethod: 'Auto-Debit',
        source: 'recurring',
        notes: `Auto-recorded recurring commitment (${rec.frequency})`,
        createdAt: new Date().toISOString(),
      };

      newTransactions.push(tx);
      undoLog.push({ txId, recId: rec.id, previousDueDate });

      // Debit account balance
      const accIndex = updatedAccounts.findIndex((a) => a.id === rec.accountId);
      if (accIndex !== -1) {
        updatedAccounts[accIndex] = {
          ...updatedAccounts[accIndex],
          balance: updatedAccounts[accIndex].balance - rec.amount,
        };
      }
    }

    if (newTransactions.length > 0) {
      const finalTransactions = [...newTransactions, ...transactions];
      await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, finalTransactions);
      await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
      await StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, updatedRecurring);

      const overview = FinancialCalculationsService.calculateOverview(
        updatedAccounts,
        finalTransactions,
        get().savingsGoals
      );
      const insights = InsightsService.generateInsights(
        finalTransactions,
        updatedAccounts,
        get().budgets,
        get().savingsGoals,
        get().settings.currencySymbol
      );

      set({
        transactions: finalTransactions,
        accounts: updatedAccounts,
        recurringPayments: updatedRecurring,
        overview,
        insights,
        autoRecordedNotice: {
          count: newTransactions.length,
          transactionIds: newTransactions.map((t) => t.id),
          items: undoLog,
        },
      });
    } else {
      await StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, updatedRecurring);
      set({ recurringPayments: updatedRecurring });
    }

    return newTransactions.length;
  },

  undoAutoRecordedTransactions: async (): Promise<void> => {
    const notice = get().autoRecordedNotice;
    if (!notice || notice.items.length === 0) return;

    const { transactions, accounts, recurringPayments } = get();
    const txIdsToRemove = new Set(notice.items.map((i) => i.txId));

    // 1. Remove transactions and calculate refunded amounts per account
    const refundMap = new Map<string, number>();
    const keptTransactions: Transaction[] = [];

    for (const tx of transactions) {
      if (txIdsToRemove.has(tx.id)) {
        const currentRefund = refundMap.get(tx.accountId) || 0;
        refundMap.set(tx.accountId, currentRefund + tx.amount);
      } else {
        keptTransactions.push(tx);
      }
    }

    // 2. Revert account balances
    const updatedAccounts = accounts.map((acc) => {
      const refund = refundMap.get(acc.id);
      if (refund) {
        return { ...acc, balance: acc.balance + refund };
      }
      return acc;
    });

    // 3. Revert recurring payment nextDueDate
    const dueDateMap = new Map(notice.items.map((i) => [i.recId, i.previousDueDate]));
    const updatedRecurring = recurringPayments.map((rec) => {
      const prevDate = dueDateMap.get(rec.id);
      if (prevDate) {
        return { ...rec, nextDueDate: prevDate };
      }
      return rec;
    });

    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, keptTransactions);
    await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
    await StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, updatedRecurring);

    const overview = FinancialCalculationsService.calculateOverview(
      updatedAccounts,
      keptTransactions,
      get().savingsGoals
    );
    const insights = InsightsService.generateInsights(
      keptTransactions,
      updatedAccounts,
      get().budgets,
      get().savingsGoals,
      get().settings.currencySymbol
    );

    set({
      transactions: keptTransactions,
      accounts: updatedAccounts,
      recurringPayments: updatedRecurring,
      overview,
      insights,
      autoRecordedNotice: null,
    });
  },

  addCategory: async (catData) => {
    const state = get();
    const newCategory: Category = {
      ...catData,
      id: `cat-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isCustom: true,
    };
    const updatedCategories = [...state.categories, newCategory];
    await StorageService.setItem(STORAGE_KEYS.CATEGORIES, updatedCategories);
    set({ categories: updatedCategories });
    return newCategory;
  },

  updateCategory: async (id, updated) => {
    const state = get();
    const existing = state.categories.find((c) => c.id === id);
    if (!existing) return false;

    const mergedCategory: Category = { ...existing, ...updated };
    const updatedCategories = state.categories.map((c) => (c.id === id ? mergedCategory : c));

    // Cascade category updates to existing transactions
    const updatedTransactions = state.transactions.map((tx) => {
      if (tx.categoryId === id) {
        return {
          ...tx,
          categoryName: mergedCategory.name,
          categoryIcon: mergedCategory.icon,
          categoryColor: mergedCategory.color,
        };
      }
      return tx;
    });

    await Promise.all([
      StorageService.setItem(STORAGE_KEYS.CATEGORIES, updatedCategories),
      StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions),
    ]);

    set({ categories: updatedCategories, transactions: updatedTransactions });
    return true;
  },

  deleteCategory: async (id, fallbackCategoryId) => {
    const state = get();
    const targetCat = state.categories.find((c) => c.id === id);
    const fallbackCat = state.categories.find((c) => c.id === fallbackCategoryId);

    if (!targetCat || !fallbackCat || targetCat.id === fallbackCat.id) return false;

    const updatedCategories = state.categories.filter((c) => c.id !== id);

    // Reassign transactions
    const updatedTransactions = state.transactions.map((tx) => {
      if (tx.categoryId === id) {
        return {
          ...tx,
          categoryId: fallbackCat.id,
          categoryName: fallbackCat.name,
          categoryIcon: fallbackCat.icon,
          categoryColor: fallbackCat.color,
        };
      }
      return tx;
    });

    // Reassign budgets
    const updatedBudgets = state.budgets.map((bgt) => {
      if (bgt.categoryId === id) {
        return {
          ...bgt,
          categoryId: fallbackCat.id,
          name: `${fallbackCat.name} Budget`,
        };
      }
      return bgt;
    });

    await Promise.all([
      StorageService.setItem(STORAGE_KEYS.CATEGORIES, updatedCategories),
      StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions),
      StorageService.setItem(STORAGE_KEYS.BUDGETS, updatedBudgets),
    ]);

    set({
      categories: updatedCategories,
      transactions: updatedTransactions,
      budgets: updatedBudgets,
    });
    return true;
  },

  updateSettings: async (updated) => {
    const state = get();
    const merged = { ...state.settings, ...updated };

    await StorageService.setItem(STORAGE_KEYS.USER_SETTINGS, merged);
    const insights = InsightsService.generateInsights(
      state.transactions,
      state.accounts,
      state.budgets,
      state.savingsGoals,
      merged.currencySymbol
    );

    set({ settings: merged, insights });
  },

  completeOnboarding: async (onboardingData) => {
    const state = get();
    const updated = {
      ...state.settings,
      ...onboardingData,
      hasCompletedOnboarding: true,
    };

    await StorageService.setItem(STORAGE_KEYS.USER_SETTINGS, updated);
    set({ settings: updated });
  },

  completeWalkthrough: async () => {
    const state = get();
    const updated = {
      ...state.settings,
      hasCompletedWalkthrough: true,
    };
    await StorageService.setItem(STORAGE_KEYS.USER_SETTINGS, updated);
    set({ settings: updated });
  },

  restartWalkthrough: async () => {
    const state = get();
    const updated = {
      ...state.settings,
      hasCompletedWalkthrough: false,
    };
    await StorageService.setItem(STORAGE_KEYS.USER_SETTINGS, updated);
    set({ settings: updated });
  },

  syncDetectedTransactions: async () => {
    try {
      const isGranted = await UPIDetectionService.isNotificationAccessGranted();
      const nativeList = await UPIDetectionService.getDetectedTransactions();
      const savedList = await StorageService.getItem<DetectedTransaction[]>(
        STORAGE_KEYS.DETECTED_TRANSACTIONS,
        []
      );

      const map = new Map<string, DetectedTransaction>();
      nativeList.forEach((item) => map.set(item.id, item));
      savedList.forEach((item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      });
      const merged = Array.from(map.values()).sort(
        (a, b) => b.transactionTimestamp - a.transactionTimestamp
      );

      set({ detectedTransactions: merged, isNotificationAccessGranted: isGranted });
      await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, merged);
    } catch (e) {
      console.warn('Error syncing detected transactions:', e);
    }
  },

  checkNotificationAccessStatus: async () => {
    const isGranted = await UPIDetectionService.isNotificationAccessGranted();
    set({ isNotificationAccessGranted: isGranted });
    return isGranted;
  },

  processIncomingDetectedTransaction: async (detected) => {
    const state = get();
    const notificationPrefs = state.settings.notifications;
    const isAutoDetectEnabled = notificationPrefs.automaticExpenseDetection !== false;

    if (!isAutoDetectEnabled) return null;

    // Check if auto-confirm is enabled and confidence >= 0.85
    const shouldAutoConfirm =
      notificationPrefs.autoConfirmHighConfidence !== false &&
      detected.detectionConfidence >= 0.85;

    if (shouldAutoConfirm) {
      const txInput = UPIDetectionService.convertDetectedToTransactionInput(
        detected,
        state.categories,
        state.accounts
      );

      const createdTx = await state.addTransaction(txInput);
      await UPIDetectionService.confirmDetectedTransaction(detected.id);

      const updatedDetected = state.detectedTransactions.map((d) =>
        d.id === detected.id ? { ...d, status: 'CONFIRMED' as const } : d
      );
      if (!updatedDetected.some((d) => d.id === detected.id)) {
        updatedDetected.unshift({ ...detected, status: 'CONFIRMED' });
      }

      set({ detectedTransactions: updatedDetected });
      await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, updatedDetected);
      return createdTx;
    } else {
      // Pending user confirmation
      const existing = state.detectedTransactions.filter((d) => d.id !== detected.id);
      const nextList = [detected, ...existing];
      set({ detectedTransactions: nextList });
      await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, nextList);
      return null;
    }
  },

  confirmDetectedTransaction: async (id, edits) => {
    const state = get();
    const target = state.detectedTransactions.find((d) => d.id === id);
    if (!target) return null;

    const txInput = UPIDetectionService.convertDetectedToTransactionInput(
      target,
      state.categories,
      state.accounts,
      edits
    );

    const createdTx = await state.addTransaction(txInput);
    await UPIDetectionService.confirmDetectedTransaction(id);

    const updatedDetected = state.detectedTransactions.map((d) =>
      d.id === id ? { ...d, status: 'CONFIRMED' as const } : d
    );
    set({ detectedTransactions: updatedDetected });
    await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, updatedDetected);
    return createdTx;
  },

  rejectDetectedTransaction: async (id) => {
    const state = get();
    await UPIDetectionService.rejectDetectedTransaction(id);

    const updatedDetected = state.detectedTransactions.map((d) =>
      d.id === id ? { ...d, status: 'REJECTED' as const } : d
    );
    set({ detectedTransactions: updatedDetected });
    await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, updatedDetected);
    return true;
  },

  clearDetectedTransactions: async () => {
    await UPIDetectionService.clearDetectedTransactions();
    set({ detectedTransactions: [] });
    await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, []);
  },
}));
