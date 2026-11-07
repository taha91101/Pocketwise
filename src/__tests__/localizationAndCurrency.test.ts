import { I18nService } from '../i18n/i18nService';
import { FinancialCalculationsService } from '../services/financialCalculations';
import { Account } from '../types';

describe('Localization & Multi-Currency (Phase 5 - F5.1 & F5.3)', () => {
  describe('I18nService - Translations', () => {
    it('returns English translations correctly', () => {
      expect(I18nService.t('net_worth', 'en')).toBe('Estimated Net Worth');
      expect(I18nService.t('safe_to_spend', 'en')).toBe('Safe-to-Spend');
      expect(I18nService.t('reconcile', 'en')).toBe('Reconcile');
    });

    it('returns Hindi translations correctly', () => {
      expect(I18nService.t('net_worth', 'hi')).toBe('अनुमानित कुल संपत्ति');
      expect(I18nService.t('safe_to_spend', 'hi')).toBe('सुरक्षित खर्च');
      expect(I18nService.t('reconcile', 'hi')).toBe('मिलान करें');
    });

    it('falls back to English when translation key is missing in target language', () => {
      expect(I18nService.t('unknown_key_xyz', 'hi')).toBe('unknown_key_xyz');
    });
  });

  describe('I18nService - Number Grouping (Lakhs vs Millions)', () => {
    it('formats Indian numbering system (Lakhs) correctly', () => {
      const formatted = I18nService.formatCurrency(150000, '₹', 'lakhs');
      // Indian system groups as 1,50,000
      expect(formatted).toBe('₹1,50,000');
    });

    it('formats International numbering system (Millions) correctly', () => {
      const formatted = I18nService.formatCurrency(150000, '$', 'millions');
      // Western system groups as 150,000
      expect(formatted).toBe('$150,000');
    });

    it('formats large Crores in Indian system vs Millions in Western system', () => {
      const formattedIndian = I18nService.formatCurrency(10000000, '₹', 'lakhs');
      expect(formattedIndian).toBe('₹1,00,00,000');

      const formattedWestern = I18nService.formatCurrency(10000000, '$', 'millions');
      expect(formattedWestern).toBe('$10,000,000');
    });

    it('handles negative amounts cleanly', () => {
      const formatted = I18nService.formatCurrency(-25000, '₹', 'lakhs');
      expect(formatted).toBe('-₹25,000');
    });
  });

  describe('I18nService - Currency Conversion', () => {
    it('converts USD to INR using default or custom exchange rates', () => {
      // 100 USD @ default 85.5 = 8550 INR
      const inrAmount = I18nService.convertCurrency(100, 'USD', 'INR');
      expect(inrAmount).toBe(8550);
    });

    it('converts using user-supplied custom exchange rates', () => {
      const inrAmount = I18nService.convertCurrency(100, 'USD', 'INR', { USD: 90.0 });
      expect(inrAmount).toBe(9000);
    });

    it('returns original amount when from and to currencies match', () => {
      expect(I18nService.convertCurrency(5000, 'INR', 'INR')).toBe(5000);
      expect(I18nService.convertCurrency(200, 'USD', 'USD')).toBe(200);
    });
  });

  describe('FinancialCalculationsService - Multi-Currency Account Aggregation', () => {
    it('normalizes foreign accounts into primary currency for Net Worth', () => {
      const accounts: Account[] = [
        {
          id: 'acc-inr',
          name: 'HDFC Bank',
          type: 'bank',
          balance: 14500,
          currency: 'INR',
          currencySymbol: '₹',
          color: '#10B981',
          icon: 'bank',
        },
        {
          id: 'acc-usd',
          name: 'Chase Checking',
          type: 'bank',
          balance: 1000, // $1,000
          currency: 'USD',
          currencySymbol: '$',
          exchangeRateToPrimary: 85.5, // 1 USD = 85.5 INR => 85,500 INR
          color: '#3B82F6',
          icon: 'credit-card',
        },
      ];

      const totalBalanceNormalized = FinancialCalculationsService.calculateTotalAccountBalance(
        accounts,
        'INR'
      );

      // 14,500 + (1,000 * 85.5) = 14,500 + 85,500 = 100,000 INR
      expect(totalBalanceNormalized).toBe(100000);
    });
  });
});

