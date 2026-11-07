import { LanguageCode, TRANSLATIONS } from './translations';

export type NumberGroupingFormat = 'lakhs' | 'millions';

export class I18nService {
  /**
   * Get localized string by translation key with fallback to English
   */
  public static t(key: string, lang: LanguageCode = 'en'): string {
    const langDict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    if (langDict[key]) {
      return langDict[key];
    }
    return TRANSLATIONS.en[key] || key;
  }

  /**
   * Format number based on locale grouping system:
   * 'lakhs' -> 1,00,000 (Indian Numbering System)
   * 'millions' -> 100,000 (International Western System)
   */
  public static formatNumber(
    amount: number,
    format: NumberGroupingFormat = 'lakhs',
    maxFractionDigits: number = 0
  ): string {
    const absVal = Math.abs(amount);
    const locale = format === 'millions' ? 'en-US' : 'en-IN';

    try {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: maxFractionDigits > 0 ? maxFractionDigits : 0,
      }).format(absVal);
    } catch {
      return absVal.toLocaleString();
    }
  }

  /**
   * Format currency value with symbol and locale-aware number grouping
   */
  public static formatCurrency(
    amount: number,
    symbol: string = '₹',
    format: NumberGroupingFormat = 'lakhs',
    maxFractionDigits: number = 0
  ): string {
    const isNegative = amount < 0;
    const formattedNum = this.formatNumber(amount, format, maxFractionDigits);
    return `${isNegative ? '-' : ''}${symbol}${formattedNum}`;
  }

  /**
   * Convert an amount between currencies using provided exchange rates table
   * Base normalization rate is 1.0 (relative to primary currency, e.g. INR)
   */
  public static convertCurrency(
    amount: number,
    fromCurrency: string = 'INR',
    toCurrency: string = 'INR',
    exchangeRates: Record<string, number> = {}
  ): number {
    if (fromCurrency === toCurrency || amount === 0) {
      return amount;
    }

    // Default reference exchange rates against INR if not explicitly overridden
    const defaultRatesAgainstINR: Record<string, number> = {
      INR: 1.0,
      USD: 85.5,
      EUR: 92.0,
      GBP: 108.5,
      AED: 23.3,
      CAD: 61.5,
      AUD: 55.0,
      JPY: 0.55,
      SGD: 64.0,
    };

    const rates = { ...defaultRatesAgainstINR, ...exchangeRates };

    const fromRateToINR = rates[fromCurrency] ?? 1.0;
    const toRateToINR = rates[toCurrency] ?? 1.0;

    // Convert to INR base, then to target currency
    const amountInINR = amount * fromRateToINR;
    const converted = amountInINR / toRateToINR;

    return Math.round(converted * 100) / 100;
  }
}

