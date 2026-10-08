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
  createdAt: string;
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
  accountId: string;
  accountName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  isActive: boolean;
  reminderDaysBefore: number;
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
