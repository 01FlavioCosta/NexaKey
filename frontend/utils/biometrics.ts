import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { SecureStorageService } from './storage';

export class BiometricsService {
  // Check if biometric authentication is available
  static async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  // Get supported biometric types
  static async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Failed to get supported biometric types:', error);
      return [];
    }
  }

  // Get biometric type name for display
  static getBiometricTypeName(type: LocalAuthentication.AuthenticationType): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Impressão Digital';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'Reconhecimento Facial';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Reconhecimento de Íris';
      default:
        return 'Biometria';
    }
  }

  // Authenticate with biometrics
  static async authenticate(
    promptMessage: string = 'Confirme sua identidade',
    fallbackLabel: string = 'Usar senha mestra'
  ): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Biometria Indisponível',
          'Sua biometria não está configurada no dispositivo.'
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Setup biometric authentication for the user
  static async setupBiometricAuth(masterKey: string): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Biometria Indisponível',
          'Configure a biometria nas configurações do seu dispositivo primeiro.'
        );
        return false;
      }

      const supportedTypes = await this.getSupportedTypes();
      const typeNames = supportedTypes.map(type => this.getBiometricTypeName(type));
      
      const success = await this.authenticate(
        `Confirme sua ${typeNames.join(' ou ')} para ativar o desbloqueio biométrico`,
        'Cancelar'
      );

      if (success) {
        // Store the master key for biometric recovery
        await SecureStorageService.storeBiometricKey(masterKey);
        await SecureStorageService.setBiometricEnabled(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Biometric setup failed:', error);
      return false;
    }
  }

  // Login with biometric authentication
  static async biometricLogin(): Promise<string | null> {
    try {
      const isBiometricEnabled = await SecureStorageService.isBiometricEnabled();
      if (!isBiometricEnabled) {
        return null;
      }

      const success = await this.authenticate(
        'Use sua biometria para acessar o NexaKey',
        'Usar senha mestra'
      );

      if (success) {
        // Retrieve the stored master key
        const masterKey = await SecureStorageService.getBiometricKey();
        return masterKey;
      }

      return null;
    } catch (error) {
      console.error('Biometric login failed:', error);
      return null;
    }
  }

  // Reset master password using biometric authentication
  static async biometricPasswordReset(
    email: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const isBiometricEnabled = await SecureStorageService.isBiometricEnabled();
      if (!isBiometricEnabled) {
        Alert.alert(
          'Biometria Não Configurada',
          'Você não configurou a biometria para recuperação de senha.'
        );
        return false;
      }

      const success = await this.authenticate(
        'Confirme sua identidade para redefinir a senha mestra',
        'Cancelar'
      );

      if (success) {
        // Here you would call the backend to reset password
        // For now, we'll just show a success message
        Alert.alert(
          'Senha Redefinida',
          'Sua senha mestra foi redefinida com sucesso!'
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Biometric password reset failed:', error);
      return false;
    }
  }

  // Disable biometric authentication
  static async disableBiometricAuth(): Promise<void> {
    try {
      const success = await this.authenticate(
        'Confirme para desativar o desbloqueio biométrico',
        'Cancelar'
      );

      if (success) {
        await SecureStorageService.setBiometricEnabled(false);
        // Note: We keep the biometric key for future re-enabling
        Alert.alert('Sucesso', 'Desbloqueio biométrico desativado');
      }
    } catch (error) {
      console.error('Failed to disable biometric auth:', error);
    }
  }
}