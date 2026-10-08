import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
  public static async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue == null) {
        return defaultValue;
      }
      return JSON.parse(jsonValue) as T;
    } catch (e) {
      console.warn(`[StorageService] Failed to read key ${key}:`, e);
      return defaultValue;
    }
  }

  public static async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (e) {
      console.error(`[StorageService] Failed to save key ${key}:`, e);
      return false;
    }
  }

  public static async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[StorageService] Failed to remove key ${key}:`, e);
      return false;
    }
  }

  public static async clearAll(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (e) {
      console.error('[StorageService] Failed to clear storage:', e);
      return false;
    }
  }
}
