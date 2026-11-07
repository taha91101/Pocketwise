import { DEFAULT_CATEGORIES } from '../constants/categories';
import { DetectedTransaction } from '../types';

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

    // Bills
    airtel: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.95 },
    jio: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.95 },
    bescom: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.98 },
    adani: { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.98 },

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
    [/\b(electric|power|water|utility|broadband|wifi|dth|recharge|bill)\b/i, { categoryId: 'cat-bills', categoryName: 'Bills & Utilities', confidence: 0.90 }],
    [/\b(cinema|theatre|movies|multiplex|games)\b/i, { categoryId: 'cat-entertainment', categoryName: 'Entertainment', confidence: 0.88 }],
    [/\b(pharmacy|chemist|hospital|clinic|diagnostic|meds|medical|doctor)\b/i, { categoryId: 'cat-health', categoryName: 'Health & Medical', confidence: 0.90 }],
    [/\b(hotel|resort|lodge|airline|flight|railway|train)\b/i, { categoryId: 'cat-travel', categoryName: 'Travel', confidence: 0.88 }],
  ];

  static categorize(merchantRaw: string): CategoryMatch {
    const normalized = merchantRaw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const [key, match] of Object.entries(this.DIRECT_MERCHANT_MAP)) {
      if (normalized.includes(key)) {
        return match;
      }
    }

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

    return clean
      .split(' ')
      .filter(Boolean)
      .map((word) => {
        if (word.length <= 3 && /^[A-Za-z]+$/.test(word) && word === word.toUpperCase()) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ') || 'Unknown Payee';
  }
}

export abstract class BaseNotificationParser {
  abstract supportedPackages: string[];
  abstract providerName: string;

  protected isIgnorable(title: string, text: string): boolean {
    const combined = `${title} ${text}`.toLowerCase();

    const failurePatterns = [
      'failed', 'declined', 'unsuccessful', 'cancelled', 'timed out',
      'could not be processed', 'unable to process', 'pending', 'in progress', 'processing your payment'
    ];
    if (failurePatterns.some((p) => combined.includes(p))) return true;

    const requestPatterns = [
      'requested', 'request received', 'request from', 'requests money',
      'collect request', 'payment request', 'reminder to pay', 'bill due', 'reminder:'
    ];
    if (requestPatterns.some((p) => combined.includes(p))) return true;

    const noisePatterns = [
      'scratch card', 'cashback of', 'won cashback', 'earned cashback',
      'reward points', 'refer and earn', 'exclusive offer', 'discount on',
      'otp', 'verification code', 'one time password', 'secret otp', 'do not share'
    ];
    if (noisePatterns.some((p) => combined.includes(p))) return true;

    if (combined.includes('available balance is') && !combined.includes('debited') && !combined.includes('paid')) {
      return true;
    }

    return false;
  }

