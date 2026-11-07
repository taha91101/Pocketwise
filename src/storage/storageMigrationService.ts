import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './keys';
import { StorageService } from './storageService';
import { SQLiteStorage } from './sqliteStorage';
import { DetectedTransaction, Transaction } from '../types';

export interface MigrationResult {
  success: boolean;
  transactionsMigrated: number;
  detectedMigrated: number;
  durationMs: number;
  error?: string;
}

export class StorageMigrationService {
  /**
   * Check if one-time SQLite migration has been executed
   */
  public static async isMigrationCompleted(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.SQLITE_MIGRATED);
      return val === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Execute transactional migration from AsyncStorage to SQLite
   */
  public static async runMigration(): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
      // 1. Read existing data from AsyncStorage
      const transactions = await StorageService.getItem<Transaction[]>(
        STORAGE_KEYS.TRANSACTIONS,
        []
      );
      const detected = await StorageService.getItem<DetectedTransaction[]>(
        STORAGE_KEYS.DETECTED_TRANSACTIONS,
        []
      );

      // 2. Create pre-migration backup snapshot
      const backupPayload = JSON.stringify({
        transactions,
        detected,
        backedUpAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.PRE_MIGRATION_BACKUP, backupPayload);

      // 3. Initialize SQLite tables and insert batch
      await SQLiteStorage.initDatabase();

      if (transactions.length > 0) {
        await SQLiteStorage.insertTransactionsBatch(transactions);
      }

      for (const d of detected) {
        await SQLiteStorage.insertDetectedTransaction(d);
      }

      // 4. Verify count matches
      const sqliteCount = await SQLiteStorage.countTransactions();
      if (sqliteCount !== transactions.length) {
        throw new Error(
          `Migration verification failed: expected ${transactions.length} transactions, found ${sqliteCount} in SQLite`
        );
      }

      // 5. Mark migration as confirmed
      await AsyncStorage.setItem(STORAGE_KEYS.SQLITE_MIGRATED, 'true');

      return {
        success: true,
        transactionsMigrated: transactions.length,
        detectedMigrated: detected.length,
        durationMs: Date.now() - startTime,
      };
    } catch (e: any) {
      console.error('SQLite migration failed. Rolling back:', e);
      await this.rollbackMigration();
      return {
        success: false,
        transactionsMigrated: 0,
        detectedMigrated: 0,
        durationMs: Date.now() - startTime,
        error: e?.message || 'Unknown migration error',
      };
    }
  }

  /**
   * Rollback migration on error or user request
   */
  public static async rollbackMigration(): Promise<void> {
    try {
      // 1. Clear SQLite
      await SQLiteStorage.clearAll();

      // 2. Restore AsyncStorage from pre-migration backup if available
      const backupRaw = await AsyncStorage.getItem(STORAGE_KEYS.PRE_MIGRATION_BACKUP);
      if (backupRaw) {
        const backup = JSON.parse(backupRaw);
        if (backup.transactions) {
          await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, backup.transactions);
        }
        if (backup.detected) {
          await StorageService.setItem(STORAGE_KEYS.DETECTED_TRANSACTIONS, backup.detected);
        }
      }

      // 3. Reset migration flag
      await AsyncStorage.setItem(STORAGE_KEYS.SQLITE_MIGRATED, 'false');
    } catch (e) {
      console.error('Error during rollback:', e);
    }
  }
}

