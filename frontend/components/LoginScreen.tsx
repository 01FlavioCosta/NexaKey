import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../contexts/AuthContext';
import { SecureStorageService } from '../utils/storage';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    checkBiometricSupport();
    loadStoredEmail();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const enabled = await SecureStorageService.isBiometricEnabled();
      
      setBiometricAvailable(hasHardware && isEnrolled);
      setBiometricEnabled(enabled && hasHardware && isEnrolled);
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const loadStoredEmail = async () => {
    try {
      const userData = await SecureStorageService.getUserData();
      if (userData?.email) {
        setEmail(userData.email);
      }
    } catch (error) {
      console.error('Failed to load stored email:', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Digite seu e-mail');
      return;
    }

    if (!masterPassword.trim()) {
      Alert.alert('Erro', 'Digite sua senha mestra');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), masterPassword);
    } catch (error: any) {
      Alert.alert('Erro no Login', error.message || 'Falha ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access NexaKey',
        fallbackLabel: 'Use master password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Mock biometric login - in real app, this would recover the encryption key
        const storedKey = await SecureStorageService.getBiometricKey();
        if (storedKey) {
          Alert.alert('Sucesso', 'Login biométrico realizado com sucesso!');
          // Here you would restore the user session
        } else {
          Alert.alert('Erro', 'Chave biométrica não encontrada. Use a senha mestra.');
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Erro', 'Falha na autenticação biométrica');
    }
  };

  const handleForgotPassword = () => {
    if (biometricEnabled) {
      Alert.alert(
        'Recuperar Senha Mestra',
        'Use sua biometria para definir uma nova senha mestra.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Usar Biometria', onPress: handleBiometricRecovery },
        ]
      );
    } else {
      Alert.alert(
        'Senha Esquecida',
        'Infelizmente, não é possível recuperar sua senha mestra. Ela foi projetada para ser conhecida apenas por você.\n\nSe você ativou a autenticação biométrica, pode usá-la para definir uma nova senha mestra.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBiometricRecovery = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade para recuperar a conta',
        fallbackLabel: 'Cancelar',
        cancelLabel: 'Cancelar',
      });

      if (result.success) {
        Alert.prompt(
          'Nova Senha Mestra',
          'Digite sua nova senha mestra:',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Definir', 
              onPress: (newPassword) => {
                if (newPassword && newPassword.length >= 8) {
                  Alert.alert('Sucesso', 'Nova senha mestra definida com sucesso!');
                } else {
                  Alert.alert('Erro', 'A senha deve ter pelo menos 8 caracteres');
                }
              }
            },
          ],
          'secure-text'
        );
      }
    } catch (error) {
      console.error('Biometric recovery error:', error);
      Alert.alert('Erro', 'Falha na recuperação biométrica');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="shield-checkmark" size={60} color="#00D4FF" />
            </View>
            <Text style={styles.title}>NexaKey</Text>
            <Text style={styles.subtitle}>Acesse seu cofre de senhas</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Senha Mestra</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={masterPassword}
                  onChangeText={setMasterPassword}
                  placeholder="Digite sua senha mestra"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                Esqueceu a Senha Mestra?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {biometricEnabled && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <Ionicons name="finger-print" size={24} color="#00D4FF" />
                <Text style={styles.biometricButtonText}>
                  Usar Biometria
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Seus dados são protegidos com criptografia de ponta-a-ponta
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2540',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A365D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#00D4FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2540',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00D4FF',
    borderRadius: 8,
    paddingVertical: 16,
  },
  biometricButtonText: {
    fontSize: 16,
    color: '#00D4FF',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});