import * as SQLite from 'expo-sqlite';
import { DetectedTransaction, Transaction } from '../types';

export class SQLiteStorage {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static isInitialized = false;

  /**
   * Get or open singleton database connection
   */
  public static async getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('pocketwise.db');
    }
    return this.db;
  }

  /**
   * Initialize tables and performance indices
   */
  public static async initDatabase(): Promise<void> {
    if (this.isInitialized) return;
    const db = await this.getDb();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        categoryName TEXT NOT NULL,
        categoryIcon TEXT,
        categoryColor TEXT,
        accountId TEXT NOT NULL,
        accountName TEXT NOT NULL,
        destinationAccountId TEXT,
        destinationAccountName TEXT,
        paymentMethod TEXT,
        date TEXT NOT NULL,
        time TEXT,
        notes TEXT,
        splits TEXT,
        receiptUri TEXT,
        merchant TEXT,
        goalId TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(accountId);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

      CREATE TABLE IF NOT EXISTS detected_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        merchant TEXT NOT NULL,
        suggestedCategory TEXT NOT NULL,
        suggestedCategoryId TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        paymentProvider TEXT NOT NULL,
        sourcePackage TEXT NOT NULL,
        upiReference TEXT,
        transactionTimestamp INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        isAutomaticallyDetected INTEGER NOT NULL,
        detectionConfidence REAL NOT NULL,
        rawReferenceHash TEXT NOT NULL,
        status TEXT NOT NULL,
        rawTitleSnippet TEXT,
        rawTextSnippet TEXT,
        notes TEXT,
        availableBalance REAL,
        splits TEXT,
        matchedEntity TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_detected_status ON detected_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_detected_timestamp ON detected_transactions(transactionTimestamp DESC);
    `);

    this.isInitialized = true;
  }

  /**
   * Insert single transaction
   */
  public static async insertTransaction(tx: Transaction): Promise<void> {
    await this.initDatabase();
    const db = await this.getDb();

    await db.runAsync(
      `INSERT OR REPLACE INTO transactions (
        id, title, amount, type, categoryId, categoryName, categoryIcon, categoryColor,
        accountId, accountName, destinationAccountId, destinationAccountName,
        paymentMethod, date, time, notes, splits, receiptUri, merchant, goalId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        tx.id,
        tx.title,
        Number(tx.amount) || 0,
        tx.type,
        tx.categoryId,
        tx.categoryName,
        tx.categoryIcon || null,
        tx.categoryColor || null,
        tx.accountId,
        tx.accountName,
        tx.destinationAccountId || null,
        tx.destinationAccountName || null,
        tx.paymentMethod,
        tx.date,
        tx.time || null,
        tx.notes || null,
        tx.splits ? JSON.stringify(tx.splits) : null,
        tx.receiptUri || null,
        tx.merchant || null,
        tx.goalId || null,
        tx.createdAt,
      ]
    );
  }

  /**
   * Transactional batch insert for transactions
   */
  public static async insertTransactionsBatch(txs: Transaction[]): Promise<void> {
    await this.initDatabase();
    const db = await this.getDb();

    await db.withTransactionAsync(async () => {
      for (const tx of txs) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions (
            id, title, amount, type, categoryId, categoryName, categoryIcon, categoryColor,
            accountId, accountName, destinationAccountId, destinationAccountName,
            paymentMethod, date, time, notes, splits, receiptUri, merchant, goalId, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            tx.id,
            tx.title,
            Number(tx.amount) || 0,
            tx.type,
            tx.categoryId,
            tx.categoryName,
            tx.categoryIcon || null,
            tx.categoryColor || null,
            tx.accountId,
            tx.accountName,
            tx.destinationAccountId || null,
            tx.destinationAccountName || null,
            tx.paymentMethod,
            tx.date,
            tx.time || null,
            tx.notes || null,
            tx.splits ? JSON.stringify(tx.splits) : null,
            tx.receiptUri || null,
            tx.merchant || null,
            tx.goalId || null,
            tx.createdAt,
          ]
        );
      }
    });
  }

  /**
   * Update transaction by ID
   */
  public static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<boolean> {
    await this.initDatabase();
    const db = await this.getDb();

    const existing = await db.getFirstAsync<any>('SELECT * FROM transactions WHERE id = ?;', [id]);
    if (!existing) return false;

    const merged: Transaction = {
      ...this.mapRowToTransaction(existing),
      ...updates,
    };

    await this.insertTransaction(merged);
    return true;
  }

  /**
   * Delete transaction by ID
   */
  public static async deleteTransaction(id: string): Promise<boolean> {
    await this.initDatabase();
    const db = await this.getDb();
    const res = await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
    return res.changes > 0;
  }

  /**
   * Get all transactions ordered by date descending
   */
  public static async getAllTransactions(limit?: number, offset?: number): Promise<Transaction[]> {
    await this.initDatabase();
    const db = await this.getDb();

    let query = 'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC';
    const params: any[] = [];
    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const rows = await db.getAllAsync<any>(query, params);
    return rows.map((r) => this.mapRowToTransaction(r));
  }

  /**
   * Total row count
   */
  public static async countTransactions(): Promise<number> {
    await this.initDatabase();
    const db = await this.getDb();
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions;');
    return row?.count || 0;
  }

  /**
   * Insert detected transaction
   */
  public static async insertDetectedTransaction(detected: DetectedTransaction): Promise<void> {
    await this.initDatabase();
    const db = await this.getDb();

    await db.runAsync(
      `INSERT OR REPLACE INTO detected_transactions (
        id, amount, type, merchant, suggestedCategory, suggestedCategoryId,
        paymentMethod, paymentProvider, sourcePackage, upiReference,
        transactionTimestamp, createdAt, isAutomaticallyDetected, detectionConfidence,
        rawReferenceHash, status, rawTitleSnippet, rawTextSnippet, notes,
        availableBalance, splits, matchedEntity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        detected.id,
        Number(detected.amount) || 0,
        detected.type,
        detected.merchant || '',
        detected.suggestedCategory || '',
        detected.suggestedCategoryId || '',
        detected.paymentMethod || 'UPI',
        detected.paymentProvider || '',
        detected.sourcePackage || '',
        detected.upiReference || null,
        detected.transactionTimestamp || Date.now(),
        detected.createdAt || Date.now(),
        detected.isAutomaticallyDetected ? 1 : 0,
        detected.detectionConfidence || 0,
        detected.rawReferenceHash || '',
        detected.status,
        detected.rawTitleSnippet || null,
        detected.rawTextSnippet || null,
        detected.notes || null,
        detected.availableBalance || null,
        detected.splits ? JSON.stringify(detected.splits) : null,
        detected.matchedEntity ? JSON.stringify(detected.matchedEntity) : null,
      ]
    );
  }

  /**
   * Get all detected transactions
   */
  public static async getAllDetectedTransactions(): Promise<DetectedTransaction[]> {
    await this.initDatabase();
    const db = await this.getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM detected_transactions ORDER BY transactionTimestamp DESC;'
    );
    return rows.map((r) => this.mapRowToDetected(r));
  }

  /**
   * Clear all SQLite data (e.g. for factory reset or test cleanup)
   */
  public static async clearAll(): Promise<void> {
    await this.initDatabase();
    const db = await this.getDb();
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM detected_transactions;
    `);
  }

  private static mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      title: row.title,
      amount: row.amount,
      type: row.type,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryIcon: row.categoryIcon || 'tag',
      categoryColor: row.categoryColor || '#10B981',
      accountId: row.accountId,
      accountName: row.accountName,
      destinationAccountId: row.destinationAccountId || undefined,
      destinationAccountName: row.destinationAccountName || undefined,
      paymentMethod: row.paymentMethod || 'UPI',
      date: row.date,
      time: row.time || undefined,
      notes: row.notes || undefined,
      splits: row.splits ? JSON.parse(row.splits) : undefined,
      receiptUri: row.receiptUri || undefined,
      merchant: row.merchant || undefined,
      goalId: row.goalId || undefined,
      createdAt: row.createdAt,
    };
  }

  private static mapRowToDetected(row: any): DetectedTransaction {
    return {
      id: row.id,
      amount: row.amount,
      type: row.type,
      merchant: row.merchant || '',
      suggestedCategory: row.suggestedCategory || '',
      suggestedCategoryId: row.suggestedCategoryId || '',
      paymentMethod: row.paymentMethod || 'UPI',
      paymentProvider: row.paymentProvider || '',
      sourcePackage: row.sourcePackage || '',
      upiReference: row.upiReference || undefined,
      transactionTimestamp: row.transactionTimestamp,
      createdAt: row.createdAt,
      isAutomaticallyDetected: Boolean(row.isAutomaticallyDetected),
      detectionConfidence: row.detectionConfidence,
      rawReferenceHash: row.rawReferenceHash,
      status: row.status,
      rawTitleSnippet: row.rawTitleSnippet || undefined,
      rawTextSnippet: row.rawTextSnippet || undefined,
      notes: row.notes || undefined,
      availableBalance: row.availableBalance || undefined,
      splits: row.splits ? JSON.parse(row.splits) : undefined,
      matchedEntity: row.matchedEntity ? JSON.parse(row.matchedEntity) : undefined,
    };
  }
}
