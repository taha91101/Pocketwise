import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { DetectedTransaction, SupportedPaymentApp, Transaction } from '../types';

const { UPITransactionDetectionModule } = NativeModules;

const eventEmitter =
  Platform.OS === 'android' && UPITransactionDetectionModule
    ? new NativeEventEmitter(UPITransactionDetectionModule)
    : null;

export const DEFAULT_SUPPORTED_APPS: SupportedPaymentApp[] = [
  { packageName: 'com.google.android.apps.nbu.paisa.user', displayName: 'Google Pay', isEnabled: true },
  { packageName: 'com.phonepe.app', displayName: 'PhonePe', isEnabled: true },
  { packageName: 'net.one97.paytm', displayName: 'Paytm', isEnabled: true },
  { packageName: 'in.org.npci.upiapp', displayName: 'BHIM UPI', isEnabled: true },
  { packageName: 'in.amazon.mShop.android.shopping', displayName: 'Amazon Pay', isEnabled: true },
  { packageName: 'com.dreamplug.androidapp', displayName: 'CRED', isEnabled: true },
  { packageName: 'com.snapwork.hdfc', displayName: 'HDFC Bank', isEnabled: true },
  { packageName: 'com.sbi.lotusintouch', displayName: 'SBI YONO', isEnabled: true },
  { packageName: 'com.csam.icici.bank.imobile', displayName: 'ICICI iMobile', isEnabled: true },
  { packageName: 'com.axis.mobile', displayName: 'Axis Mobile', isEnabled: true },
  { packageName: 'com.kotak.mb', displayName: 'Kotak Bank', isEnabled: true },
  { packageName: 'com.samsung.android.spay', displayName: 'Samsung Wallet', isEnabled: true },
];

export class UPIDetectionService {
  /**
   * Check if native module is available
   */
  static isAvailable(): boolean {
    return Platform.OS === 'android' && !!UPITransactionDetectionModule;
  }

