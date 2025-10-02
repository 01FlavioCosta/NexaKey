import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

export class EncryptionService {
  // Generate a key from master password using PBKDF2 (web-compatible alternative to Argon2)
  static async deriveKey(masterPassword: string, salt: string): Promise<string> {
    try {
      // Use PBKDF2 with high iteration count for key derivation
      const key = CryptoJS.PBKDF2(masterPassword, salt, {
        keySize: 256/32,
        iterations: 100000
      });
      return key.toString();
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Failed to derive encryption key');
    }
  }

  // Generate a random salt
  static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  // Encrypt data with AES-256 - improved version to handle UTF-8 properly
  static encrypt(data: string, key: string): string {
    try {
      // Ensure the data is properly encoded as UTF-8
      const utf8Data = CryptoJS.enc.Utf8.parse(data);
      const encrypted = CryptoJS.AES.encrypt(utf8Data, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      console.log('Encryption successful');
      return encrypted.toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data with AES-256 - improved version to handle UTF-8 properly
  static decrypt(encryptedData: string, key: string): string {
    try {
      console.log('Attempting to decrypt data...');
      
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Convert to UTF-8 string
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Invalid decryption key or corrupted data');
      }
      
      console.log('Decryption successful');
      return decryptedString;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
  }

  // Hash master password for server storage using bcrypt
  static async hashMasterPassword(password: string, salt: string): Promise<string> {
    try {
      // Use bcrypt with salt rounds for password hashing
      const saltRounds = 12;
      const hash = await bcrypt.hash(password + salt, saltRounds);
      return hash;
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