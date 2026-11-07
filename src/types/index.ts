export type TransactionType = 'expense' | 'income' | 'saving' | 'transfer';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
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
  hasCompletedOnboarding: boolean;
  hasCompletedWalkthrough: boolean;
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
}