  /**
   * Check if Android Notification Access is granted to PocketWise
   */
  static async isNotificationAccessGranted(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await UPITransactionDetectionModule.isNotificationAccessGranted();
    } catch (e) {
      console.warn('Failed to check notification access:', e);
      return false;
    }
  }

  /**
   * Open Android Notification Access settings screen
   */
  static async openNotificationAccessSettings(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await UPITransactionDetectionModule.openNotificationAccessSettings();
    } catch (e) {
      console.warn('Failed to open notification settings:', e);
      return false;
    }
  }

  /**
   * Check if automatic detection is active
   */
  static async isDetectionEnabled(): Promise<boolean> {
    if (!this.isAvailable()) return true;
    try {
      return await UPITransactionDetectionModule.isDetectionEnabled();
    } catch {
      return true;
    }
  }

  /**
   * Toggle automatic detection
   */
  static async setDetectionEnabled(enabled: boolean): Promise<boolean> {
    if (!this.isAvailable()) return true;
    try {
      return await UPITransactionDetectionModule.setDetectionEnabled(enabled);
    } catch {
      return false;
    }
  }

  /**
   * Check if auto-confirm high confidence transactions is enabled
   */
  static async isAutoConfirmEnabled(): Promise<boolean> {
    if (!this.isAvailable()) return true;
    try {
      return await UPITransactionDetectionModule.isAutoConfirmEnabled();
    } catch {
      return true;
    }
  }

  /**
   * Toggle auto-confirm for high confidence transactions
   */
  static async setAutoConfirmEnabled(enabled: boolean): Promise<boolean> {
    if (!this.isAvailable()) return true;
    try {
      return await UPITransactionDetectionModule.setAutoConfirmEnabled(enabled);
    } catch {
      return false;
    }
  }

  /**
   * Get list of supported UPI & Banking payment apps
   */
  static async getSupportedPaymentApps(): Promise<SupportedPaymentApp[]> {
    if (!this.isAvailable()) return DEFAULT_SUPPORTED_APPS;
    try {
      const apps = await UPITransactionDetectionModule.getSupportedPaymentApps();
      return apps && apps.length > 0 ? apps : DEFAULT_SUPPORTED_APPS;
    } catch {
      return DEFAULT_SUPPORTED_APPS;
    }
  }

  /**
   * Fetch detected transactions stored locally by native service
   */
  static async getDetectedTransactions(): Promise<DetectedTransaction[]> {
    if (!this.isAvailable()) return [];
    try {
      const list = await UPITransactionDetectionModule.getDetectedTransactions();
      return (list || []).map((item: any) => ({
        ...item,
        amount: Number(item.amount),
        detectionConfidence: Number(item.detectionConfidence),
        transactionTimestamp: Number(item.transactionTimestamp),
        createdAt: Number(item.createdAt),
      }));
    } catch (e) {
      console.warn('Failed to fetch detected transactions:', e);
      return [];
    }
  }

  /**
   * Mark detected transaction as CONFIRMED in native storage
   */
  static async confirmDetectedTransaction(id: string): Promise<boolean> {
    if (!this.isAvailable()) return true;
    try {
      return await UPITransactionDetectionModule.confirmDetectedTransaction(id);
    } catch {
      return false;
    }
  }

  /**
   * Mark detected transaction as REJECTED in native storage
   */
  static async rejectDetectedTransaction(id: string): Promise<boolean> {
    if (!this.isAvailable()) return true;
    try {
      return await UPITransactionDetectionModule.rejectDetectedTransaction(id);
    } catch {
      return false;
    }
  }

  /**
   * Clear all detected transactions
   */
  static async clearDetectedTransactions(): Promise<boolean> {
    if (!this.isAvailable()) return true;
    try {
      return await UPITransactionDetectionModule.clearDetectedTransactions();
    } catch {
      return false;
    }
  }

  /**
   * Simulate a payment notification (for testing and verification)
   */
  static async simulateNotification(
    packageName: string,
    title: string,
    text: string
  ): Promise<any> {
    if (!this.isAvailable()) {
      throw new Error('UPITransactionDetectionModule is not available on this platform/build');
    }
    return await UPITransactionDetectionModule.simulateTestNotification(packageName, title, text);
  }

  /**
   * Subscribe to native detection events
   */
  static subscribeToDetectionEvents(
    onDetected: (tx: DetectedTransaction) => void,
    onConfirmed?: (id: string) => void,
    onRejected?: (id: string) => void
  ): () => void {
    if (!eventEmitter) return () => {};

    const subs = [
      eventEmitter.addListener('UPI_TRANSACTION_DETECTED', (data: any) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          onDetected({
            ...parsed,
            amount: Number(parsed.amount),
            detectionConfidence: Number(parsed.detectionConfidence),
            transactionTimestamp: Number(parsed.transactionTimestamp),
            createdAt: Number(parsed.createdAt),
          });
        } catch (e) {
          console.error('Error handling UPI_TRANSACTION_DETECTED event:', e);
        }
      }),
    ];

    if (onConfirmed) {
      subs.push(
        eventEmitter.addListener('UPI_TRANSACTION_CONFIRMED', (id: string) => {
          onConfirmed(id);
        })
      );
    }

    if (onRejected) {
      subs.push(
        eventEmitter.addListener('UPI_TRANSACTION_REJECTED', (id: string) => {
          onRejected(id);
        })
      );
    }

    return () => {
      subs.forEach((sub) => sub.remove());
    };
  }

  /**
   * Converts a detected transaction into standard PocketWise transaction input
   */
  static convertDetectedToTransactionInput(
    detected: DetectedTransaction,
    categories: any[],
    accounts: any[],
    edits?: Partial<Transaction>
  ): Omit<Transaction, 'id' | 'createdAt'> {
    // 1. Resolve Category
    const category =
      categories.find((c) => c.id === (edits?.categoryId || detected.suggestedCategoryId)) ||
      categories.find((c) => c.name.toLowerCase() === detected.suggestedCategory.toLowerCase()) ||
      categories.find((c) => c.id === 'cat-other-exp') ||
      categories[0];

    // 2. Resolve Account (Prefer bank or wallet account, or first account)
    const primaryAccount =
      accounts.find((a) => a.id === edits?.accountId) ||
      accounts.find((a) => a.type === 'bank') ||
      accounts.find((a) => a.type === 'wallet') ||
      accounts[0] || {
        id: 'acc-default',
        name: 'Bank Account',
      };

    const dateObj = new Date(detected.transactionTimestamp || Date.now());
    const dateStr = dateObj.toISOString().split('T')[0];
    const timeStr = dateObj.toTimeString().substring(0, 5);

    const refNote = detected.upiReference ? ` • UPI Ref: ${detected.upiReference}` : '';
    const noteText = edits?.notes || `Auto-detected via ${detected.paymentProvider}${refNote}`;

    return {
      title: edits?.title || detected.merchant || 'UPI Payment',
      amount: edits?.amount ?? detected.amount,
      type: (edits?.type || (detected.type === 'income' ? 'income' : 'expense')) as any,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
      date: edits?.date || dateStr,
      time: edits?.time || timeStr,
      accountId: primaryAccount.id,
      accountName: primaryAccount.name,
      paymentMethod: 'UPI',
      merchant: edits?.merchant || detected.merchant,
      paymentProvider: detected.paymentProvider,
      source: 'notification',
      sourcePackage: detected.sourcePackage,
      upiReference: detected.upiReference,
      isAutomaticallyDetected: true,
      detectionConfidence: detected.detectionConfidence,
      rawReferenceHash: detected.rawReferenceHash,
      notes: noteText,
    };
  }
}
