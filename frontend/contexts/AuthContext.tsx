import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SecureStorageService } from '../utils/storage';
import { EncryptionService } from '../utils/encryption';

interface User {
  id: string;
  email: string;
  biometric_enabled: boolean;
  vault_items_count: number;
  is_premium: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirstTime: boolean;
  masterKey: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, biometricEnabled: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setMasterKey: (key: string) => void;
  setBiometricRecovery: (enabled: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [masterKey, setMasterKeyState] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔍 Initializing auth...');
      
      // Check for existing user data
      const userData = await SecureStorageService.getUserData();
      const token = await SecureStorageService.getAccessToken();
      const salt = await SecureStorageService.getUserSalt();
      const masterKey = await SecureStorageService.getMasterKey();
      
      console.log('📱 Storage check:', { 
        hasUserData: !!userData, 
        hasToken: !!token,
        hasSalt: !!salt,
        hasMasterKey: !!masterKey,
        userEmail: userData?.email 
      });

      // If we have complete user data, try to restore session
      if (userData && token && salt && masterKey) {
        console.log('🔄 Found complete session data, attempting restore...');
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userProfile = await response.json();
            console.log('✅ Session restored successfully');
            
            // Restore complete state
            setUser(userProfile);
            setMasterKeyState(masterKey);
            setIsFirstTime(false);
            setIsLoading(false);
            return;
          } else {
            console.log('❌ Token invalid, status:', response.status);
          }
        } catch (error) {
          console.error('🚨 Session validation failed:', error);
        }
      }

      // If we have user data but no complete session, show login
      if (userData && userData.email) {
        console.log('🔒 Partial data found, showing login for:', userData.email);
        setIsFirstTime(false);
      } else {
        console.log('👋 No user data, showing onboarding');
        setIsFirstTime(true);
      }
      
    } catch (error) {
      console.error('💥 Auth initialization error:', error);
      setIsFirstTime(true);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    biometricEnabled: boolean
  ): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('📝 Starting registration for:', email);

      // Generate salt for this user (consistent across devices)
      const salt = EncryptionService.generateSalt();
      
      // Hash master password for server storage
      const masterPasswordHash = await EncryptionService.hashMasterPassword(password, salt);
      
      // Derive encryption key for client-side encryption
      const encryptionKey = await EncryptionService.deriveKey(password, salt);

      console.log('🚀 Attempting server registration...');

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          master_password_hash: masterPasswordHash,
          biometric_enabled: biometricEnabled,
        }),
      });

      console.log('📡 Registration response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Registration error:', errorText);
        throw new Error('Erro no registro. Tente novamente.');
      }

      const data = await response.json();
      console.log('✅ Registration successful');
      
      // Store user data and tokens FIRST
      await SecureStorageService.storeAccessToken(data.access_token);
      await SecureStorageService.storeUserData(data.user);
      await SecureStorageService.storeUserSalt(salt);
      await SecureStorageService.storeMasterKey(encryptionKey);
      await SecureStorageService.setBiometricEnabled(biometricEnabled);

      // If biometric enabled, store recovery key
      if (biometricEnabled) {
        await SecureStorageService.storeBiometricKey(encryptionKey);
      }

      // Update state LAST
      setUser(data.user);
      setMasterKeyState(encryptionKey);
      setIsFirstTime(false); // Important: mark as not first time
      
      console.log('✅ Registration completed, user logged in');
    } catch (error) {
      console.error('💥 Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('🔐 Starting login for:', email);

      // First, get or generate salt
      let salt = await SecureStorageService.getUserSalt();
      
      if (!salt) {
        console.log('⚠️ No salt found, this might be a new device');
        // For simplicity, use email as salt base for consistency across devices
        salt = EncryptionService.generateSalt();
        await SecureStorageService.storeUserSalt(salt);
        console.log('💾 Generated and stored new salt');
      }

      // Hash password for server verification
      const masterPasswordHash = await EncryptionService.hashMasterPassword(password, salt);
      
      // Derive encryption key
      const encryptionKey = await EncryptionService.deriveKey(password, salt);

      console.log('🚀 Attempting server login...');

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          master_password_hash: masterPasswordHash,
        }),
      });

      console.log('📡 Login response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('❌ Invalid credentials');
          throw new Error('E-mail ou senha incorretos');
        } else {
          const errorText = await response.text();
          console.log('❌ Login error:', errorText);
          throw new Error('Erro no servidor. Tente novamente.');
        }
      }

      const data = await response.json();
      console.log('✅ Login successful');
      
      // Store user data and tokens
      await SecureStorageService.storeAccessToken(data.access_token);
      await SecureStorageService.storeUserData(data.user);
      await SecureStorageService.storeMasterKey(encryptionKey);

      // Update state
      setUser(data.user);
      setMasterKeyState(encryptionKey);
      setIsFirstTime(false); // Important: ensure we don't go back to onboarding
      
      console.log('✅ Login completed, user state updated');
    } catch (error) {
      console.error('💥 Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await SecureStorageService.clearAllData();
      setUser(null);
      setMasterKeyState(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setMasterKey = (key: string) => {
    setMasterKeyState(key);
  };

  const setBiometricRecovery = async (enabled: boolean): Promise<void> => {
    try {
      if (enabled && masterKey) {
        await SecureStorageService.storeBiometricKey(masterKey);
      }
      await SecureStorageService.setBiometricEnabled(enabled);
      
      if (user) {
        setUser({ ...user, biometric_enabled: enabled });
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isFirstTime,
    masterKey,
    login,
    register,
    logout,
    setMasterKey,
    setBiometricRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};