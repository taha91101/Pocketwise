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
  LearnedMerchantRule,
  DetectionDiagnosticEvent,
  CashFlowForecast,
  Liability,
  SharedExpense,
} from '../types';
import { UPIDetectionService } from '../services/upiDetectionService';
import { MerchantCategorizer } from '../services/upiParser';
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
import { ForecastService } from '../services/forecastService';
import { BudgetService } from '../services/budgetService';
import { AppExportData } from '../services/exportImportService';
import { NotificationService } from '../services/notificationService';
import { DataIntegrityService, IntegrityAuditReport } from '../services/dataIntegrityService';
import { StorageMigrationService, MigrationResult } from '../storage/storageMigrationService';
import { SQLiteStorage } from '../storage/sqliteStorage';

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
  learnedMerchantRules: LearnedMerchantRule[];
  detectionDiagnostics: DetectionDiagnosticEvent[];

  // Actions - Automatic UPI Expense Detection
  syncDetectedTransactions: () => Promise<void>;
  processIncomingDetectedTransaction: (detected: DetectedTransaction) => Promise<Transaction | null>;
  confirmDetectedTransaction: (id: string, edits?: Partial<Transaction>) => Promise<Transaction | null>;
  confirmBatchDetectedTransactions: (ids: string[], categoryIdOverride?: string) => Promise<Transaction[]>;
  rejectDetectedTransaction: (id: string) => Promise<boolean>;
  rejectBatchDetectedTransactions: (ids: string[]) => Promise<boolean>;
  clearDetectedTransactions: () => Promise<void>;
  checkNotificationAccessStatus: () => Promise<boolean>;

  // Actions - Learned Rules (F2.2)
  addLearnedRule: (
    merchantPattern: string,
    categoryId: string,
    categoryName: string,
    categoryIcon?: string,
    categoryColor?: string
  ) => Promise<LearnedMerchantRule>;
  deleteLearnedRule: (id: string) => Promise<boolean>;
  clearLearnedRules: () => Promise<void>;

  // Actions - Detection Diagnostics (F2.1)
  recordDiagnosticEvent: (
    event: Omit<DetectionDiagnosticEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
  ) => Promise<void>;
  clearDiagnostics: () => Promise<void>;

  // Data - Planning & Insights (Phase 3)
  forecast: CashFlowForecast;
  liabilities: Liability[];
  sharedExpenses: SharedExpense[];

  // Actions - Liabilities (F3.5)
  addLiability: (liability: Omit<Liability, 'id' | 'createdAt'>) => Promise<Liability>;
  updateLiability: (id: string, updated: Partial<Liability>) => Promise<boolean>;
  deleteLiability: (id: string) => Promise<boolean>;
  recordLiabilityPayment: (id: string, amount: number, accountId?: string) => Promise<boolean>;

  // Actions - Shared Expenses (F3.6)
  addSharedExpense: (
    expense: Omit<SharedExpense, 'id' | 'createdAt' | 'isSettled'> & { isSettled?: boolean }
  ) => Promise<SharedExpense>;
  settleSharedExpense: (id: string) => Promise<boolean>;
  deleteSharedExpense: (id: string) => Promise<boolean>;

  // Actions - Budget Rollovers (F3.2)
  applyBudgetRollovers: () => Promise<void>;

  // Data & Actions - Storage & Integrity (Phase 4)
  isSQLiteMigrated: boolean;
  checkSQLiteStatus: () => Promise<boolean>;
  runSQLiteMigration: () => Promise<MigrationResult>;
  auditDataIntegrity: () => IntegrityAuditReport;
  reconcileAccount: (accountId: string, actualBalance: number, notes?: string) => Promise<boolean>;
  repairOrphans: (fallbackCategoryId?: string, fallbackAccountId?: string) => Promise<number>;
}

