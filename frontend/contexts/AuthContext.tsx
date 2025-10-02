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
      
      // Always check for existing user data first
      const userData = await SecureStorageService.getUserData();
      const token = await SecureStorageService.getAccessToken();
      
      console.log('📱 Storage check:', { 
        hasUserData: !!userData, 
        hasToken: !!token,
        userEmail: userData?.email 
      });

      // If we have both user data and token, try to validate
      if (userData && token) {
        console.log('🔑 Found existing auth data, validating...');
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userProfile = await response.json();
            console.log('✅ Token valid, restoring user session');
            
            setUser(userProfile);
            
            // Try to restore master key
            const storedKey = await SecureStorageService.getMasterKey();
            if (storedKey) {
              setMasterKeyState(storedKey);
              console.log('🔐 Master key restored');
            }
            
            // User is logged in, skip onboarding
            setIsFirstTime(false);
            setIsLoading(false);
            return;
          } else {
            console.log('❌ Token invalid, clearing data');
            await SecureStorageService.clearAllData();
          }
        } catch (error) {
          console.error('🚨 Token validation failed:', error);
          await SecureStorageService.clearAllData();
        }
      }

      // Check if this is truly first time (no user data at all)
      if (!userData) {
        console.log('👋 First time user, showing onboarding');
        setIsFirstTime(true);
      } else {
        console.log('🔒 Existing user, showing login');
        setIsFirstTime(false);
      }
      
    } catch (error) {
      console.error('💥 Auth initialization error:', error);
      // On error, show onboarding to be safe
      setIsFirstTime(true);
    } finally {
      setIsLoading(false);
      console.log('✅ Auth initialization complete');
    }
  };

  const register = async (
    email: string, 
    password: string, 
    biometricEnabled: boolean
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // Generate salt for this user
      const salt = EncryptionService.generateSalt();
      
      // Hash master password for server storage
      const masterPasswordHash = await EncryptionService.hashMasterPassword(password, salt);
      
      // Derive encryption key for client-side encryption
      const encryptionKey = await EncryptionService.deriveKey(password, salt);

      console.log('Registering user with email:', email);

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

      const responseText = await response.text();
      console.log('Registration response:', response.status, responseText);

      if (!response.ok) {
        let errorMessage = 'Falha no registro';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Erro ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      
      // Store user data and tokens
      await SecureStorageService.storeAccessToken(data.access_token);
      await SecureStorageService.storeUserData(data.user);
      await SecureStorageService.storeUserSalt(salt);
      await SecureStorageService.storeMasterKey(encryptionKey);
      await SecureStorageService.setBiometricEnabled(biometricEnabled);

      // If biometric enabled, store recovery key
      if (biometricEnabled) {
        await SecureStorageService.storeBiometricKey(encryptionKey);
      }

      setUser(data.user);
      setMasterKeyState(encryptionKey);
      setIsFirstTime(false);
      
      console.log('Registration successful for:', email);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Starting login process for:', email);

      // Get stored salt - this is critical for consistency
      let salt = await SecureStorageService.getUserSalt();
      
      if (!salt) {
        console.log('No salt found, generating new one');
        // If no salt is stored, we need to handle this case
        // For now, let's try with a fallback approach
        Alert.alert(
          'Dados Não Encontrados',
          'Não foi possível encontrar os dados de login. Você precisará se registrar novamente.',
          [{ text: 'OK' }]
        );
        setIsFirstTime(true);
        return;
      }

      console.log('Using stored salt for login');

      // Hash password for server verification - ensure consistency
      const masterPasswordHash = await EncryptionService.hashMasterPassword(password, salt);
      
      // Derive encryption key - must be identical to registration
      const encryptionKey = await EncryptionService.deriveKey(password, salt);

      console.log('Attempting login with hashed password');

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

      const responseText = await response.text();
      console.log('Login response:', response.status, responseText);

      if (!response.ok) {
        let errorMessage = 'Credenciais inválidas';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.detail || errorMessage;
        } catch (parseError) {
          console.error('Error parsing login response:', parseError);
        }
        
        if (response.status === 401) {
          // Clear potentially corrupted data
          console.log('Login failed - clearing stored data');
          await SecureStorageService.clearAllData();
          setIsFirstTime(true);
          errorMessage = 'Credenciais inválidas. Dados locais foram limpos. Tente se registrar novamente.';
        }
        
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      console.log('Login successful');
      
      // Store user data and tokens
      await SecureStorageService.storeAccessToken(data.access_token);
      await SecureStorageService.storeUserData(data.user);
      await SecureStorageService.storeMasterKey(encryptionKey);

      setUser(data.user);
      setMasterKeyState(encryptionKey);
      
      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login error:', error);
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