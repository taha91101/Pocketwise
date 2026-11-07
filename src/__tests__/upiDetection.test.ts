import {
  GooglePayParser,
  PhonePeParser,
  PaytmParser,
  GenericBankUPIParser,
  MerchantCategorizer,
} from '../services/upiParser';
import { UPIDetectionService } from '../services/upiDetectionService';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { DetectedTransaction } from '../types';

describe('Automatic UPI Expense Detection', () => {
  describe('Merchant Categorization', () => {
    it('categorizes popular dining merchants accurately', () => {
      const swiggyMatch = MerchantCategorizer.categorize('Swiggy');
      expect(swiggyMatch.categoryId).toBe('cat-food');
      expect(swiggyMatch.categoryName).toBe('Food & Dining');

      const starbucksMatch = MerchantCategorizer.categorize('STARBUCKS COFFEE');
      expect(starbucksMatch.categoryId).toBe('cat-food');

      const zomatoMatch = MerchantCategorizer.categorize('Zomato');
      expect(zomatoMatch.categoryId).toBe('cat-food');
    });

    it('categorizes transport, shopping, and entertainment correctly', () => {
      expect(MerchantCategorizer.categorize('Uber India').categoryId).toBe('cat-transport');
      expect(MerchantCategorizer.categorize('Ola Cabs').categoryId).toBe('cat-transport');
      expect(MerchantCategorizer.categorize('Amazon Seller').categoryId).toBe('cat-shopping');
      expect(MerchantCategorizer.categorize('Flipkart Internet').categoryId).toBe('cat-shopping');
      expect(MerchantCategorizer.categorize('Netflix Entertainment').categoryId).toBe('cat-entertainment');
      expect(MerchantCategorizer.categorize('Spotify India').categoryId).toBe('cat-entertainment');
    });

    it('falls back safely to Other Expenses for unknown payees', () => {
      const unknownMatch = MerchantCategorizer.categorize('Random Merchant XYZ');
      expect(unknownMatch.categoryId).toBe('cat-other-exp');
      expect(unknownMatch.categoryName).toBe('Other Expenses');
    });

    it('cleans merchant names and strips UPI IDs', () => {
      expect(MerchantCategorizer.cleanMerchantName('starbucks@okaxis')).toBe('Starbucks');
      expect(MerchantCategorizer.cleanMerchantName('Paid to ZOMATO PVT LTD')).toBe('Zomato');
      expect(MerchantCategorizer.cleanMerchantName('SWIGGY_BANGALORE')).toBe('Swiggy Bangalore');
    });
  });

  describe('Google Pay Notifications', () => {
    const parser = new GooglePayParser();
    const pkg = 'com.google.android.apps.nbu.paisa.user';
    const timestamp = Date.now();

    it('successfully extracts payment of ₹450 to Starbucks', () => {
      const result = parser.parse(
        pkg,
        'Paid ₹450 to Starbucks',
        'Paid to Starbucks. UPI Transaction ID: 402812345678',
        timestamp
      );

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(450);
      expect(result?.merchant).toBe('Starbucks');
      expect(result?.type).toBe('expense');
      expect(result?.paymentProvider).toBe('Google Pay');
      expect(result?.upiReference).toBe('402812345678');
      expect(result?.suggestedCategoryId).toBe('cat-food');
    });

    it('ignores failed and pending payment notifications', () => {
      const failed = parser.parse(
        pkg,
        'Payment failed',
        'Payment of ₹450 to Starbucks failed. No money was debited.',
        timestamp
      );
      expect(failed).toBeNull();

      const pending = parser.parse(
        pkg,
        'Payment is processing',
        'Your payment of ₹450 to Starbucks is in progress.',
        timestamp
      );
      expect(pending).toBeNull();
    });

    it('ignores payment requests and collect requests', () => {
      const request = parser.parse(
        pkg,
        'Payment request received',
        'John Doe requested ₹500 on Google Pay.',
        timestamp
      );
      expect(request).toBeNull();
    });

    it('ignores promotional cashback and scratch cards', () => {
      const promo = parser.parse(
        pkg,
        'You won a scratch card!',
        'Earned cashback of ₹50 on your recent payment.',
        timestamp
      );
      expect(promo).toBeNull();
    });

    it('correctly handles refunds as income', () => {
      const refund = parser.parse(
        pkg,
        'Refund received: ₹450',
        'Refund from Starbucks processed to your bank account',
        timestamp
      );

      expect(refund).not.toBeNull();
      expect(refund?.type).toBe('income');
      expect(refund?.amount).toBe(450);
      expect(refund?.merchant).toBe('Starbucks');
    });
  });

  describe('PhonePe Notifications', () => {
    const parser = new PhonePeParser();
    const pkg = 'com.phonepe.app';
    const timestamp = Date.now();

    it('successfully parses payment of ₹1,250 to Uber', () => {
      const result = parser.parse(
        pkg,
        'Payment of ₹1,250 to Uber successful',
        'Debited from Bank Account. UPI Ref: 402898765432',
        timestamp
      );

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(1250);
      expect(result?.merchant).toBe('Uber');
      expect(result?.type).toBe('expense');
      expect(result?.paymentProvider).toBe('PhonePe');
      expect(result?.suggestedCategoryId).toBe('cat-transport');
    });

    it('ignores collect requests and reminders', () => {
      const request = parser.parse(
        pkg,
        'Collect request',
        'Starbucks has requested ₹450 from you',
        timestamp
      );
      expect(request).toBeNull();
    });
  });

  describe('Paytm Notifications', () => {
    const parser = new PaytmParser();
    const pkg = 'net.one97.paytm';
    const timestamp = Date.now();

    it('successfully parses Paid ₹300 to Swiggy', () => {
      const result = parser.parse(
        pkg,
        'Paid ₹300',
        'Paid ₹300 to Swiggy. Txn ID: 402811223344',
        timestamp
      );

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(300);
      expect(result?.merchant).toBe('Swiggy');
      expect(result?.paymentProvider).toBe('Paytm');
      expect(result?.suggestedCategoryId).toBe('cat-food');
    });

    it('ignores failed payments', () => {
      const failed = parser.parse(
        pkg,
        'Payment Failed',
        'Your payment of ₹300 to Swiggy was declined.',
        timestamp
      );
      expect(failed).toBeNull();
    });
  });

  describe('Generic Bank UPI Debit Notifications', () => {
    const parser = new GenericBankUPIParser();
    const pkg = 'com.snapwork.hdfc';
    const timestamp = Date.now();

    it('extracts HDFC UPI debit notifications', () => {
      const result = parser.parse(
        pkg,
        'HDFC Bank Alert',
        'Rs 450.00 debited from A/C **1234 on 08-Oct towards UPI/Starbucks Coffee. Avl Bal: Rs 15,200',
        timestamp
      );

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(450);
      expect(result?.merchant).toBe('Starbucks Coffee');
      expect(result?.paymentProvider).toBe('HDFC Bank');
      expect(result?.type).toBe('expense');
    });

    it('ignores OTP notifications from banks', () => {
      const otp = parser.parse(
        pkg,
        'HDFC Bank OTP',
        'Your secret OTP for transaction is 492810. Do not share with anyone.',
        timestamp
      );
      expect(otp).toBeNull();
    });

    it('ignores balance enquiries without debits', () => {
      const bal = parser.parse(
        pkg,
        'Account Update',
        'Your available balance is Rs 15,200 as of today.',
        timestamp
      );
      expect(bal).toBeNull();
    });
  });

  describe('UPIDetectionService Helper conversion', () => {
    it('converts DetectedTransaction to Transaction input accurately', () => {
      const detected: DetectedTransaction = {
        id: 'upi-12345',
        amount: 450,
        type: 'expense',
        merchant: 'Starbucks',
        suggestedCategory: 'Food & Dining',
        suggestedCategoryId: 'cat-food',
        paymentMethod: 'UPI',
        paymentProvider: 'Google Pay',
        sourcePackage: 'com.google.android.apps.nbu.paisa.user',
        upiReference: '402812345678',
        transactionTimestamp: 1728373320000,
        createdAt: 1728373320000,
        isAutomaticallyDetected: true,
        detectionConfidence: 0.98,
        rawReferenceHash: 'hash-123',
        status: 'DETECTED',
      };

      const accounts = [
        { id: 'acc-hdfc', name: 'HDFC Bank', type: 'bank' as const, balance: 10000, icon: 'credit-card', color: '#000' },
      ];

      const txInput = UPIDetectionService.convertDetectedToTransactionInput(
        detected,
        DEFAULT_CATEGORIES,
        accounts
      );

      expect(txInput.title).toBe('Starbucks');
      expect(txInput.amount).toBe(450);
      expect(txInput.type).toBe('expense');
      expect(txInput.categoryId).toBe('cat-food');
      expect(txInput.categoryName).toBe('Food & Dining');
      expect(txInput.isAutomaticallyDetected).toBe(true);
      expect(txInput.paymentProvider).toBe('Google Pay');
      expect(txInput.upiReference).toBe('402812345678');
      expect(txInput.accountId).toBe('acc-hdfc');
    });
  });
});
