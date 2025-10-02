import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SecureStorageService {
  // Secure storage keys
  private static readonly KEYS = {
    MASTER_KEY: 'master_encryption_key',
    BIOMETRIC_KEY: 'biometric_recovery_key',
    USER_SALT: 'user_salt',
    ACCESS_TOKEN: 'access_token',
    USER_DATA: 'user_data',
    BIOMETRIC_ENABLED: 'biometric_enabled',
  };

  // Store sensitive data in secure storage
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (SecureStore.setItemAsync) {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Fallback to AsyncStorage if SecureStore is not available
        await AsyncStorage.setItem(`secure_${key}`, value);
      }
    } catch (error) {
      console.error('Secure storage write failed:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(`secure_${key}`, value);
    }
  }

  // Retrieve sensitive data from secure storage
  static async getSecureItem(key: string): Promise<string | null> {
    try {
      if (SecureStore.getItemAsync) {
        return await SecureStore.getItemAsync(key);
      } else {
        // Fallback to AsyncStorage if SecureStore is not available
        return await AsyncStorage.getItem(`secure_${key}`);
      }
    } catch (error) {
      console.error('Secure storage read failed:', error);
      // Fallback to AsyncStorage
      try {
        return await AsyncStorage.getItem(`secure_${key}`);
      } catch (fallbackError) {
        console.error('AsyncStorage fallback failed:', fallbackError);
        return null;
      }
    }
  }

  // Delete item from secure storage
  static async deleteSecureItem(key: string): Promise<void> {
    try {
      if (SecureStore.deleteItemAsync) {
        await SecureStore.deleteItemAsync(key);
      }
      // Also try to delete from AsyncStorage fallback
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('Secure storage delete failed:', error);
    }
  }

  // Store non-sensitive data in async storage
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage write failed:', error);
      throw new Error('Failed to store data');
    }
  }

  // Retrieve non-sensitive data from async storage
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage read failed:', error);
      return null;
    }
  }

  // Master key operations
  static async storeMasterKey(key: string): Promise<void> {
    await this.setSecureItem(this.KEYS.MASTER_KEY, key);
  }

  static async getMasterKey(): Promise<string | null> {
    return await this.getSecureItem(this.KEYS.MASTER_KEY);
  }

  static async deleteMasterKey(): Promise<void> {
    await this.deleteSecureItem(this.KEYS.MASTER_KEY);
  }

  // Biometric key operations
  static async storeBiometricKey(key: string): Promise<void> {
    await this.setSecureItem(this.KEYS.BIOMETRIC_KEY, key);
  }

  static async getBiometricKey(): Promise<string | null> {
    return await this.getSecureItem(this.KEYS.BIOMETRIC_KEY);
  }

  // User salt operations
  static async storeUserSalt(salt: string): Promise<void> {
    await this.setSecureItem(this.KEYS.USER_SALT, salt);
  }

  static async getUserSalt(): Promise<string | null> {
    return await this.getSecureItem(this.KEYS.USER_SALT);
  }

  // Access token operations
  static async storeAccessToken(token: string): Promise<void> {
    await this.setSecureItem(this.KEYS.ACCESS_TOKEN, token);
  }

  static async getAccessToken(): Promise<string | null> {
    return await this.getSecureItem(this.KEYS.ACCESS_TOKEN);
  }

  static async deleteAccessToken(): Promise<void> {
    await this.deleteSecureItem(this.KEYS.ACCESS_TOKEN);
  }

  // User data operations
  static async storeUserData(userData: any): Promise<void> {
    await this.setItem(this.KEYS.USER_DATA, JSON.stringify(userData));
  }

  static async getUserData(): Promise<any | null> {
    const data = await this.getItem(this.KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  // Biometric enabled flag
  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    await this.setItem(this.KEYS.BIOMETRIC_ENABLED, enabled.toString());
  }

  static async isBiometricEnabled(): Promise<boolean> {
    const enabled = await this.getItem(this.KEYS.BIOMETRIC_ENABLED);
    return enabled === 'true';
  }

  // Clear all stored data (logout)
  static async clearAllData(): Promise<void> {
    try {
      await this.deleteMasterKey();
      await this.deleteAccessToken();
      await AsyncStorage.multiRemove([
        this.KEYS.USER_DATA,
        this.KEYS.BIOMETRIC_ENABLED,
      ]);
    } catch (error) {
      console.error('Failed to clear stored data:', error);
    }
  }
}