  protected extractAmount(text: string): number | null {
    const match = /(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i.exec(text);
    if (!match) return null;
    const clean = match[1].replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
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
    isRefundTx: boolean = false
  ): DetectedTransaction {
    const cleanMerchant = MerchantCategorizer.cleanMerchantName(merchantRaw);
    const categoryMatch = MerchantCategorizer.categorize(cleanMerchant);

    return {
      id: `upi-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      amount,
      type: isRefundTx ? 'income' : 'expense',
      merchant: cleanMerchant,
      suggestedCategory: categoryMatch.categoryName,
      suggestedCategoryId: categoryMatch.categoryId,
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
      notes: isRefundTx ? `Refund detected from ${provider}` : `Auto-detected UPI payment via ${provider}`,
    };
  }

  abstract parse(packageName: string, title: string, text: string, timestamp: number): DetectedTransaction | null;
}

export class GooglePayParser extends BaseNotificationParser {
  supportedPackages = ['com.google.android.apps.nbu.paisa.user'];
  providerName = 'Google Pay';

  parse(packageName: string, title: string, text: string, timestamp: number): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let merchant = '';
    const patterns = [
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
      /paid\s+to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
      /sent\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
      /(?:₹|rs\.?|inr)[0-9,.]*\s*paid\s+to\s+([^.]+?)(?:\s+using|\s+from|\.|$)/i,
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
    if (!merchant) merchant = 'Google Pay Merchant';

    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);
    const isPayment =
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      combined.toLowerCase().includes('debited') ||
      combined.toLowerCase().includes('successful') ||
      refund;

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
      refund
    );
  }
}

export class PhonePeParser extends BaseNotificationParser {
  supportedPackages = ['com.phonepe.app'];
  providerName = 'PhonePe';

  parse(packageName: string, title: string, text: string, timestamp: number): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let merchant = '';
    const patterns = [
      /payment\s+of\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)\s+successful/i,
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+successful|\.|$)/i,
      /sent\s+to\s+([^.]+?)(?:\s+successful|\.|$)/i,
      /refund\s+(?:of\s+[0-9,.]+\s+)?from\s+([^.]+?)(?:\s+credited|\.|$)/i,
    ];

    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }

    if (!merchant) merchant = 'PhonePe Merchant';
    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);

    const isPayment =
      combined.toLowerCase().includes('successful') ||
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      refund;

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
      refund
    );
  }
}

export class PaytmParser extends BaseNotificationParser {
  supportedPackages = ['net.one97.paytm'];
  providerName = 'Paytm';

  parse(packageName: string, title: string, text: string, timestamp: number): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let merchant = '';
    const patterns = [
      /paid\s+(?:₹|rs\.?|inr)?[0-9,.]*\s*to\s+([^.]+?)(?:\s+at|\s+using|\.|$)/i,
      /sent\s+to\s+([^.]+?)(?:\s+successfully|\.|$)/i,
      /refund\s+(?:of\s+[0-9,.]+\s+)?from\s+([^.]+?)(?:\s+credited|\.|$)/i,
    ];

    for (const pat of patterns) {
      const match = pat.exec(combined);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }

    if (!merchant) merchant = 'Paytm Merchant';
    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);

    const isPayment =
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      combined.toLowerCase().includes('successful') ||
      refund;

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
      refund
    );
  }
}

export class GenericBankUPIParser extends BaseNotificationParser {
  supportedPackages = [
    'com.snapwork.hdfc',
    'com.sbi.lotusintouch',
    'com.csam.icici.bank.imobile',
    'com.axis.mobile',
    'com.kotak.mb',
    'com.samsung.android.spay',
  ];
  providerName = 'Bank UPI';

  parse(packageName: string, title: string, text: string, timestamp: number): DetectedTransaction | null {
    if (this.isIgnorable(title, text)) return null;
    const combined = `${title} ${text}`;
    const refund = this.isRefund(combined);

    const isDebit =
      combined.toLowerCase().includes('debited') ||
      combined.toLowerCase().includes('paid') ||
      combined.toLowerCase().includes('sent') ||
      refund;

    if (!isDebit) return null;

    const amount = this.extractAmount(title) || this.extractAmount(text);
    if (!amount) return null;

    let bankName = 'Bank UPI';
    if (packageName.includes('hdfc') || combined.toLowerCase().includes('hdfc')) bankName = 'HDFC Bank';
    else if (packageName.includes('sbi') || combined.toLowerCase().includes('sbi')) bankName = 'SBI';
    else if (packageName.includes('icici') || combined.toLowerCase().includes('icici')) bankName = 'ICICI Bank';
    else if (packageName.includes('axis') || combined.toLowerCase().includes('axis')) bankName = 'Axis Bank';
    else if (packageName.includes('kotak') || combined.toLowerCase().includes('kotak')) bankName = 'Kotak Bank';

    let merchant = '';
    const patterns = [
      /(?:towards\s+upi[/-]|towards|to|info\s*:?\s*upi[/-])\s*([A-Za-z0-9 &._'-]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /vpa\s+([A-Za-z0-9 &._'-]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
      /paid\s+to\s+([^.]+?)(?:\s+on|\s+ref|\s+avl|\s+bal|\.|$)/i,
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

    if (!merchant) merchant = `${bankName} Payee`;
    const upiRef = this.extractUpiReference(text) || this.extractUpiReference(title);

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
      refund
    );
  }
}
