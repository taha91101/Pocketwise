import { Account, Budget, RecurringPayment, SavingsGoal, Transaction, UserSettings } from '../types';

export interface AppExportData {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringPayments: RecurringPayment[];
  settings?: UserSettings;
}

export class ExportImportService {
  /**
   * Generate clean JSON export string
   */
  public static exportToJSON(data: AppExportData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate standard CSV for transactions
   */
  public static exportTransactionsToCSV(transactions: Transaction[]): string {
    const headers = ['ID', 'Date', 'Time', 'Title', 'Type', 'Category', 'Amount', 'Account', 'Payment Method', 'Notes'];
    const rows = transactions.map((tx) => [
      `"${tx.id}"`,
      `"${tx.date ? tx.date.split('T')[0] : ''}"`,
      `"${tx.time || ''}"`,
      `"${(tx.title || '').replace(/"/g, '""')}"`,
      `"${tx.type}"`,
      `"${(tx.categoryName || '').replace(/"/g, '""')}"`,
      tx.amount,
      `"${(tx.accountName || '').replace(/"/g, '""')}"`,
      `"${(tx.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Validate and parse incoming JSON backup
   */
  public static validateAndParseImportJSON(jsonString: string): {
    isValid: boolean;
    data?: AppExportData;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, error: 'Uploaded file is not a valid JSON object' };
      }

      if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.accounts)) {
        return { isValid: false, error: 'JSON is missing required transactions or accounts arrays' };
      }

      // Basic validation for accounts and transactions
      for (const acc of parsed.accounts) {
        if (!acc.id || !acc.name || typeof acc.balance !== 'number') {
          return { isValid: false, error: 'One or more accounts have invalid properties' };
        }
      }

      for (const tx of parsed.transactions) {
        if (!tx.id || !tx.title || typeof tx.amount !== 'number' || !tx.type) {
          return { isValid: false, error: 'One or more transactions have invalid properties' };
        }
      }

      const validData: AppExportData = {
        version: parsed.version || '1.0.0',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        transactions: parsed.transactions,
        accounts: parsed.accounts,
        budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
        savingsGoals: Array.isArray(parsed.savingsGoals) ? parsed.savingsGoals : [],
        recurringPayments: Array.isArray(parsed.recurringPayments) ? parsed.recurringPayments : [],
        settings: parsed.settings,
      };

      return { isValid: true, data: validData };
    } catch (e: any) {
      return { isValid: false, error: `JSON Parse error: ${e?.message || 'Invalid format'}` };
    }
  }
}
