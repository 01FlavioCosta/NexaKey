import CryptoJS from 'crypto-js';
import { hash } from 'argon2-browser';

export class EncryptionService {
  // Generate a key from master password using Argon2
  static async deriveKey(masterPassword: string, salt: string): Promise<string> {
    try {
      const result = await hash({
        pass: masterPassword,
        salt: salt,
        time: 3,
        mem: 4096,
        hashLen: 32,
        parallelism: 1,
        type: 0, // Argon2d
      });
      return result.encoded;
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  // Generate a random salt
  static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  // Encrypt data with AES-256
  static encrypt(data: string, key: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with AES-256
  static decrypt(encryptedData: string, key: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Invalid decryption key');
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash master password for server storage
  static async hashMasterPassword(password: string, salt: string): Promise<string> {
    try {
      const result = await hash({
        pass: password,
        salt: salt,
        time: 3,
        mem: 4096,
        hashLen: 32,
        parallelism: 1,
        type: 2, // Argon2id
      });
      return result.encoded;
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  // Generate strong password
  static generatePassword(
    length: number = 16,
    includeUppercase: boolean = true,
    includeLowercase: boolean = true,
    includeNumbers: boolean = true,
    includeSymbols: boolean = true
  ): string {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      throw new Error('At least one character type must be selected');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  // Calculate password strength
  static calculatePasswordStrength(password: string): {
    score: number;
    label: string;
    suggestions: string[];
  } {
    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    // Character diversity
    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else suggestions.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else suggestions.push('Include symbols');

    // Patterns check
    if (!/(.)\1{2,}/.test(password)) score += 1;
    else suggestions.push('Avoid repeated characters');

    let label = 'Very Weak';
    if (score >= 6) label = 'Very Strong';
    else if (score >= 5) label = 'Strong';
    else if (score >= 4) label = 'Good';
    else if (score >= 3) label = 'Fair';
    else if (score >= 2) label = 'Weak';

    return { score, label, suggestions };
  }
}