import { EncryptionService } from '../utils/encryption';
import { SecureStorageService } from '../utils/storage';

interface VaultItemData {
  name: string;
  username?: string;
  password?: string;
  website?: string;
  notes?: string;
  // Credit card fields
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

interface VaultItem {
  id: string;
  user_id: string;
  item_type: 'password' | 'credit_card' | 'secure_note';
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

interface DecryptedVaultItem {
  id: string;
  item_type: 'password' | 'credit_card' | 'secure_note';
  decrypted_data: VaultItemData;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export class VaultService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await SecureStorageService.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async getVaultItems(masterKey: string): Promise<DecryptedVaultItem[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/vault/items`, {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vault items');
      }

      const encryptedItems: VaultItem[] = await response.json();
      
      // Decrypt items client-side
      const decryptedItems: DecryptedVaultItem[] = [];
      
      for (const item of encryptedItems) {
        try {
          const decryptedDataStr = EncryptionService.decrypt(item.encrypted_data, masterKey);
          const decryptedData = JSON.parse(decryptedDataStr);
          
          decryptedItems.push({
            id: item.id,
            item_type: item.item_type,
            decrypted_data: decryptedData,
            created_at: item.created_at,
            updated_at: item.updated_at,
          });
        } catch (decryptError) {
          console.error('Failed to decrypt item:', item.id, decryptError);
          // Skip items that can't be decrypted
        }
      }

      return decryptedItems;
    } catch (error) {
      console.error('VaultService.getVaultItems error:', error);
      throw error;
    }
  }

  async createVaultItem(
    itemType: 'password' | 'credit_card' | 'secure_note',
    itemData: VaultItemData,
    masterKey: string
  ): Promise<void> {
    try {
      // Encrypt data client-side
      const dataToEncrypt = JSON.stringify(itemData);
      const encryptedData = EncryptionService.encrypt(dataToEncrypt, masterKey);

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/vault/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          item_type: itemType,
          encrypted_data: encryptedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create vault item');
      }
    } catch (error) {
      console.error('VaultService.createVaultItem error:', error);
      throw error;
    }
  }

  async updateVaultItem(
    itemId: string,
    itemData: VaultItemData,
    masterKey: string
  ): Promise<void> {
    try {
      // Encrypt data client-side
      const dataToEncrypt = JSON.stringify(itemData);
      const encryptedData = EncryptionService.encrypt(dataToEncrypt, masterKey);

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/vault/items/${itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          encrypted_data: encryptedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update vault item');
      }
    } catch (error) {
      console.error('VaultService.updateVaultItem error:', error);
      throw error;
    }
  }

  async deleteVaultItem(itemId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/vault/items/${itemId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete vault item');
      }
    } catch (error) {
      console.error('VaultService.deleteVaultItem error:', error);
      throw error;
    }
  }

  // Template methods for different item types
  createPasswordTemplate(): VaultItemData {
    return {
      name: '',
      username: '',
      password: '',
      website: '',
      notes: '',
    };
  }

  createCreditCardTemplate(): VaultItemData {
    return {
      name: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      notes: '',
    };
  }

  createSecureNoteTemplate(): VaultItemData {
    return {
      name: '',
      notes: '',
    };
  }

  // Generate strong password
  generateStrongPassword(
    length: number = 16,
    includeSymbols: boolean = true
  ): string {
    return EncryptionService.generatePassword(
      length,
      true, // uppercase
      true, // lowercase  
      true, // numbers
      includeSymbols
    );
  }

  // Calculate password strength
  calculatePasswordStrength(password: string) {
    return EncryptionService.calculatePasswordStrength(password);
  }
}