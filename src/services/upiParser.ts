import { DEFAULT_CATEGORIES } from '../constants/categories';
import { DetectedTransaction, DetectionDiagnosticEvent, LearnedMerchantRule } from '../types';

export interface CategoryMatch {
  categoryId: string;
  categoryName: string;
  confidence: number;
}

export class MerchantCategorizer {
  private static DIRECT_MERCHANT_MAP: Record<string, CategoryMatch> = {
    // Food & Dining
    swiggy: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    zomato: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    starbucks: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    mcdonalds: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    kfc: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    dominos: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    burgerking: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    subway: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },
    chaayos: { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.98 },

    // Groceries
    blinkit: { categoryId: 'cat-groceries', categoryName: 'Groceries', confidence: 0.98 },
    zepto: { categoryId: 'cat-groceries', categoryName: 'Groceries', confidence: 0.98 },
    instamart: { categoryId: 'cat-groceries', categoryName: 'Groceries', confidence: 0.98 },
    bigbasket: { categoryId: 'cat-groceries', categoryName: 'Groceries', confidence: 0.98 },
    dmart: { categoryId: 'cat-groceries', categoryName: 'Groceries', confidence: 0.98 },

    // Transport
    uber: { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.98 },
    ola: { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.98 },
    rapido: { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.98 },
    fastag: { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.98 },
    indianoil: { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.95 },
    hpcl: { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.95 },
    shell: { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.95 },

    // Shopping
    amazon: { categoryId: 'cat-shopping', categoryName: 'Shopping', confidence: 0.95 },
    flipkart: { categoryId: 'cat-shopping', categoryName: 'Shopping', confidence: 0.98 },
    myntra: { categoryId: 'cat-shopping', categoryName: 'Shopping', confidence: 0.98 },
    ajio: { categoryId: 'cat-shopping', categoryName: 'Shopping', confidence: 0.98 },
    meesho: { categoryId: 'cat-shopping', categoryName: 'Shopping', confidence: 0.98 },
    nykaa: { categoryId: 'cat-shopping', categoryName: 'Shopping', confidence: 0.98 },

