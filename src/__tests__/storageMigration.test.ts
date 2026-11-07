import { StorageMigrationService } from '../storage/storageMigrationService';
import { SQLiteStorage } from '../storage/sqliteStorage';
import { StorageService } from '../storage/storageService';
import { STORAGE_KEYS } from '../storage/keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

// In-memory mock database for SQLite in Jest
const mockRows: { transactions: any[]; detected: any[] } = {
  transactions: [],
  detected: [],
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('DELETE FROM transactions')) {
        mockRows.transactions = [];
        mockRows.detected = [];
      }
      return undefined;
    }),
    runAsync: jest.fn().mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes('INSERT OR REPLACE INTO transactions')) {
        const id = params[0];
        const idx = mockRows.transactions.findIndex((t) => t.id === id);
        const obj = { id, title: params[1], amount: params[2], type: params[3], date: params[13] };
        if (idx >= 0) mockRows.transactions[idx] = obj;
        else mockRows.transactions.push(obj);
        return { changes: 1 };
      }
      if (sql.includes('INSERT OR REPLACE INTO detected_transactions')) {
        const id = params[0];
        mockRows.detected.push({ id, amount: params[1] });
        return { changes: 1 };
      }
      if (sql.includes('DELETE FROM transactions')) {
        mockRows.transactions = [];
        return { changes: 1 };
      }
      return { changes: 0 };
    }),
    withTransactionAsync: jest.fn().mockImplementation(async (cb: () => Promise<any>) => {
      return await cb();
    }),
    getFirstAsync: jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('COUNT(*)')) {
        return { count: mockRows.transactions.length };
      }
      return null;
    }),
    getAllAsync: jest.fn().mockImplementation(async (sql: string) => {
      if (sql.includes('FROM transactions')) {
        return mockRows.transactions;
      }
      if (sql.includes('FROM detected_transactions')) {
        return mockRows.detected;
      }
      return [];
    }),
  }),
}));

describe('StorageMigrationService (F4.2 SQLite Migration)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRows.transactions = [];
    mockRows.detected = [];
    await AsyncStorage.clear();
  });

  it('detects migration status correctly', async () => {
    const isDoneBefore = await StorageMigrationService.isMigrationCompleted();
    expect(isDoneBefore).toBe(false);

    await AsyncStorage.setItem(STORAGE_KEYS.SQLITE_MIGRATED, 'true');
    const isDoneAfter = await StorageMigrationService.isMigrationCompleted();
    expect(isDoneAfter).toBe(true);
  });

  it('successfully migrates data from AsyncStorage to SQLite and sets migration flag', async () => {
    const sampleTxs: Transaction[] = [
      {
        id: 'tx-m1',
        title: 'Electricity Bill',
        amount: 2500,
        type: 'expense',
        categoryId: 'bills',
        categoryName: 'Bills',
        categoryIcon: 'zap',
        categoryColor: '#EF4444',
        accountId: 'acc-1',
        accountName: 'HDFC',
        paymentMethod: 'UPI',
        date: '2026-11-01',
        createdAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'tx-m2',
        title: 'Salary Deposit',
        amount: 85000,
        type: 'income',
        categoryId: 'salary',
        categoryName: 'Salary',
        categoryIcon: 'dollar-sign',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC',
        paymentMethod: 'IMPS',
        date: '2026-11-01',
        createdAt: '2026-11-01T09:00:00Z',
      },
    ];

    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, sampleTxs);

    const result = await StorageMigrationService.runMigration();

    expect(result.success).toBe(true);
    expect(result.transactionsMigrated).toBe(2);

    // Verify backup was created
    const backupStr = await AsyncStorage.getItem(STORAGE_KEYS.PRE_MIGRATION_BACKUP);
    expect(backupStr).toBeDefined();
    expect(JSON.parse(backupStr!).transactions.length).toBe(2);

    // Verify migration confirmed
    const isDone = await StorageMigrationService.isMigrationCompleted();
    expect(isDone).toBe(true);
  });

  it('rolls back cleanly on verification mismatch or failure', async () => {
    // If count mismatch occurs:
    jest.spyOn(SQLiteStorage, 'countTransactions').mockResolvedValueOnce(999); // Intentional mismatch

    const sampleTxs: Transaction[] = [
      {
        id: 'tx-err',
        title: 'Coffee',
        amount: 200,
        type: 'expense',
        categoryId: 'food',
        categoryName: 'Food',
        categoryIcon: 'coffee',
        categoryColor: '#F59E0B',
        accountId: 'acc-1',
        accountName: 'Cash',
        paymentMethod: 'Cash',
        date: '2026-11-02',
        createdAt: '2026-11-02T10:00:00Z',
      },
    ];
    await StorageService.setItem(STORAGE_KEYS.TRANSACTIONS, sampleTxs);

    const result = await StorageMigrationService.runMigration();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Migration verification failed');

    const isDone = await StorageMigrationService.isMigrationCompleted();
    expect(isDone).toBe(false);
  });
});

