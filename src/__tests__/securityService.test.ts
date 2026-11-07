import { SecurityService } from '../services/securityService';

describe('SecurityService - PIN Hashing, Verification & Biometrics', () => {
  beforeEach(async () => {
    // Reset PIN before each test
    await SecurityService.removePin();
  });

  afterAll(async () => {
    await SecurityService.removePin();
  });

  describe('PIN Storage & Verification', () => {
    it('returns false for hasPinSet when no PIN has been configured', async () => {
      const hasPin = await SecurityService.hasPinSet();
      expect(hasPin).toBe(false);
    });

    it('saves a PIN securely and confirms hasPinSet is true', async () => {
      const saved = await SecurityService.savePin('1234');
      expect(saved).toBe(true);

      const hasPin = await SecurityService.hasPinSet();
      expect(hasPin).toBe(true);
    });

    it('verifies correctly with matching PIN', async () => {
      await SecurityService.savePin('4821');

      const isMatch = await SecurityService.verifyPin('4821');
      expect(isMatch).toBe(true);
    });

    it('rejects an incorrect PIN', async () => {
      await SecurityService.savePin('4821');

      const isMatch = await SecurityService.verifyPin('9999');
      expect(isMatch).toBe(false);
    });

    it('removes PIN and verifies hasPinSet returns false', async () => {
      await SecurityService.savePin('5555');
      expect(await SecurityService.hasPinSet()).toBe(true);

      await SecurityService.removePin();
      expect(await SecurityService.hasPinSet()).toBe(false);
      expect(await SecurityService.verifyPin('5555')).toBe(false);
    });
  });

  describe('Salt and Hash Properties', () => {
    it('generates unique random salts', () => {
      const salt1 = SecurityService.generateSalt();
      const salt2 = SecurityService.generateSalt();
      expect(salt1).not.toBe(salt2);
      expect(salt1.length).toBeGreaterThanOrEqual(16);
    });

    it('produces identical hashes for same pin and salt', async () => {
      const salt = 'fixed_test_salt_123';
      const hash1 = await SecurityService.hashPin('1234', salt);
      const hash2 = await SecurityService.hashPin('1234', salt);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different pins with same salt', async () => {
      const salt = 'fixed_test_salt_123';
      const hash1 = await SecurityService.hashPin('1234', salt);
      const hash2 = await SecurityService.hashPin('5678', salt);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Legacy PIN Migration', () => {
    it('migrates legacy plaintext pin into secure salted hash', async () => {
      const legacyPin = '7890';
      const migrated = await SecurityService.migrateLegacyPin(legacyPin);
      expect(migrated).toBe(true);
      expect(await SecurityService.hasPinSet()).toBe(true);
      expect(await SecurityService.verifyPin('7890')).toBe(true);
    });

    it('returns false if legacyPin is undefined or empty', async () => {
      const migrated = await SecurityService.migrateLegacyPin(undefined);
      expect(migrated).toBe(false);
    });
  });
});

