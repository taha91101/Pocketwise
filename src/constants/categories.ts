import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expenses
  { id: 'cat-food', name: 'Food & Dining', icon: 'utensils', color: '#F97316', type: 'expense' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC4899', type: 'expense' },
  { id: 'cat-transport', name: 'Transport', icon: 'truck', color: '#3B82F6', type: 'expense' },
  { id: 'cat-bills', name: 'Bills & Utilities', icon: 'file-text', color: '#EAB308', type: 'expense' },
  { id: 'cat-groceries', name: 'Groceries', icon: 'shopping-cart', color: '#10B981', type: 'expense' },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'film', color: '#8B5CF6', type: 'expense' },
  { id: 'cat-health', name: 'Health & Medical', icon: 'activity', color: '#EF4444', type: 'expense' },
  { id: 'cat-education', name: 'Education', icon: 'book', color: '#06B6D4', type: 'expense' },
  { id: 'cat-travel', name: 'Travel', icon: 'map-pin', color: '#F43F5E', type: 'expense' },
  { id: 'cat-rent', name: 'Rent & Housing', icon: 'home', color: '#6366F1', type: 'expense' },
  { id: 'cat-subscription', name: 'Subscriptions', icon: 'repeat', color: '#14B8A6', type: 'expense' },
  { id: 'cat-other-exp', name: 'Other Expenses', icon: 'tag', color: '#64748B', type: 'expense' },

  // Incomes
  { id: 'cat-salary', name: 'Salary', icon: 'briefcase', color: '#10B981', type: 'income' },
  { id: 'cat-freelance', name: 'Freelance', icon: 'award', color: '#06B6D4', type: 'income' },
  { id: 'cat-business', name: 'Business', icon: 'trending-up', color: '#3B82F6', type: 'income' },
  { id: 'cat-investment', name: 'Investment', icon: 'dollar-sign', color: '#8B5CF6', type: 'income' },
  { id: 'cat-gift', name: 'Gift & Grants', icon: 'gift', color: '#EC4899', type: 'income' },
  { id: 'cat-other-inc', name: 'Other Income', icon: 'plus-circle', color: '#14B8A6', type: 'income' },

  // Savings / Transfers
  { id: 'cat-savings', name: 'Savings Goal', icon: 'target', color: '#10B981', type: 'both' },
  { id: 'cat-transfer', name: 'Account Transfer', icon: 'refresh-cw', color: '#64748B', type: 'both' },
];