    // Bills & Utilities
    airtel: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.95 },
    jio: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.95 },
    bescom: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.98 },
    adani: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.98 },
    cred: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.95 },

    // Entertainment
    netflix: { categoryId: 'cat-entertainment', categoryName: 'Entertainment', confidence: 0.98 },
    spotify: { categoryId: 'cat-entertainment', categoryName: 'Entertainment', confidence: 0.98 },
    hotstar: { categoryId: 'cat-entertainment', categoryName: 'Entertainment', confidence: 0.98 },
    bookmyshow: { categoryId: 'cat-entertainment', categoryName: 'Entertainment', confidence: 0.98 },
    pvr: { categoryId: 'cat-entertainment', categoryName: 'Entertainment', confidence: 0.98 },

    // Health
    apollo: { categoryId: 'cat-health', categoryName: 'Health & Medical', confidence: 0.95 },
    pharmeasy: { categoryId: 'cat-health', categoryName: 'Health & Medical', confidence: 0.98 },
    '1mg': { categoryId: 'cat-health', categoryName: 'Health & Medical', confidence: 0.98 },
  };

  private static KEYWORD_PATTERNS: Array<[RegExp, CategoryMatch]> = [
    [/\b(restaurant|cafe|coffee|dhaba|baker|bakery|sweets|food|tea|chai|biryani|burger|pizza)\b/i, { categoryId: 'cat-food', categoryName: 'Food & Dining', confidence: 0.88 }],
    [/\b(grocery|supermarket|kirana|provisions|vegetable|fruits|dairy|milk|mart)\b/i, { categoryId: 'cat-groceries', categoryName: 'Groceries', confidence: 0.88 }],
    [/\b(fuel|petrol|diesel|toll|auto|cab|taxi|parking|metro)\b/i, { categoryId: 'cat-transport', categoryName: 'Transport', confidence: 0.88 }],
    [/\b(store|retail|fashion|apparel|clothing|mall|electronics)\b/i, { categoryId: 'cat-shopping', categoryName: 'Shopping', confidence: 0.85 }],
    [/\b(electric|power|water|utility|broadband|wifi|dth|recharge|bill|credit\s*card|card\s*bill|loan|emi|insurance|lic|premium)\b/i, { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.92 }],
    [/\b(cinema|theatre|movies|multiplex|games)\b/i, { categoryId: 'cat-entertainment', categoryName: 'Entertainment', confidence: 0.88 }],
    [/\b(pharmacy|chemist|hospital|clinic|diagnostic|meds|medical|doctor)\b/i, { categoryId: 'cat-health', categoryName: 'Health & Medical', confidence: 0.90 }],
    [/\b(hotel|resort|lodge|airline|flight|railway|train)\b/i, { categoryId: 'cat-travel', categoryName: 'Travel', confidence: 0.88 }],
    [/\b(salary|payroll|stipend|bonus|dividend|interest)\b/i, { categoryId: 'cat-income', categoryName: 'Income', confidence: 0.95 }],
  ];

  static categorize(merchantRaw: string, learnedRules?: LearnedMerchantRule[]): CategoryMatch {
    const clean = this.cleanMerchantName(merchantRaw);
    const normalized = merchantRaw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Learned Merchant Rules take top priority (F2.2)
    if (learnedRules && learnedRules.length > 0) {
      const rawLower = merchantRaw.toLowerCase();
      const cleanLower = clean.toLowerCase();

      for (const rule of learnedRules) {
        const pattern = rule.merchantPattern.trim().toLowerCase();
        if (
          pattern &&
          (rawLower === pattern ||
            cleanLower === pattern ||
            rawLower.includes(pattern) ||
            cleanLower.includes(pattern))
        ) {
          return {
            categoryId: rule.categoryId,
            categoryName: rule.categoryName,
            confidence: 1.0,
          };
        }
      }
    }

    // 2. Direct merchant matches
    for (const [key, match] of Object.entries(this.DIRECT_MERCHANT_MAP)) {
      if (normalized.includes(key)) {
        return match;
      }
    }

    // 3. Keyword heuristic patterns
    for (const [pattern, match] of this.KEYWORD_PATTERNS) {
      if (pattern.test(merchantRaw)) {
        return match;
      }
    }

    return { categoryId: 'cat-other-exp', categoryName: 'Other Expenses', confidence: 0.5 };
  }

  static cleanMerchantName(raw: string): string {
    let clean = raw.trim();

    if (clean.includes('@')) {
      const parts = clean.split('@');
      if (parts[0].length >= 3 && !/^\d+$/.test(parts[0])) {
        clean = parts[0];
      }
    }

    clean = clean.replace(/^(paid to|to|m\/s|vpa:|payee:|sent to)\s+/i, '');
    clean = clean.replace(/\s+(pvt ltd|ltd|limited|private limited|corp|inc)\.?$/i, '');
    clean = clean.replace(/[_.-]+/g, ' ').trim();
    clean = clean.replace(/\s+/g, ' ');

    return (
      clean
        .split(' ')
        .filter(Boolean)
        .map((word) => {
          if (word.length <= 3 && /^[A-Za-z]+$/.test(word) && word === word.toUpperCase()) {
            return word;
          }
          if (word.toLowerCase() === 'dmart') return 'DMart';
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ') || 'Unknown Payee'
    );
  }
}

export abstract class BaseNotificationParser {
  abstract supportedPackages: string[];
  abstract providerName: string;

  /**
   * Inspects notification text and returns ignore reason for diagnostic tracking
   */
  public checkIgnoreReason(
    title: string,
    text: string
  ): { ignorable: boolean; reason?: DetectionDiagnosticEvent['outcome']; explanation?: string } {
    const combined = `${title} ${text}`.toLowerCase();

    // 1. OTP detection
    const otpPatterns = ['otp', 'verification code', 'one time password', 'secret otp', 'do not share'];
    if (otpPatterns.some((p) => combined.includes(p))) {
      return { ignorable: true, reason: 'DROPPED_OTP', explanation: 'Security verification code or OTP' };
    }

    // 2. Failure detection
    const failurePatterns = [
      'failed', 'declined', 'unsuccessful', 'cancelled', 'timed out',
      'could not be processed', 'unable to process', 'pending', 'in progress', 'processing your payment'
    ];
    if (failurePatterns.some((p) => combined.includes(p))) {
      return { ignorable: true, reason: 'DROPPED_FAILURE', explanation: 'Transaction failed, pending, or declined' };
    }

    // 3. Collect & bill requests
    const requestPatterns = [
      'requested', 'request received', 'request from', 'requests money',
      'collect request', 'payment request', 'reminder to pay', 'bill due', 'reminder:'
    ];
    if (requestPatterns.some((p) => combined.includes(p))) {
      return { ignorable: true, reason: 'DROPPED_REQUEST', explanation: 'Collect request or payment reminder' };
    }

    // 4. Marketing & reward noise
    const noisePatterns = [
      'scratch card',
      'cashback of',
      'won cashback',
      'earned cashback',
      'reward points',
      'refer and earn',
      'exclusive offer',
      'discount on',
      'supercash',
      'cashback offer',
      'cashback received',
      'flat cashback',
      'get flat',
    ];
    if (noisePatterns.some((p) => combined.includes(p))) {
      return { ignorable: true, reason: 'DROPPED_NOISE', explanation: 'Promotional offer, cashback, or reward' };
    }

    // 5. Balance inquiries without debit/credit
    if (
      combined.includes('available balance is') &&
      !combined.includes('debited') &&
      !combined.includes('paid') &&
      !combined.includes('credited')
    ) {
      return { ignorable: true, reason: 'DROPPED_NOISE', explanation: 'Pure balance check notification' };
    }

    return { ignorable: false };
  }

  protected isIgnorable(title: string, text: string): boolean {
    return this.checkIgnoreReason(title, text).ignorable;
  }

  protected extractAmount(text: string): number | null {
    const match = /(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i.exec(text);
    if (!match) return null;
    const clean = match[1].replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }

  protected extractAvailableBalance(text: string): number | null {
    const patterns = [
      /(?:avail(?:able)?\s*(?:bal|balance)?|a\/c\s*bal|bal(?:ance)?(?:\s*is)?)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
      /(?:bal|balance)\s*[:\-]?\s*(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i,
    ];
    for (const pat of patterns) {
      const match = pat.exec(text);
      if (match) {
        const clean = match[1].replace(/,/g, '');
        const num = parseFloat(clean);
        if (!isNaN(num)) return num;
      }
    }
    return null;
  }

  protected extractUpiReference(text: string): string | null {
    const patterns = [
      /(?:upi\s*ref(?:erence)?(?:\s*no)?|utr(?:\s*no)?|ref\s*no)\s*[:\-]?\s*([a-zA-Z0-9]{8,24})/i,
      /(?:txn(?:\s*id)?|transaction\s*id)\s*[:\-]?\s*([a-zA-Z0-9]{8,24})/i,
      /\b([0-9]{12})\b/,
    ];
    for (const pat of patterns) {
      const match = pat.exec(text);
      if (match) return match[1];
    }
    return null;
  }

  protected isRefund(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes('refund') || lower.includes('credited as refund');
  }

  protected isIncomingCredit(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      (lower.includes('credited') ||
        lower.includes('received') ||
        lower.includes('deposited') ||
        lower.includes('salary')) &&
      !lower.includes('debited') &&
      !lower.includes('payment to') &&
      !lower.includes('paid to')
    );
  }

  protected buildTransaction(
    packageName: string,
    amount: number,
    merchantRaw: string,
    timestamp: number,
    provider: string,
    title: string,
    text: string,
    confidence: number,
    upiRef?: string | null,
    isRefundTx: boolean = false,
    isCreditTx: boolean = false,
    availableBalance?: number | null,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction {
    const cleanMerchant = MerchantCategorizer.cleanMerchantName(merchantRaw);
    const categoryMatch = MerchantCategorizer.categorize(cleanMerchant, learnedRules);

    const isIncome = isRefundTx || isCreditTx;

    return {
      id: `upi-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      amount,
      type: isIncome ? 'income' : 'expense',
      merchant: cleanMerchant,
      suggestedCategory: isIncome && !categoryMatch ? 'Income' : categoryMatch.categoryName,
      suggestedCategoryId: isIncome && !categoryMatch ? 'cat-income' : categoryMatch.categoryId,
      paymentMethod: 'UPI',
      paymentProvider: provider,
      sourcePackage: packageName,
      upiReference: upiRef || undefined,
      transactionTimestamp: timestamp,
      createdAt: Date.now(),
      isAutomaticallyDetected: true,
      detectionConfidence: Math.min(0.99, Math.max(0.5, confidence * categoryMatch.confidence)),
      rawReferenceHash: `${packageName}_${amount}_${cleanMerchant}_${timestamp}`,
      status: 'DETECTED',
      rawTitleSnippet: title.substring(0, 100),
      rawTextSnippet: text.substring(0, 150),
      notes: isRefundTx
        ? `Refund detected from ${provider}`
        : isCreditTx
        ? `Incoming credit detected via ${provider}`
        : `Auto-detected UPI payment via ${provider}`,
      availableBalance: availableBalance || undefined,
    };
  }

  abstract parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null;
}

export class GooglePayParser extends BaseNotificationParser {
  supportedPackages = ['com.google.android.apps.nbu.paisa.user'];
  providerName = 'Google Pay';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);
    const credit = this.isIncomingCredit(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let merchant = '';
    const patterns = [
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
      /paid\s+to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
      /sent\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
      /(?:₹|rs\.?|inr)[0-9,.]*\s*paid\s+to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
      /received\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*from\s+([^.]+?)(?:\s+in|\.|$)/i,
      /received\s+(?:from\s+)?([^.]+?)(?:\s+in|\.|$)/i,
      /refund\s+(?:of\s+[0-9,.]+\s+)?from\s+([^.]+?)(?:\s+processed|\.|$)/i,
    ];

    for (const source of [title, text, combined]) {
      for (const pat of patterns) {
        const match = pat.exec(source);
        if (match) {
          merchant = match[1].trim();
          break;
        }
      }
      if (merchant) break;
    }

    if (!merchant && combined.toLowerCase().includes('to ')) {
      const parts = combined.split(/\bto\b/i);
      if (parts[1]) merchant = parts[1].split('.')[0].trim();
    }
    if (!merchant) merchant = credit ? 'Google Pay Credit' : 'Google Pay Merchant';

    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);
    const availBal = this.extractAvailableBalance(text) || this.extractAvailableBalance(title);

    const isPayment =
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      combined.toLowerCase().includes('debited') ||
      combined.toLowerCase().includes('successful') ||
      combined.toLowerCase().includes('received') ||
      refund ||
      credit;

    if (!isPayment) return null;

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      merchant !== 'Google Pay Merchant' ? 0.98 : 0.85,
      upiRef,
      refund,
      credit,
      availBal,
      learnedRules
    );
  }
}

export class PhonePeParser extends BaseNotificationParser {
  supportedPackages = ['com.phonepe.app'];
  providerName = 'PhonePe';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);
    const credit = this.isIncomingCredit(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let merchant = '';
    const patterns = [
      /payment\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)\s+successful/i,
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+successful|\.|$)/i,
      /sent\s+to\s+([^.]+?)(?:\s+successful|\.|$)/i,
      /received\s+(?:from\s+)?([^.]+?)(?:\s+successfully|\.|$)/i,
      /refund\s+(?:of\s+[0-9,.]+\s+)?from\s+([^.]+?)(?:\s+credited|\.|$)/i,
    ];

    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }

    if (!merchant) merchant = credit ? 'PhonePe Credit' : 'PhonePe Merchant';
    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);
    const availBal = this.extractAvailableBalance(text) || this.extractAvailableBalance(title);

    const isPayment =
      combined.toLowerCase().includes('successful') ||
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      combined.toLowerCase().includes('debited') ||
      combined.toLowerCase().includes('received') ||
      refund ||
      credit;

    if (!isPayment) return null;

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      merchant !== 'PhonePe Merchant' ? 0.98 : 0.85,
      upiRef,
      refund,
      credit,
      availBal,
      learnedRules
    );
  }
}

export class PaytmParser extends BaseNotificationParser {
  supportedPackages = ['net.one97.paytm'];
  providerName = 'Paytm';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);
    const credit = this.isIncomingCredit(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let merchant = '';
    const patterns = [
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+at|\s+using|\.|$)/i,
      /sent\s+to\s+([^.]+?)(?:\s+successfully|\.|$)/i,
      /received\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*(?:in|from)\s+([^.]+?)(?:\s+a\/c|\.|$)/i,
      /refund\s+(?:of\s+[0-9,.]+\s+)?from\s+([^.]+?)(?:\s+credited|\.|$)/i,
    ];

    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }

    if (!merchant) merchant = credit ? 'Paytm Credit' : 'Paytm Merchant';
    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);
    const availBal = this.extractAvailableBalance(text) || this.extractAvailableBalance(title);

    const isPayment =
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      combined.toLowerCase().includes('successful') ||
      combined.toLowerCase().includes('received') ||
      combined.toLowerCase().includes('debited') ||
      refund ||
      credit;

    if (!isPayment) return null;

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      merchant !== 'Paytm Merchant' ? 0.98 : 0.85,
      upiRef,
      refund,
      credit,
      availBal,
      learnedRules
    );
  }
}

export class NaviParser extends BaseNotificationParser {
  supportedPackages = ['com.navi.mutualfunds', 'com.naviapps'];
  providerName = 'Navi';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    const patterns = [
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+via|\.|$)/i,
      /sent\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+via|\.|$)/i,
      /transfer\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+successful|\s+using|\.|$)/i,
    ];

    let merchant = '';
    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }
    if (!merchant) merchant = 'Navi Payee';

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      0.95,
      this.extractUpiReference(text),
      false,
      false,
      this.extractAvailableBalance(text),
      learnedRules
    );
  }
}

export class SliceParser extends BaseNotificationParser {
  supportedPackages = ['indwin.c3.app', 'indwin.c3.sharee'];
  providerName = 'Slice';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    const patterns = [
      /spent\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*(?:at|on)\s+([^.]+?)(?:\s+with|\s+using|\.|$)/i,
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*(?:at|to)\s+([^.]+?)(?:\s+with|\s+using|\.|$)/i,
      /transaction\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*at\s+([^.]+?)\s+approved/i,
    ];

    let merchant = '';
    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }
    if (!merchant) merchant = 'Slice Payee';

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      0.95,
      this.extractUpiReference(text),
      false,
      false,
      this.extractAvailableBalance(text),
      learnedRules
    );
  }
}

export class MobiKwikParser extends BaseNotificationParser {
  supportedPackages = ['com.mobikwik_new'];
  providerName = 'MobiKwik';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    const patterns = [
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+on|\s+using|\.|$)/i,
      /payment\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+successful|\s+on|\.|$)/i,
    ];

    let merchant = '';
    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }
    if (!merchant) merchant = 'MobiKwik Payee';

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      0.95,
      this.extractUpiReference(text),
      false,
      false,
      this.extractAvailableBalance(text),
      learnedRules
    );
  }
}

export class FreechargeParser extends BaseNotificationParser {
  supportedPackages = ['com.freecharge.android'];
  providerName = 'Freecharge';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    const patterns = [
      /payment\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+successful|\s+on|\.|$)/i,
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+on|\s+via|\.|$)/i,
      /transaction\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)\s+successful/i,
    ];

    let merchant = '';
    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }
    if (!merchant) merchant = 'Freecharge Payee';

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      0.95,
      this.extractUpiReference(text),
      false,
      false,
      this.extractAvailableBalance(text),
      learnedRules
    );
  }
}

export class JupiterParser extends BaseNotificationParser {
  supportedPackages = ['money.jupiter'];
  providerName = 'Jupiter';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);
    const credit = this.isIncomingCredit(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    const patterns = [
      /spent\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*(?:at|on)\s+([^.]+?)(?:\s+using|\.|$)/i,
      /debited\s+(?:for\s+)?(?:₹|rs\.?|inr)?[0-9,.]*\s*(?:for\s+upi\s+transfer\s+to|to)\s+([^.]+?)(?:\s+via|\.|$)/i,
      /salary\s+credited\s*:\s*(?:₹|rs\.?|inr)?[0-9,.]*\s*(?:deposited\s+to\s+)?([^.]+?)(?:\s+account|\.|$)/i,
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+via|\.|$)/i,
    ];

    let merchant = '';
    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }
    if (!merchant) merchant = credit ? 'Jupiter Salary' : 'Jupiter Payee';

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      0.95,
      this.extractUpiReference(text),
      refund,
      credit,
      this.extractAvailableBalance(text),
      learnedRules
    );
  }
}

export class FiParser extends BaseNotificationParser {
  supportedPackages = ['co.fi.money', 'co.fipay'];
  providerName = 'Fi Money';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);
    const credit = this.isIncomingCredit(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    const patterns = [
      /sent\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+via|\.|$)/i,
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+via|\.|$)/i,
      /debited\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*for\s+([^.]+?)(?:\s+using|\.|$)/i,
    ];

    let merchant = '';
    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }
    if (!merchant) merchant = credit ? 'Fi Money Credit' : 'Fi Payee';

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      0.95,
      this.extractUpiReference(text),
      refund,
      credit,
      this.extractAvailableBalance(text),
      learnedRules
    );
  }
}

export class CredParser extends BaseNotificationParser {
  supportedPackages = ['com.dreamplug.androidapp'];
  providerName = 'CRED';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    const patterns = [
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*(?:towards|at|to)\s+([^.]+?)(?:\s+bill|\s+on|\s+via|\.|$)/i,
      /payment\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)\s+successful/i,
    ];

    let merchant = '';
    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }
    if (!merchant) merchant = 'CRED Payee';

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      this.providerName,
      title,
      text,
      0.95,
      this.extractUpiReference(text),
      false,
      false,
      this.extractAvailableBalance(text),
      learnedRules
    );
  }
}

export class GenericBankUPIParser extends BaseNotificationParser {
  supportedPackages = [
    'com.snapwork.hdfc',
    'com.sbi.upi',
    'com.sbi.lotusintouch',
    'com.csam.icici.bank.imobile',
    'com.axis.mobile',
    'com.kotak.mb',
    'com.samsung.android.spay',
    'com.idfcfirstbank.optimus',
    'com.yesbank',
    'com.fedmobile',
    'com.pnb.one',
    'com.canarabank.mobility',
    'com.infrasofttech.uboi',
    'com.bob.bobworld',
    'com.indusind.mobile',
  ];
  providerName = 'Bank UPI';

  parse(
    packageName: string,
    title: string,
    text: string,
    timestamp: number,
    learnedRules?: LearnedMerchantRule[]
  ): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);
    const credit = this.isIncomingCredit(combined);

    const isDebit =
      combined.toLowerCase().includes('debited') ||
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      refund ||
      credit;

    if (!isDebit) return null;

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let bankName = 'Bank UPI';
    const lowerPkg = packageName.toLowerCase();
    const lowerComb = combined.toLowerCase();

    if (lowerPkg.includes('hdfc') || lowerComb.includes('hdfc')) bankName = 'HDFC Bank';
    else if (lowerPkg.includes('sbi') || lowerComb.includes('sbi')) bankName = 'SBI';
    else if (lowerPkg.includes('icici') || lowerComb.includes('icici')) bankName = 'ICICI Bank';
    else if (lowerPkg.includes('axis') || lowerComb.includes('axis')) bankName = 'Axis Bank';
    else if (lowerPkg.includes('kotak') || lowerComb.includes('kotak')) bankName = 'Kotak Bank';
    else if (lowerPkg.includes('idfc') || lowerComb.includes('idfc')) bankName = 'IDFC FIRST Bank';
    else if (lowerPkg.includes('yesbank') || lowerComb.includes('yes bank')) bankName = 'YES Bank';
    else if (lowerPkg.includes('fedmobile') || lowerComb.includes('federal')) bankName = 'Federal Bank';
    else if (lowerPkg.includes('pnb') || lowerComb.includes('pnb')) bankName = 'PNB';
    else if (lowerPkg.includes('canara') || lowerComb.includes('canara')) bankName = 'Canara Bank';
    else if (lowerPkg.includes('uboi') || lowerComb.includes('union bank')) bankName = 'Union Bank';
    else if (lowerPkg.includes('bob') || lowerComb.includes('bob')) bankName = 'Bank of Baroda';
    else if (lowerPkg.includes('indusind') || lowerComb.includes('indusind')) bankName = 'IndusInd Bank';

    let merchant = '';
    if (lowerComb.includes('atm')) {
      merchant = 'ATM Cash Withdrawal';
    } else {
      const patterns = [
        /transfer\s+to\s+([^.]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
        /(?:at|to)\s+([^.]+?)(?:\s+on\s+[0-9]{2}|\s+ref|\s+avl|\s+bal|\.|$)/i,
        /(?:towards\s+upi[/-]|towards|to|info\s*:?\s*upi[/-])\s*([A-Za-z0-9 &._'-]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
        /vpa\s+([A-Za-z0-9 &._'-]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
        /paid\s+to\s+([^.]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
        /received\s+(?:from\s+)?([A-Za-z0-9 &._'-]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
      ];

      for (const source of [title, text, combined]) {
        for (const pat of patterns) {
          const match = pat.exec(source);
          if (match) {
            let cand = match[1].trim();
            cand = cand.replace(/^upi[/-]/i, '').trim();
            if (cand.length >= 3 && !cand.toLowerCase().startsWith('ac')) {
              merchant = cand;
              break;
            }
          }
        }
        if (merchant) break;
      }
    }

    if (!merchant) merchant = `${bankName} Payee`;
    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);
    const availBal = this.extractAvailableBalance(text) || this.extractAvailableBalance(title);

    return this.buildTransaction(
      packageName,
      amount,
      merchant,
      timestamp,
      bankName,
      title,
      text,
      merchant.includes('Payee') ? 0.85 : 0.92,
      upiRef,
      refund,
      credit,
      availBal,
      learnedRules
    );
  }
}

/**
 * Main parser engine coordinating all app-specific parsers and diagnostics logging.
 */
export class UPIParserEngine {
  private static parsers: BaseNotificationParser[] = [
    new GooglePayParser(),
    new PhonePeParser(),
    new PaytmParser(),
    new NaviParser(),
    new SliceParser(),
    new MobiKwikParser(),
    new FreechargeParser(),
    new JupiterParser(),
    new FiParser(),
    new CredParser(),
    new GenericBankUPIParser(),
  ];

  static getAllSupportedPackages(): string[] {
    const set = new Set<string>();
    this.parsers.forEach((p) => p.supportedPackages.forEach((pkg) => set.add(pkg)));
    return Array.from(set);
  }

  static parseNotification(
    packageName: string,
    title: string,
    text: string,
    timestamp: number = Date.now(),
    learnedRules?: LearnedMerchantRule[]
  ): { transaction: DetectedTransaction | null; diagnostic: DetectionDiagnosticEvent } {
    const id = `diag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const baseDiagnostic: Omit<DetectionDiagnosticEvent, 'outcome' | 'reason'> = {
      id,
      timestamp,
      packageName,
      titleSnippet: title.substring(0, 100),
      textSnippet: text.substring(0, 150),
    };

    // 1. Find matching parser by package
    const parser = this.parsers.find((p) => p.supportedPackages.includes(packageName));
    if (!parser) {
      return {
        transaction: null,
        diagnostic: {
          ...baseDiagnostic,
          outcome: 'DROPPED_UNSUPPORTED',
          reason: `Package ${packageName} is not in the supported payment app registry`,
        },
      };
    }

    // 2. Check if notification is ignorable
    const ignoreCheck = parser.checkIgnoreReason(title, text);
    if (ignoreCheck.ignorable && ignoreCheck.reason) {
      return {
        transaction: null,
        diagnostic: {
          ...baseDiagnostic,
          outcome: ignoreCheck.reason,
          reason: ignoreCheck.explanation || 'Filtered out by noise detection patterns',
        },
      };
    }

    // 3. Attempt parsing
    const tx = parser.parse(packageName, title, text, timestamp, learnedRules);
    if (tx) {
      return {
        transaction: tx,
        diagnostic: {
          ...baseDiagnostic,
          outcome: 'DETECTED',
          reason: `Successfully parsed as ${tx.paymentProvider} ${tx.type}`,
          parsedAmount: tx.amount,
          parsedMerchant: tx.merchant,
        },
      };
    }

    return {
      transaction: null,
      diagnostic: {
        ...baseDiagnostic,
        outcome: 'DROPPED_FAILURE',
        reason: 'Notification content could not be parsed as a valid financial debit or credit',
      },
    };
  }
}