export function computeDerivedState(
  accounts: Account[],
  transactions: Transaction[],
  budgets: Budget[],
  savingsGoals: SavingsGoal[],
  recurringPayments: RecurringPayment[],
  liabilities: Liability[] = [],
  currencySymbol: string = '₹'
) {
  const overview = FinancialCalculationsService.calculateOverview(
    accounts,
    transactions,
    savingsGoals,
    new Date(),
    liabilities
  );
  const insights = InsightsService.generateInsights(
    transactions,
    accounts,
    budgets,
    savingsGoals,
    currencySymbol
  );
  const forecast = ForecastService.calculateMonthEndForecast(
    accounts,
    transactions,
    recurringPayments
  );
  return { overview, insights, forecast };
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
  learnedMerchantRules: [],
  detectionDiagnostics: [],
  autoRecordedNotice: null,
  liabilities: [],
  sharedExpenses: [],
  isSQLiteMigrated: false,

  ...computeDerivedState(
    INITIAL_ACCOUNTS,
    INITIAL_TRANSACTIONS,
    INITIAL_BUDGETS,
    INITIAL_SAVINGS_GOALS,
    INITIAL_RECURRING_PAYMENTS,
    [],
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
        savedLearnedRules,
        savedDiagnostics,
        savedLiabilities,
        savedSharedExpenses,
      ] = await Promise.all([
        StorageService.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS),
        StorageService.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
        StorageService.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS),
        StorageService.getItem<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, INITIAL_SAVINGS_GOALS),
        StorageService.getItem<RecurringPayment[]>(STORAGE_KEYS.RECURRING_PAYMENTS, INITIAL_RECURRING_PAYMENTS),
        StorageService.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS, INITIAL_USER_SETTINGS),
        StorageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES),
        StorageService.getItem<DetectedTransaction[]>(STORAGE_KEYS.DETECTED_TRANSACTIONS, []),
        StorageService.getItem<LearnedMerchantRule[]>(STORAGE_KEYS.LEARNED_RULES, []),
        StorageService.getItem<DetectionDiagnosticEvent[]>(STORAGE_KEYS.DETECTION_DIAGNOSTICS, []),
        StorageService.getItem<Liability[]>(STORAGE_KEYS.LIABILITIES, []),
        StorageService.getItem<SharedExpense[]>(STORAGE_KEYS.SHARED_EXPENSES, []),
      ]);

      const derived = computeDerivedState(
        savedAccounts,
        savedTransactions,
        savedBudgets,
        savedGoals,
        savedRecurring,
        savedLiabilities || [],
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

      let isSQLiteMigrated = false;
      try {
        isSQLiteMigrated = await StorageMigrationService.isMigrationCompleted();
      } catch (err) {
        console.warn('SQLite migration check error on hydrate:', err);
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
        learnedMerchantRules: savedLearnedRules || [],
        detectionDiagnostics: savedDiagnostics || [],
        liabilities: savedLiabilities || [],
        sharedExpenses: savedSharedExpenses || [],
        isSQLiteMigrated,
        ...derived,
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
    const derived = computeDerivedState(
      INITIAL_ACCOUNTS,
      INITIAL_TRANSACTIONS,
      INITIAL_BUDGETS,
      INITIAL_SAVINGS_GOALS,
      INITIAL_RECURRING_PAYMENTS,
      [],
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
      detectedTransactions: [],
      learnedMerchantRules: [],
      detectionDiagnostics: [],
      liabilities: [],
      sharedExpenses: [],
      ...derived,
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
      const learnedMerchantRules = data.learnedMerchantRules || get().learnedMerchantRules || [];
      const liabilities = data.liabilities || get().liabilities || [];
      const sharedExpenses = data.sharedExpenses || get().sharedExpenses || [];

      await Promise.all([
        StorageService.setItem(STORAGE_KEYS.ACCOUNTS, accounts),
        StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, transactions),
        StorageService.setItem(STORAGE_KEYS.BUDGETS, budgets),
        StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, savingsGoals),
        StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, recurringPayments),
        StorageService.setItem(STORAGE_KEYS.CATEGORIES, categories),
        StorageService.setItem(STORAGE_KEYS.USER_SETTINGS, settings),
        StorageService.setItem(STORAGE_KEYS.LEARNED_RULES, learnedMerchantRules),
        StorageService.setItem(STORAGE_KEYS.LIABILITIES, liabilities),
        StorageService.setItem(STORAGE_KEYS.SHARED_EXPENSES, sharedExpenses),
      ]);

      if (await StorageMigrationService.isMigrationCompleted()) {
        try {
          await SQLiteStorage.insertTransactionsBatch(transactions);
        } catch (e) {
          console.warn('SQLite batch insert error on import:', e);
        }
      }

      const derived = computeDerivedState(
        accounts,
        transactions,
        budgets,
        savingsGoals,
        recurringPayments,
        liabilities,
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
        learnedMerchantRules,
        liabilities,
        sharedExpenses,
        ...derived,
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

    const derived = computeDerivedState(
      updatedAccounts,
      updatedTransactions,
      state.budgets,
      updatedGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      savingsGoals: updatedGoals,
      ...derived,
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

    const derived = computeDerivedState(
      updatedAccounts,
      updatedTransactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      ...derived,
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

    const derived = computeDerivedState(
      updatedAccounts,
      updatedTransactions,
      state.budgets,
      updatedGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      savingsGoals: updatedGoals,
      ...derived,
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
    const derived = computeDerivedState(
      updatedAccounts,
      state.transactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({ accounts: updatedAccounts, ...derived });
    return newAccount;
  },

  updateAccount: async (id, updated) => {
    const state = get();
    const updatedAccounts = state.accounts.map((acc) => (acc.id === id ? { ...acc, ...updated } : acc));

    await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
    const derived = computeDerivedState(
      updatedAccounts,
      state.transactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({ accounts: updatedAccounts, ...derived });
    return true;
  },

  deleteAccount: async (id) => {
    const state = get();
    const updatedAccounts = state.accounts.filter((acc) => acc.id !== id);
    await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
    const derived = computeDerivedState(
      updatedAccounts,
      state.transactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({ accounts: updatedAccounts, ...derived });
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
    const derived = computeDerivedState(
      state.accounts,
      state.transactions,
      state.budgets,
      updatedGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({ savingsGoals: updatedGoals, ...derived });
    return newGoal;
  },

  updateSavingsGoal: async (id, updated) => {
    const state = get();
    const updatedGoals = state.savingsGoals.map((g) => (g.id === id ? { ...g, ...updated } : g));

    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals);
    const derived = computeDerivedState(
      state.accounts,
      state.transactions,
      state.budgets,
      updatedGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({ savingsGoals: updatedGoals, ...derived });
    return true;
  },

  deleteSavingsGoal: async (id) => {
    const state = get();
    const updatedGoals = state.savingsGoals.filter((g) => g.id !== id);

    await StorageService.setItem(STORAGE_KEYS.SAVINGS_GOALS, updatedGoals);
    const derived = computeDerivedState(
      state.accounts,
      state.transactions,
      state.budgets,
      updatedGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({ savingsGoals: updatedGoals, ...derived });
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

    // Automatically learn merchant rule if category was updated (F2.2)
    if (edits?.categoryId && edits.categoryId !== target.suggestedCategoryId) {
      const cat = state.categories.find((c) => c.id === edits.categoryId);
      if (cat) {
        await get().addLearnedRule(target.merchant, cat.id, cat.name, cat.icon, cat.color);
      }
    }

    const txInput = UPIDetectionService.convertDetectedToTransactionInput(
      target,
      state.categories,
      state.accounts,
      edits,
      state.settings.providerAccountMappings
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

  confirmBatchDetectedTransactions: async (ids, categoryIdOverride) => {
    const state = get();
    const results: Transaction[] = [];
    const remainingDetected = [...state.detectedTransactions];

    for (const id of ids) {
      const target = remainingDetected.find((d) => d.id === id);
      if (!target) continue;

      let edits: Partial<Transaction> | undefined;
      if (categoryIdOverride) {
        const cat = state.categories.find((c) => c.id === categoryIdOverride);
        if (cat) {
          edits = {
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categoryColor: cat.color,
          };
          await get().addLearnedRule(target.merchant, cat.id, cat.name, cat.icon, cat.color);
        }
      }

      const txInput = UPIDetectionService.convertDetectedToTransactionInput(
        target,
        state.categories,
        state.accounts,
        edits,
        state.settings.providerAccountMappings
      );

      const createdTx = await state.addTransaction(txInput);
      await UPIDetectionService.confirmDetectedTransaction(id);
      results.push(createdTx);

      const idx = remainingDetected.findIndex((d) => d.id === id);
      if (idx !== -1) {
        remainingDetected[idx] = { ...remainingDetected[idx], status: 'CONFIRMED' };
      }
    }

    set({ detectedTransactions: remainingDetected });
    await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, remainingDetected);
    return results;
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

  rejectBatchDetectedTransactions: async (ids) => {
    const state = get();
    for (const id of ids) {
      await UPIDetectionService.rejectDetectedTransaction(id);
    }
    const updated = state.detectedTransactions.map((d) =>
      ids.includes(d.id) ? { ...d, status: 'REJECTED' as const } : d
    );
    set({ detectedTransactions: updated });
    await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, updated);
    return true;
  },

  clearDetectedTransactions: async () => {
    await UPIDetectionService.clearDetectedTransactions();
    set({ detectedTransactions: [] });
    await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, []);
  },

  // Actions - Learned Rules (F2.2)
  addLearnedRule: async (merchantPattern, categoryId, categoryName, categoryIcon, categoryColor) => {
    const state = get();
    const cleanPattern = MerchantCategorizer.cleanMerchantName(merchantPattern);
    const existingIndex = state.learnedMerchantRules.findIndex(
      (r) => r.merchantPattern.toLowerCase() === cleanPattern.toLowerCase()
    );

    let updatedRules: LearnedMerchantRule[];
    let rule: LearnedMerchantRule;

    if (existingIndex >= 0) {
      rule = {
        ...state.learnedMerchantRules[existingIndex],
        categoryId,
        categoryName,
        categoryIcon: categoryIcon || state.learnedMerchantRules[existingIndex].categoryIcon,
        categoryColor: categoryColor || state.learnedMerchantRules[existingIndex].categoryColor,
      };
      updatedRules = [...state.learnedMerchantRules];
      updatedRules[existingIndex] = rule;
    } else {
      rule = {
        id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        merchantPattern: cleanPattern,
        categoryId,
        categoryName,
        categoryIcon,
        categoryColor,
        createdAt: new Date().toISOString(),
      };
      updatedRules = [rule, ...state.learnedMerchantRules];
    }

    set({ learnedMerchantRules: updatedRules });
    await StorageService.setItem(STORAGE_KEYS.LEARNED_RULES, updatedRules);
    return rule;
  },

  deleteLearnedRule: async (id) => {
    const state = get();
    const updated = state.learnedMerchantRules.filter((r) => r.id !== id);
    set({ learnedMerchantRules: updated });
    await StorageService.setItem(STORAGE_KEYS.LEARNED_RULES, updated);
    return true;
  },

  clearLearnedRules: async () => {
    set({ learnedMerchantRules: [] });
    await StorageService.setItem(STORAGE_KEYS.LEARNED_RULES, []);
  },

  // Actions - Detection Diagnostics (F2.1)
  recordDiagnosticEvent: async (eventData) => {
    const state = get();
    const newEvent: DetectionDiagnosticEvent = {
      id: eventData.id || `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: eventData.timestamp || Date.now(),
      packageName: eventData.packageName,
      titleSnippet: eventData.titleSnippet,
      textSnippet: eventData.textSnippet,
      outcome: eventData.outcome,
      reason: eventData.reason,
      parsedAmount: eventData.parsedAmount,
      parsedMerchant: eventData.parsedMerchant,
    };
    // Keep max 100 diagnostics to prevent storage bloat
    const updated = [newEvent, ...state.detectionDiagnostics].slice(0, 100);
    set({ detectionDiagnostics: updated });
    await StorageService.setItem(STORAGE_KEYS.DETECTION_DIAGNOSTICS, updated);
  },

  clearDiagnostics: async () => {
    set({ detectionDiagnostics: [] });
    await StorageService.setItem(STORAGE_KEYS.DETECTION_DIAGNOSTICS, []);
  },

  // Actions - Liabilities (F3.5)
  addLiability: async (liabilityData) => {
    const state = get();
    const id = `lia-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newLiability: Liability = {
      ...liabilityData,
      id,
      createdAt: new Date().toISOString(),
      isPaidOff: (liabilityData.remainingAmount || 0) <= 0,
    };
    const updatedLiabilities = [newLiability, ...state.liabilities];
    await StorageService.setItem(STORAGE_KEYS.LIABILITIES, updatedLiabilities);
    const derived = computeDerivedState(
      state.accounts,
      state.transactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      updatedLiabilities,
      state.settings.currencySymbol
    );
    set({ liabilities: updatedLiabilities, ...derived });
    return newLiability;
  },

  updateLiability: async (id, updated) => {
    const state = get();
    const index = state.liabilities.findIndex((l) => l.id === id);
    if (index === -1) return false;
    const updatedItem = { ...state.liabilities[index], ...updated };
    if (updatedItem.remainingAmount !== undefined) {
      updatedItem.isPaidOff = updatedItem.remainingAmount <= 0;
    }
    const updatedLiabilities = [...state.liabilities];
    updatedLiabilities[index] = updatedItem;
    await StorageService.setItem(STORAGE_KEYS.LIABILITIES, updatedLiabilities);
    const derived = computeDerivedState(
      state.accounts,
      state.transactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      updatedLiabilities,
      state.settings.currencySymbol
    );
    set({ liabilities: updatedLiabilities, ...derived });
    return true;
  },

  deleteLiability: async (id) => {
    const state = get();
    const updatedLiabilities = state.liabilities.filter((l) => l.id !== id);
    await StorageService.setItem(STORAGE_KEYS.LIABILITIES, updatedLiabilities);
    const derived = computeDerivedState(
      state.accounts,
      state.transactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      updatedLiabilities,
      state.settings.currencySymbol
    );
    set({ liabilities: updatedLiabilities, ...derived });
    return true;
  },

  recordLiabilityPayment: async (id, amount, accountId) => {
    const state = get();
    const liability = state.liabilities.find((l) => l.id === id);
    if (!liability) return false;

    const newRemaining = Math.max(0, liability.remainingAmount - amount);
    const isPaidOff = newRemaining === 0;

    const updatedLiabilities = state.liabilities.map((l) =>
      l.id === id ? { ...l, remainingAmount: newRemaining, isPaidOff } : l
    );

    let updatedAccounts = state.accounts;
    let updatedTransactions = state.transactions;

    if (accountId) {
      const account = state.accounts.find((a) => a.id === accountId);
      if (account) {
        updatedAccounts = state.accounts.map((a) =>
          a.id === accountId ? { ...a, balance: a.balance - amount } : a
        );
        const newTx: Transaction = {
          id: `tx-lia-${Date.now()}`,
          title: `Payment: ${liability.name}`,
          amount,
          type: 'expense',
          categoryId: 'cat-bills',
          categoryName: 'Bills & Utilities',
          categoryIcon: 'credit-card',
          categoryColor: '#EF4444',
          accountId,
          accountName: account.name,
          paymentMethod: 'UPI',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        updatedTransactions = [newTx, ...state.transactions];
        await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
        await StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
      }
    }

    await StorageService.setItem(STORAGE_KEYS.LIABILITIES, updatedLiabilities);
    const derived = computeDerivedState(
      updatedAccounts,
      updatedTransactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      updatedLiabilities,
      state.settings.currencySymbol
    );

    set({
      liabilities: updatedLiabilities,
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      ...derived,
    });
    return true;
  },

  // Actions - Shared Expenses (F3.6)
  addSharedExpense: async (expenseData) => {
    const state = get();
    const id = `sh-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newExpense: SharedExpense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString(),
      isSettled: false,
    };
    const updatedShared = [newExpense, ...state.sharedExpenses];
    await StorageService.setItem(STORAGE_KEYS.SHARED_EXPENSES, updatedShared);
    set({ sharedExpenses: updatedShared });
    return newExpense;
  },

  settleSharedExpense: async (id) => {
    const state = get();
    const updatedShared = state.sharedExpenses.map((s) =>
      s.id === id ? { ...s, isSettled: true, settledAt: new Date().toISOString() } : s
    );
    await StorageService.setItem(STORAGE_KEYS.SHARED_EXPENSES, updatedShared);
    set({ sharedExpenses: updatedShared });
    return true;
  },

  deleteSharedExpense: async (id) => {
    const state = get();
    const updatedShared = state.sharedExpenses.filter((s) => s.id !== id);
    await StorageService.setItem(STORAGE_KEYS.SHARED_EXPENSES, updatedShared);
    set({ sharedExpenses: updatedShared });
    return true;
  },

  // Actions - Budget Rollovers (F3.2)
  applyBudgetRollovers: async () => {
    const state = get();
    const updatedBudgets = BudgetService.calculateRollovers(state.budgets, state.transactions);
    await StorageService.setItem(STORAGE_KEYS.BUDGETS, updatedBudgets);
    const derived = computeDerivedState(
      state.accounts,
      state.transactions,
      updatedBudgets,
      state.savingsGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );
    set({ budgets: updatedBudgets, ...derived });
  },

  // Actions - Storage & Integrity (Phase 4)
  checkSQLiteStatus: async () => {
    const isMigrated = await StorageMigrationService.isMigrationCompleted();
    set({ isSQLiteMigrated: isMigrated });
    return isMigrated;
  },

  runSQLiteMigration: async () => {
    const result = await StorageMigrationService.runMigration();
    if (result.success) {
      set({ isSQLiteMigrated: true });
    }
    return result;
  },

  auditDataIntegrity: () => {
    const state = get();
    return DataIntegrityService.auditDataIntegrity(
      state.accounts,
      state.transactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      state.categories
    );
  },

  reconcileAccount: async (accountId: string, actualBalance: number, notes?: string) => {
    const state = get();
    const account = state.accounts.find((a) => a.id === accountId);
    if (!account) return false;

    const result = DataIntegrityService.reconcileAccount(account, actualBalance, notes);
    if (result.difference === 0) {
      return true;
    }

    const updatedAccounts = state.accounts.map((a) =>
      a.id === accountId ? result.updatedAccount : a
    );

    let updatedTransactions = state.transactions;
    if (result.adjustmentTx) {
      const newTx: Transaction = {
        ...result.adjustmentTx,
        id: `tx-adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      updatedTransactions = [newTx, ...updatedTransactions];

      if (await StorageMigrationService.isMigrationCompleted()) {
        try {
          await SQLiteStorage.insertTransaction(newTx);
        } catch (err) {
          console.warn('Failed to insert adjustment tx into SQLite:', err);
        }
      }
    }

    await Promise.all([
      StorageService.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts),
      StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, updatedTransactions),
    ]);

    const derived = computeDerivedState(
      updatedAccounts,
      updatedTransactions,
      state.budgets,
      state.savingsGoals,
      state.recurringPayments,
      state.liabilities,
      state.settings.currencySymbol
    );

    set({
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      ...derived,
    });

    return true;
  },

  repairOrphans: async (fallbackCategoryId?: string, fallbackAccountId?: string) => {
    const state = get();
    const fallbackCat =
      (fallbackCategoryId && state.categories.find((c) => c.id === fallbackCategoryId)) ||
      state.categories.find((c) => c.id === 'cat-others') ||
      state.categories[0];
    const fallbackAcc =
      (fallbackAccountId && state.accounts.find((a) => a.id === fallbackAccountId)) ||
      state.accounts[0];

    if (!fallbackCat || !fallbackAcc) return 0;

    const validCategoryIds = new Set(state.categories.map((c) => c.id));
    const validAccountIds = new Set(state.accounts.map((a) => a.id));

    let repairedCount = 0;

    // Repair transactions
    const repairedTransactions = state.transactions.map((tx) => {
      let modified = false;
      let nextTx = { ...tx };
      if (!validCategoryIds.has(tx.categoryId)) {
        nextTx.categoryId = fallbackCat.id;
        nextTx.categoryName = fallbackCat.name;
        nextTx.categoryIcon = fallbackCat.icon;
        nextTx.categoryColor = fallbackCat.color;
        modified = true;
      }
      if (!validAccountIds.has(tx.accountId)) {
        nextTx.accountId = fallbackAcc.id;
        nextTx.accountName = fallbackAcc.name;
        modified = true;
      }
      if (modified) repairedCount++;
      return nextTx;
    });

    // Repair budgets
    const repairedBudgets = state.budgets.map((b) => {
      if (!validCategoryIds.has(b.categoryId)) {
        repairedCount++;
        return {
          ...b,
          categoryId: fallbackCat.id,
          categoryName: fallbackCat.name,
        };
      }
      return b;
    });

    // Repair recurring payments
    const repairedRecurring = state.recurringPayments.map((r) => {
      let modified = false;
      let nextR = { ...r };
      if (!validCategoryIds.has(r.categoryId)) {
        nextR.categoryId = fallbackCat.id;
        nextR.categoryName = fallbackCat.name;
        modified = true;
      }
      if (r.accountId && !validAccountIds.has(r.accountId)) {
        nextR.accountId = fallbackAcc.id;
        nextR.accountName = fallbackAcc.name;
        modified = true;
      }
      if (modified) repairedCount++;
      return nextR;
    });

    if (repairedCount > 0) {
      await Promise.all([
        StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, repairedTransactions),
        StorageService.setItem(STORAGE_KEYS.BUDGETS, repairedBudgets),
        StorageService.setItem(STORAGE_KEYS.RECURRING_PAYMENTS, repairedRecurring),
      ]);

      if (await StorageMigrationService.isMigrationCompleted()) {
        try {
          await SQLiteStorage.insertTransactionsBatch(repairedTransactions);
        } catch (e) {
          console.warn('SQLite batch update error during repair:', e);
        }
      }

      const derived = computeDerivedState(
        state.accounts,
        repairedTransactions,
        repairedBudgets,
        state.savingsGoals,
        repairedRecurring,
        state.liabilities,
        state.settings.currencySymbol
      );

      set({
        transactions: repairedTransactions,
        budgets: repairedBudgets,
        recurringPayments: repairedRecurring,
        ...derived,
      });
    }

    return repairedCount;
  },
}));
