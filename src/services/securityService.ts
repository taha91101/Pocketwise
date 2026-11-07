import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const PIN_HASH_KEY = 'pocketwise_secure_pin_hash';
const PIN_SALT_KEY = 'pocketwise_secure_pin_salt';

// In-memory fallback for environments where SecureStore native module is unavailable (e.g. web/node tests)
const memoryStore = new Map<string, string>();

async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return memoryStore.get(key) || null;
    }
    const val = await SecureStore.getItemAsync(key);
    return val;
  } catch {
    return memoryStore.get(key) || null;
  }
}

async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      memoryStore.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
    memoryStore.set(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // ignore
  } finally {
    memoryStore.delete(key);
  }
}

export class SecurityService {
  /**
   * Generates a random salt string
   */
  public static generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let salt = '';
    for (let i = 0; i < 24; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  }

  /**
   * Computes a SHA-256 salted hash of the PIN
   */
  public static async hashPin(pin: string, salt: string): Promise<string> {
    const raw = `${salt}::pocketwise::${pin}::salt`;
    try {
      return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
    } catch {
      // Basic deterministic hashing fallback for environments where native Crypto is mocked/missing
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = (hash << 5) - hash + raw.charCodeAt(i);
        hash |= 0;
      }
      return `fallback_hash_${hash}`;
    }
  }

  /**
   * Saves a new user PIN securely as a salted hash
   */
  public static async savePin(pin: string): Promise<boolean> {
    try {
      const salt = this.generateSalt();
      const hash = await this.hashPin(pin, salt);
      await setSecureItem(PIN_SALT_KEY, salt);
      await setSecureItem(PIN_HASH_KEY, hash);
      return true;
    } catch (e) {
      console.error('[SecurityService] Failed to save PIN:', e);
      return false;
    }
  }

  /**
   * Verifies if the entered PIN matches the stored salted hash
   */
  public static async verifyPin(enteredPin: string): Promise<boolean> {
    try {
      const salt = await getSecureItem(PIN_SALT_KEY);
      const storedHash = await getSecureItem(PIN_HASH_KEY);
      if (!salt || !storedHash) return false;

      const enteredHash = await this.hashPin(enteredPin, salt);
      return enteredHash === storedHash;
    } catch (e) {
      console.error('[SecurityService] Failed to verify PIN:', e);
      return false;
    }
  }

  /**
   * Checks whether a secure PIN has been registered
   */
  public static async hasPinSet(): Promise<boolean> {
    const hash = await getSecureItem(PIN_HASH_KEY);
    return hash !== null && hash.length > 0;
  }

  /**
   * Clears the stored PIN and salt
   */
  public static async removePin(): Promise<boolean> {
    try {
      await deleteSecureItem(PIN_HASH_KEY);
      await deleteSecureItem(PIN_SALT_KEY);
      return true;
    } catch (e) {
      console.error('[SecurityService] Failed to remove PIN:', e);
      return false;
    }
  }

  /**
   * Checks if biometric hardware is supported and enrolled
   */
  public static async isBiometricAvailable(): Promise<{ hasHardware: boolean; isEnrolled: boolean }> {
    try {
      if (Platform.OS === 'web') {
        return { hasHardware: false, isEnrolled: false };
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware && (await LocalAuthentication.isEnrolledAsync());
      return { hasHardware, isEnrolled };
    } catch {
      return { hasHardware: false, isEnrolled: false };
    }
  }

  /**
   * Prompts user for biometric authentication
   */
  public static async authenticateBiometric(
    promptMessage: string = 'Unlock PocketWise'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (Platform.OS === 'web') {
        return { success: false, error: 'Biometrics unavailable on web' };
      }
      const { hasHardware, isEnrolled } = await this.isBiometricAvailable();
      if (!hasHardware || !isEnrolled) {
        return { success: false, error: 'Biometrics not enrolled or available' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true, // we provide our own PIN fallback UI
      });

      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error || 'Authentication cancelled' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Biometric failure' };
    }
  }

  /**
   * Migrates legacy plaintext pinCode from AsyncStorage to SecureStore
   */
  public static async migrateLegacyPin(legacyPin?: string): Promise<boolean> {
    if (!legacyPin) return false;
    const alreadySet = await this.hasPinSet();
    if (!alreadySet) {
      return await this.savePin(legacyPin);
    }
    return true;
  }
}

