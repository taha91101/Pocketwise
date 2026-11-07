import { UPIParserEngine, MerchantCategorizer } from '../services/upiParser';
import { LearnedMerchantRule } from '../types';

describe('UPIParserEngine & Detection Fixtures (F2.1 & F2.2)', () => {
  describe('Google Pay (com.google.android.apps.nbu.paisa.user)', () => {
    const pkg = 'com.google.android.apps.nbu.paisa.user';

    it('parses standard debit with merchant correctly', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Google Pay',
        'Paid ₹450 to Starbucks'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction).not.toBeNull();
      expect(res.transaction?.amount).toBe(450);
      expect(res.transaction?.merchant).toBe('Starbucks');
      expect(res.transaction?.type).toBe('expense');
      expect(res.transaction?.suggestedCategory).toBe('Food & Dining');
      expect(res.transaction?.paymentProvider).toBe('Google Pay');
    });

    it('parses decimal amounts and comma formatting with grocery merchant', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Payment successful',
        'You paid ₹1,250.75 to DMart'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(1250.75);
      expect(res.transaction?.merchant).toBe('DMart');
      expect(res.transaction?.suggestedCategory).toBe('Groceries');
    });

    it('parses incoming credit/refund', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Money received',
        'Received ₹2,500 from Rahul Sharma'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(2500);
      expect(res.transaction?.type).toBe('income');
    });

    it('drops OTP verification notifications as DROPPED_OTP', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Google Pay',
        'Your Google verification code is 482910. Do not share this OTP with anyone.'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_OTP');
    });

    it('drops collect / payment requests as DROPPED_REQUEST', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Payment request',
        'John Doe requested ₹500 from you on Google Pay'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_REQUEST');
    });

    it('drops marketing / rewards noise as DROPPED_NOISE', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Rewards',
        'You won a scratch card! Tap to reveal your reward'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_NOISE');
    });

    it('drops failed transactions as DROPPED_FAILURE', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Payment failed',
        'Payment of ₹300 to Swiggy failed. Any money debited will be refunded.'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_FAILURE');
    });
  });

  describe('PhonePe (com.phonepe.app)', () => {
    const pkg = 'com.phonepe.app';

    it('parses debit and extracts available balance', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Paid to Swiggy',
        '₹320 debited from Bank A/c **4567. Avl Bal: ₹12,450.00. Ref 123456789012'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(320);
      expect(res.transaction?.availableBalance).toBe(12450);
      expect(res.transaction?.paymentProvider).toBe('PhonePe');
    });

    it('drops promotional cashbacks and recharge reminders as DROPPED_NOISE', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Cashback offer',
        'Recharge your mobile now and get flat ₹50 cashback!'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_NOISE');
    });

    it('drops payment requests as DROPPED_REQUEST', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Payment request',
        'Aman sent you a collect request for ₹1,000'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_REQUEST');
    });
  });

  describe('Paytm (net.one97.paytm)', () => {
    const pkg = 'net.one97.paytm';

    it('parses merchant payment via Paytm UPI', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Paytm UPI',
        'Paid ₹180 to Chaayos at Cyber Hub'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(180);
      expect(res.transaction?.suggestedCategory).toBe('Food & Dining');
      expect(res.transaction?.paymentProvider).toBe('Paytm');
    });

    it('parses incoming payments to Paytm account', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Paytm Payment Received',
        'Received ₹5,000 in your Paytm Payments Bank A/c'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(5000);
      expect(res.transaction?.type).toBe('income');
    });
  });

  describe('Navi (com.navi.mutualfunds)', () => {
    const pkg = 'com.navi.mutualfunds';

    it('parses payment with available balance', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Navi UPI',
        'Paid ₹650 to Apollo Pharmacy using Navi UPI. Debited from A/c XX1234. Avl Bal: ₹8,400'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(650);
      expect(res.transaction?.merchant).toBe('Apollo Pharmacy');
      expect(res.transaction?.suggestedCategory).toBe('Health & Medical');
      expect(res.transaction?.availableBalance).toBe(8400);
      expect(res.transaction?.paymentProvider).toBe('Navi');
    });
  });

  describe('Slice (indwin.c3.app)', () => {
    const pkg = 'indwin.c3.app';

    it('parses spent notification', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Slice',
        'You spent ₹420 at Burger King with your Slice card'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(420);
      expect(res.transaction?.merchant).toBe('Burger King');
      expect(res.transaction?.suggestedCategory).toBe('Food & Dining');
      expect(res.transaction?.paymentProvider).toBe('Slice');
    });
  });

  describe('MobiKwik (com.mobikwik_new)', () => {
    const pkg = 'com.mobikwik_new';

    it('parses payment notification', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'MobiKwik Payment',
        'Paid ₹499 to Netflix on MobiKwik'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(499);
      expect(res.transaction?.merchant).toBe('Netflix');
      expect(res.transaction?.suggestedCategory).toBe('Entertainment');
      expect(res.transaction?.paymentProvider).toBe('MobiKwik');
    });

    it('drops SuperCash noise', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Save more!',
        'Get 10% SuperCash on your electricity bill'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_NOISE');
    });
  });

  describe('Freecharge (com.freecharge.android)', () => {
    const pkg = 'com.freecharge.android';

    it('parses successful payment', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Freecharge',
        'Payment of ₹750 to Zomato successful'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(750);
      expect(res.transaction?.merchant).toBe('Zomato');
      expect(res.transaction?.paymentProvider).toBe('Freecharge');
    });
  });

  describe('Jupiter (money.jupiter)', () => {
    const pkg = 'money.jupiter';

    it('parses debit with balance extraction', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Jupiter',
        'Spent ₹1,420 at Blinkit using Jupiter debit card. Balance: ₹32,100'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(1420);
      expect(res.transaction?.availableBalance).toBe(32100);
      expect(res.transaction?.suggestedCategory).toBe('Groceries');
      expect(res.transaction?.paymentProvider).toBe('Jupiter');
    });

    it('parses salary credit', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Salary Credited',
        'Salary credited: ₹75,000 deposited to your Jupiter account'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(75000);
      expect(res.transaction?.type).toBe('income');
    });
  });

  describe('Fi Money (co.fi.money)', () => {
    const pkg = 'co.fi.money';

    it('parses debit with balance extraction', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'Fi Money',
        'Sent ₹450 to Uber using Fi Money. Avl Bal: ₹9,850'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(450);
      expect(res.transaction?.suggestedCategory).toBe('Transport');
      expect(res.transaction?.availableBalance).toBe(9850);
      expect(res.transaction?.paymentProvider).toBe('Fi Money');
    });
  });

  describe('CRED (com.dreamplug.androidapp)', () => {
    const pkg = 'com.dreamplug.androidapp';

    it('parses card bill payment', () => {
      const res = UPIParserEngine.parseNotification(
        pkg,
        'CRED Bill Payment',
        'Paid ₹15,400 towards HDFC Credit Card bill on CRED'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(15400);
      expect(res.transaction?.paymentProvider).toBe('CRED');
      expect(res.transaction?.suggestedCategory).toBe('Bills & Utilities');
    });
  });

  describe('Generic Banking UPI (HDFC, SBI, ICICI, Axis, etc.)', () => {
    it('parses HDFC bank debit SMS/notification with balance', () => {
      const res = UPIParserEngine.parseNotification(
        'com.snapwork.hdfc',
        'HDFC Bank Alert',
        'Dear Customer, ₹3,500.00 debited from a/c **4321 on 07-NOV-26 to Blinkit. Avail bal: INR 52,140.20'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(3500);
      expect(res.transaction?.availableBalance).toBe(52140.2);
      expect(res.transaction?.suggestedCategory).toBe('Groceries');
      expect(res.transaction?.paymentProvider).toBe('HDFC Bank');
    });

    it('parses SBI bank debit notification with balance', () => {
      const res = UPIParserEngine.parseNotification(
        'com.sbi.upi',
        'SBI UPI',
        'A/c *1234 debited by ₹750.00 on 07Nov26 transfer to Ola Cabs. Bal: ₹6,300'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(750);
      expect(res.transaction?.availableBalance).toBe(6300);
      expect(res.transaction?.suggestedCategory).toBe('Transport');
      expect(res.transaction?.paymentProvider).toBe('SBI');
    });

    it('parses ICICI bank debit notification with balance', () => {
      const res = UPIParserEngine.parseNotification(
        'com.csam.icici.bank.imobile',
        'iMobile Pay',
        'Acct XX9876 debited with INR 2,200.00 on 07-Nov-26. Info: UPI-Myntra. Avl Bal: INR 12,050.00'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(2200);
      expect(res.transaction?.availableBalance).toBe(12050);
      expect(res.transaction?.suggestedCategory).toBe('Shopping');
      expect(res.transaction?.paymentProvider).toBe('ICICI Bank');
    });

    it('parses ATM cash withdrawal', () => {
      const res = UPIParserEngine.parseNotification(
        'com.snapwork.hdfc',
        'HDFC Bank Alert',
        'INR 5,000 debited from A/c XX4321 at HDFC ATM on 07-Nov-26. Avl Bal: INR 47,140'
      );
      expect(res.diagnostic.outcome).toBe('DETECTED');
      expect(res.transaction?.amount).toBe(5000);
      expect(res.transaction?.availableBalance).toBe(47140);
      expect(res.transaction?.merchant).toMatch(/ATM/i);
    });

    it('drops unsupported packages as DROPPED_UNSUPPORTED', () => {
      const res = UPIParserEngine.parseNotification(
        'com.random.unsupported.app',
        'Test Title',
        'Test message with ₹500'
      );
      expect(res.transaction).toBeNull();
      expect(res.diagnostic.outcome).toBe('DROPPED_UNSUPPORTED');
    });
  });

  describe('Learned Merchant Rules (F2.2)', () => {
    it('applies learned merchant rule over built-in category', () => {
      const learnedRules: LearnedMerchantRule[] = [
        {
          id: 'rule-1',
          merchantPattern: 'Starbucks',
          categoryId: 'cat-work',
          categoryName: 'Business & Work',
          createdAt: new Date().toISOString(),
        },
      ];

      // Without rule: Starbucks -> Food & Dining
      const defaultMatch = MerchantCategorizer.categorize('Starbucks');
      expect(defaultMatch.categoryName).toBe('Food & Dining');

      // With rule: Starbucks -> Business & Work
      const customMatch = MerchantCategorizer.categorize('Starbucks', learnedRules);
      expect(customMatch.categoryName).toBe('Business & Work');
      expect(customMatch.confidence).toBe(1.0);

      // Verify parseNotification integrates learned rules
      const res = UPIParserEngine.parseNotification(
        'com.google.android.apps.nbu.paisa.user',
        'Google Pay',
        'Paid ₹450 to Starbucks',
        Date.now(),
        learnedRules
      );
      expect(res.transaction?.suggestedCategoryId).toBe('cat-work');
      expect(res.transaction?.suggestedCategory).toBe('Business & Work');
    });
  });
});
