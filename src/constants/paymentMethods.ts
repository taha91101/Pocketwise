import { PaymentMethodItem } from '../types';

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  { id: 'pm-upi', name: 'UPI', icon: 'zap' },
  { id: 'pm-bank', name: 'Bank Transfer', icon: 'credit-card' },
  { id: 'pm-debit', name: 'Debit Card', icon: 'credit-card' },
  { id: 'pm-credit', name: 'Credit Card', icon: 'credit-card' },
  { id: 'pm-cash', name: 'Cash', icon: 'dollar-sign' },
  { id: 'pm-wallet', name: 'Digital Wallet', icon: 'smartphone' },
];

export const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (S$)' },
];
