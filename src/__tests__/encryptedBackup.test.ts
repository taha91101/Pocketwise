import { EncryptedBackupService } from '../services/encryptedBackupService';
import { AppExportData } from '../services/exportImportService';

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///data/user/0/com.taha_911.pocketwise/cache/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///data/user/0/com.taha_911.pocketwise/cache/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('EncryptedBackupService (F4.1 Encrypted Backup)', () => {
  const sampleData: AppExportData = {
    version: '3.0.0',
    exportedAt: '2026-11-07T12:00:00Z',
    accounts: [
      { id: 'acc-1', name: 'HDFC Bank', type: 'bank', balance: 50000, icon: 'bank', color: '#10B981' },
      { id: 'acc-2', name: 'Cash', type: 'cash', balance: 4000, icon: 'cash', color: '#3B82F6' },
    ],
    transactions: [
      {
        id: 'tx-1',
        title: 'Grocery Store',
        amount: 1500,
        type: 'expense',
        categoryId: 'groceries',
        categoryName: 'Groceries',
        categoryIcon: 'cart',
        categoryColor: '#10B981',
        accountId: 'acc-1',
        accountName: 'HDFC Bank',
        paymentMethod: 'UPI',
        date: '2026-11-05',
        createdAt: '2026-11-05T10:00:00Z',
      },
    ],
    budgets: [],
    savingsGoals: [],
    recurringPayments: [],
  };

  const password = 'StrongPassword#2026';

  it('encrypts payload into a valid versioned archive header', async () => {
    const jsonStr = JSON.stringify(sampleData);
    const archive = await EncryptedBackupService.encryptPayload(jsonStr, password);

    expect(archive.format).toBe('pocketwise_encrypted_archive');
    expect(archive.version).toBe('3.0');
    expect(archive.cipher).toBe('AES-GCM-256');
    expect(archive.kdf).toBe('PBKDF2-SHA256');
    expect(archive.salt).toBeDefined();
    expect(archive.iv).toBeDefined();
    expect(archive.ciphertext).toBeDefined();
    expect(archive.checksum).toBeDefined();
    // Ciphertext must not contain plaintext account names or amounts
    expect(archive.ciphertext).not.toContain('HDFC Bank');
    expect(archive.ciphertext).not.toContain('Grocery Store');
  });

  it('decrypts encrypted archive cleanly with the correct password', async () => {
    const jsonStr = JSON.stringify(sampleData);
    const archive = await EncryptedBackupService.encryptPayload(jsonStr, password);

    const decryptedStr = await EncryptedBackupService.decryptPayload(archive, password);
    const restored = JSON.parse(decryptedStr);

    expect(restored.accounts.length).toBe(2);
    expect(restored.accounts[0].name).toBe('HDFC Bank');
    expect(restored.transactions[0].amount).toBe(1500);
  });

  it('fails decryption when provided with an incorrect password', async () => {
    const jsonStr = JSON.stringify(sampleData);
    const archive = await EncryptedBackupService.encryptPayload(jsonStr, password);

    await expect(
      EncryptedBackupService.decryptPayload(archive, 'WrongPassword123')
    ).rejects.toThrow();
  });

  it('parses and restores encrypted backup via parseAndRestoreBackup', async () => {
    const jsonStr = JSON.stringify(sampleData);
    const archive = await EncryptedBackupService.encryptPayload(jsonStr, password);
    const fileContent = JSON.stringify(archive);

    const result = await EncryptedBackupService.parseAndRestoreBackup(fileContent, password);

    expect(result.isValid).toBe(true);
    expect(result.isEncrypted).toBe(true);
    expect(result.data?.accounts[0].name).toBe('HDFC Bank');
    expect(result.data?.transactions[0].title).toBe('Grocery Store');
  });

  it('gracefully detects and imports unencrypted legacy v2 JSON backups without requiring password', async () => {
    const legacyJson = JSON.stringify(sampleData);

    const result = await EncryptedBackupService.parseAndRestoreBackup(legacyJson);

    expect(result.isValid).toBe(true);
    expect(result.isEncrypted).toBe(false);
    expect(result.data?.accounts[0].name).toBe('HDFC Bank');
  });
});
