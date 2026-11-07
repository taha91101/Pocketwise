export type TransactionType = 'expense' | 'income' | 'saving' | 'transfer';

export interface TransactionSplit {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  splits?: TransactionSplit[];
  date: string; // ISO date string (YYYY-MM-DD or full ISO)
  time?: string; // HH:MM
  accountId: string;
  accountName: string;
  destinationAccountId?: string;
  destinationAccountName?: string;
  goalId?: string;
  goalName?: string;
  paymentMethod: string;
  notes?: string;
  receiptUri?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  merchant?: string;
  paymentProvider?: string;
  source?: 'manual' | 'notification' | 'import' | 'recurring';
  sourcePackage?: string;
  upiReference?: string;
  isAutomaticallyDetected?: boolean;
  detectionConfidence?: number;
  rawReferenceHash?: string;
  createdAt: string;
}

export type DetectedTransactionStatus = 'DETECTED' | 'CONFIRMED' | 'REJECTED' | 'IGNORED';

export interface DetectedTransaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  merchant: string;
  suggestedCategory: string;
  suggestedCategoryId: string;
  paymentMethod: string;
  paymentProvider: string;
  sourcePackage: string;
  upiReference?: string;
  transactionTimestamp: number;
  createdAt: number;
  isAutomaticallyDetected: boolean;
  detectionConfidence: number;
  rawReferenceHash: string;
  status: DetectedTransactionStatus;
  rawTitleSnippet?: string;
  rawTextSnippet?: string;
  notes?: string;
  availableBalance?: number;
  splits?: TransactionSplit[];
  matchedEntity?: {
    type: 'recurring' | 'transaction' | 'goal';
    id: string;
    name: string;
    amount: number;
  };
}

export interface SupportedPaymentApp {
  packageName: string;
  displayName: string;
  isEnabled: boolean;
}

export type AccountType = 'bank' | 'cash' | 'credit' | 'wallet' | 'investment';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string;
  color: string;
  accountNumberMasked?: string;
  currency?: string;
  currencySymbol?: string;
  exchangeRateToPrimary?: number;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  period: 'monthly' | 'weekly' | 'custom';
  startDate: string;
  endDate: string;
  alertThreshold?: number; // default 80 (%)
  rolloverEnabled?: boolean;
  rolloverAmount?: number;
  overallMonthlyCap?: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  color: string;
  icon: string;
  category?: string;
  isCompleted?: boolean;
  createdAt: string;
}

export interface RecurringPayment {
  id: string;
  title: string;
  amount: number;
  type?: 'expense' | 'income';
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  accountId: string;
  accountName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  isActive: boolean;
  reminderDaysBefore: number;
  autoRecord?: boolean;
  lastPaidDate?: string;
  yearlyCostRollup?: number;
  previousAmount?: number;
  isLikelySubscriptionDetected?: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
  isCustom?: boolean;
}

export interface PaymentMethodItem {
  id: string;
  name: string;
  icon: string;
}

export interface NotificationSettings {
  budgetWarnings: boolean;
  recurringPayments: boolean;
  savingsReminders: boolean;
  monthlySummary: boolean;
  goalMilestones: boolean;
  hideAmountsInNotifications?: boolean;
  automaticExpenseDetection?: boolean;
  autoConfirmHighConfidence?: boolean;
  detectRefunds?: boolean;
  detectBankNotifications?: boolean;
}

export interface UserSettings {
  userName: string;
  currency: string;
  currencySymbol: string;
  monthlyIncomeRange: string;
  mainSavingsGoal: string;
  preferredSavingTarget: number;
  themeMode: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  securityEnabled: boolean;
  biometricEnabled?: boolean;
  lockTimeout?: 'immediate' | '1min' | '5min';
  pinCode?: string;
  providerAccountMappings?: Record<string, string>; // e.g. { 'Google Pay': 'acc-1', 'HDFC Bank': 'acc-1' }
  hasCompletedOnboarding: boolean;
  hasCompletedWalkthrough: boolean;
  language?: 'en' | 'hi';
  numberGrouping?: 'lakhs' | 'millions';
  exchangeRates?: Record<string, number>;
}

export interface LearnedMerchantRule {
  id: string;
  merchantPattern: string; // Cleaned merchant name pattern
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  createdAt: string;
}

export interface DetectionDiagnosticEvent {
  id: string;
  timestamp: number;
  packageName: string;
  titleSnippet: string;
  textSnippet: string;
  outcome:
    | 'DETECTED'
    | 'DROPPED_FAILURE'
    | 'DROPPED_REQUEST'
    | 'DROPPED_NOISE'
    | 'DROPPED_OTP'
    | 'DROPPED_DUPLICATE'
    | 'DROPPED_UNSUPPORTED';
  reason: string;
  parsedAmount?: number;
  parsedMerchant?: string;
}

export interface FinancialInsight {
  id: string;
  type: 'saving' | 'warning' | 'achievement' | 'tip';
  title: string;
  description: string;
  amountImpact?: number;
  icon: string;
  color: string;
  date: string;
  filterCriteria?: {
    categoryId?: string;
    transactionIds?: string[];
    merchant?: string;
  };
}

export interface CashFlowForecast {
  projectedMonthEndBalance: number;
  safeToSpendToday: number;
  upcomingCommittedExpenses: number;
  expectedRemainingIncome: number;
  averageDailyDiscretionarySpend: number;
  daysRemainingInMonth: number;
  isLowBalanceWarning: boolean;
  lowBalanceThreshold: number;
  confidenceScore: number;
}

export type LiabilityType = 'credit_card' | 'loan' | 'emi' | 'other';

export interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  minimumMonthlyPayment: number;
  dueDate: string;
  statementDate?: string;
  creditLimit?: number; // for credit cards
  payoffTargetDate?: string;
  color?: string;
  icon?: string;
  accountId?: string;
  isPaidOff?: boolean;
  createdAt: string;
}

export interface SharedExpense {
  id: string;
  transactionId?: string;
  friendName: string;
  amount: number;
  type: 'you_lent' | 'you_borrowed';
  isSettled: boolean;
  notes?: string;
  createdAt: string;
  settledAt?: string;
}

export interface FinancialOverview {
  availableBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netSavingsRate: number; // percentage
  monthOverMonthGrowth: number; // percentage
  openingBalance: number;
  closingBalance: number;
  totalLiabilities?: number;
  netWorth?: number;
}
